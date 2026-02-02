import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { RatingService } from '../services/rating.service';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();
const ratingService = new RatingService();

// Create rating schema
const createRatingSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/sellers/ratings
 * Create a rating/review (Customer)
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = createRatingSchema.parse(req.body);

    // Get seller ID from order (in production)
    const sellerId = req.body.sellerId || 'sel_mock';

    const review = await ratingService.createRating({
      ...data,
      sellerId,
      customerId: req.user.sub,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully',
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
 * GET /api/sellers/ratings/:sellerId
 * Get seller ratings
 */
router.get('/:sellerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await ratingService.getSellerRatings(req.params.sellerId, {
      page,
      limit,
      rating,
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
 * GET /api/sellers/ratings/:sellerId/summary
 * Get seller rating summary
 */
router.get('/:sellerId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await ratingService.getSellerRatingSummary(req.params.sellerId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/ratings/:reviewId/helpful
 * Mark review as helpful
 */
router.post('/:reviewId/helpful', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const result = await ratingService.markHelpful(req.params.reviewId, req.user.sub);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/ratings/:reviewId/report
 * Report a review
 */
router.post('/:reviewId/report', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { reason } = req.body;

    await ratingService.reportReview(req.params.reviewId, req.user.sub, reason);

    res.json({
      success: true,
      message: 'Review reported',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/ratings
 * Get seller's ratings (Seller view)
 */
router.get('/me/ratings', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    // Get seller ID from user
    const sellerId = req.user.sub; // In production, get actual seller ID

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await ratingService.getSellerRatings(sellerId, { page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as ratingRouter };
