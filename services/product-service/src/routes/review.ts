import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ReviewService } from '../services/review.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const reviewService = new ReviewService();

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
  isVerifiedPurchase: z.boolean().optional(),
});

/**
 * GET /api/reviews/product/:productId
 * Get reviews for a product
 */
router.get('/product/:productId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const approvedOnly = req.query.approvedOnly !== 'false';

    const result = await reviewService.getProductReviews(req.params.productId, {
      page,
      limit,
      approvedOnly,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/product/:productId/stats
 * Get review statistics for a product
 */
router.get('/product/:productId/stats', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await reviewService.getProductReviewStats(req.params.productId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews
 * Create a review (authenticated)
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const data = createReviewSchema.parse(req.body);

    const review = await reviewService.createReview({
      ...data,
      userId: req.user.sub,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/reviews/:reviewId/helpful
 * Mark review as helpful
 */
router.post('/:reviewId/helpful', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const result = await reviewService.markHelpful(req.params.reviewId, req.user.sub);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as reviewRouter };
