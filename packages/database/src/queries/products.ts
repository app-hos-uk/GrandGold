import { eq } from 'drizzle-orm';
import { db } from '../client';
import { productReviews, products } from '../schema/products';

/**
 * Get all reviews written by a specific user (used for GDPR export, profile, etc.)
 */
export async function getReviewsByUserId(userId: string) {
  return db
    .select({
      id: productReviews.id,
      productId: productReviews.productId,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      images: productReviews.images,
      isVerifiedPurchase: productReviews.isVerifiedPurchase,
      helpfulCount: productReviews.helpfulCount,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
    })
    .from(productReviews)
    .where(eq(productReviews.userId, userId))
    .orderBy(productReviews.createdAt);
}
