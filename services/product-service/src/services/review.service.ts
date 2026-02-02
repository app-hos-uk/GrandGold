import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const REVIEW_PREFIX = 'review:';
const PRODUCT_REVIEWS_PREFIX = 'product_reviews:';
const REVIEW_TTL = 60 * 60 * 24 * 365; // 1 year

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
}

export class ReviewService {
  /**
   * Create a review
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const reviewId = generateId('rev');
    const review: Review = {
      id: reviewId,
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      images: input.images || [],
      isVerifiedPurchase: input.isVerifiedPurchase ?? false,
      isApproved: false, // Requires moderation in production
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    };

    await redis.setex(
      `${REVIEW_PREFIX}${reviewId}`,
      REVIEW_TTL,
      JSON.stringify(review)
    );

    // Add to product's review list
    const productKey = `${PRODUCT_REVIEWS_PREFIX}${input.productId}`;
    const existingData = await redis.get(productKey);
    const reviewIds: string[] = existingData ? JSON.parse(existingData) : [];
    reviewIds.push(reviewId);
    await redis.setex(
      productKey,
      REVIEW_TTL,
      JSON.stringify(reviewIds)
    );

    // Update product average rating
    await this.updateProductRating(input.productId);

    return review;
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(
    productId: string,
    options: { page?: number; limit?: number; approvedOnly?: boolean } = {}
  ): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
    const { page = 1, limit = 10, approvedOnly = true } = options;
    const productKey = `${PRODUCT_REVIEWS_PREFIX}${productId}`;
    const reviewIdsData = await redis.get(productKey);

    if (!reviewIdsData) {
      const stats = await this.getProductReviewStats(productId);
      return { reviews: [], total: 0, averageRating: stats.averageRating };
    }

    const reviewIds: string[] = JSON.parse(reviewIdsData);
    const allReviews: Review[] = [];

    for (const id of reviewIds) {
      const data = await redis.get(`${REVIEW_PREFIX}${id}`);
      if (data) {
        const review = JSON.parse(data);
        if (!approvedOnly || review.isApproved) {
          allReviews.push(review);
        }
      }
    }

    // Sort by date descending
    allReviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allReviews.length;
    const start = (page - 1) * limit;
    const paginated = allReviews.slice(start, start + limit);

    const stats = await this.getProductReviewStats(productId);

    return {
      reviews: paginated,
      total,
      averageRating: stats.averageRating,
    };
  }

  /**
   * Get product review statistics
   */
  async getProductReviewStats(
    productId: string
  ): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const productKey = `${PRODUCT_REVIEWS_PREFIX}${productId}`;
    const statsKey = `product_review_stats:${productId}`;
    const cached = await redis.get(statsKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const reviewIdsData = await redis.get(productKey);
    if (!reviewIdsData) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const reviewIds: string[] = JSON.parse(reviewIdsData);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let count = 0;

    for (const id of reviewIds) {
      const data = await redis.get(`${REVIEW_PREFIX}${id}`);
      if (data) {
        const review = JSON.parse(data);
        if (review.isApproved) {
          sum += review.rating;
          count++;
          distribution[review.rating as keyof typeof distribution]++;
        }
      }
    }

    const stats = {
      averageRating: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      totalReviews: count,
      ratingDistribution: distribution,
    };

    await redis.setex(statsKey, 60 * 60, JSON.stringify(stats)); // Cache 1 hour
    return stats;
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    const data = await redis.get(`${REVIEW_PREFIX}${reviewId}`);
    if (!data) {
      throw new NotFoundError('Review');
    }

    const review = JSON.parse(data);
    const helpfulKey = `review_helpful:${reviewId}:${userId}`;
    const alreadyMarked = await redis.get(helpfulKey);

    if (!alreadyMarked) {
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      await redis.setex(`${REVIEW_PREFIX}${reviewId}`, REVIEW_TTL, JSON.stringify(review));
      await redis.setex(helpfulKey, REVIEW_TTL, '1');
    }

    return { helpfulCount: review.helpfulCount };
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getProductReviewStats(productId);
    const ratingKey = `product_rating:${productId}`;
    await redis.setex(
      ratingKey,
      60 * 60,
      JSON.stringify({
        averageRating: stats.averageRating,
        reviewCount: stats.totalReviews,
      })
    );
  }
}
