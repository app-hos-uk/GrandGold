import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';

// In-memory store for demo
const ratingStore = new Map<string, any>();
const reviewStore = new Map<string, any>();

interface CreateRatingInput {
  orderId: string;
  sellerId: string;
  customerId: string;
  rating: number; // 1-5
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
}

export class RatingService {
  /**
   * Create a rating/review
   */
  async createRating(input: CreateRatingInput): Promise<any> {
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Check if order exists and belongs to customer
    const orderExists = true; // In production, verify order
    if (!orderExists) {
      throw new NotFoundError('Order');
    }

    // Check if already rated
    const existing = Array.from(reviewStore.values()).find(
      (r) => r.orderId === input.orderId && r.customerId === input.customerId
    );

    if (existing) {
      throw new ValidationError('Order already reviewed');
    }

    const reviewId = generateId('rev');
    const review = {
      id: reviewId,
      orderId: input.orderId,
      sellerId: input.sellerId,
      customerId: input.customerId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      images: input.images || [],
      tags: input.tags || [],
      isVerifiedPurchase: true,
      helpfulCount: 0,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    reviewStore.set(reviewId, review);

    // Update seller rating
    await this.updateSellerRating(input.sellerId);

    return review;
  }

  /**
   * Get seller ratings
   */
  async getSellerRatings(
    sellerId: string,
    options: { page: number; limit: number; rating?: number }
  ): Promise<{
    data: any[];
    total: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  }> {
    let reviews = Array.from(reviewStore.values())
      .filter((r) => r.sellerId === sellerId && r.status === 'published')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.rating) {
      reviews = reviews.filter((r) => r.rating === options.rating);
    }

    const total = reviews.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = reviews.slice(start, start + options.limit);

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return {
      data: paginatedData,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }

  /**
   * Get product ratings
   */
  async getProductRatings(
    productId: string,
    options: { page: number; limit: number }
  ): Promise<{ data: any[]; total: number; averageRating: number }> {
    // In production, link reviews to products
    const reviews = Array.from(reviewStore.values())
      .filter((r) => r.status === 'published')
      .slice(0, options.limit);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      data: reviews,
      total: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    const review = reviewStore.get(reviewId);

    if (!review) {
      throw new NotFoundError('Review');
    }

    // Check if already marked
    if (!review.helpfulBy) {
      review.helpfulBy = [];
    }

    if (review.helpfulBy.includes(userId)) {
      throw new ValidationError('Already marked as helpful');
    }

    review.helpfulBy.push(userId);
    review.helpfulCount = review.helpfulBy.length;
    review.updatedAt = new Date();

    reviewStore.set(reviewId, review);

    return { helpfulCount: review.helpfulCount };
  }

  /**
   * Report review
   */
  async reportReview(reviewId: string, userId: string, reason: string): Promise<void> {
    const review = reviewStore.get(reviewId);

    if (!review) {
      throw new NotFoundError('Review');
    }

    // In production, create moderation ticket
    review.reportedBy = review.reportedBy || [];
    review.reportedBy.push({ userId, reason, reportedAt: new Date() });

    if (review.reportedBy.length >= 3) {
      review.status = 'under_review';
    }

    reviewStore.set(reviewId, review);
  }

  /**
   * Update seller rating statistics
   */
  private async updateSellerRating(sellerId: string): Promise<void> {
    const reviews = Array.from(reviewStore.values()).filter(
      (r) => r.sellerId === sellerId && r.status === 'published'
    );

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const totalReviews = reviews.length;

    // Update seller rating in seller store
    const rating = {
      sellerId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
      updatedAt: new Date(),
    };

    ratingStore.set(sellerId, rating);
  }

  /**
   * Get seller rating summary
   */
  async getSellerRatingSummary(sellerId: string): Promise<any> {
    const rating = ratingStore.get(sellerId);

    if (!rating) {
      return {
        sellerId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    return rating;
  }
}
