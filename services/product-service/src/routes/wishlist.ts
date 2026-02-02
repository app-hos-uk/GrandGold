import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { WishlistService } from '../services/wishlist.service';
import { authenticate } from '../middleware/auth';
import type { Country } from '@grandgold/types';

const router = Router();
const wishlistService = new WishlistService();

const addSchema = z.object({
  productId: z.string().min(1),
});

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const country = (req.query.country as Country) || 'IN';
    const wishlist = await wishlistService.getWishlist(req.user.sub, country);

    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wishlist
 * Add product to wishlist
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const { productId } = addSchema.parse(req.body);
    const country = (req.body.country as Country) || 'IN';

    const result = await wishlistService.addToWishlist(
      req.user.sub,
      productId,
      country
    );

    res.json({
      success: true,
      data: result,
      message: result.added ? 'Added to wishlist' : 'Already in wishlist',
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
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 */
router.delete('/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const country = (req.query.country as Country) || 'IN';
    const result = await wishlistService.removeFromWishlist(
      req.user.sub,
      req.params.productId,
      country
    );

    res.json({
      success: true,
      data: result,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wishlist/check/:productId
 * Check if product is in wishlist
 */
router.get('/check/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const country = (req.query.country as Country) || 'IN';
    const inWishlist = await wishlistService.isInWishlist(
      req.user.sub,
      req.params.productId,
      country
    );

    res.json({
      success: true,
      data: { inWishlist },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wishlist/count
 * Get wishlist item count
 */
router.get('/count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User not authenticated');

    const country = (req.query.country as Country) || 'IN';
    const count = await wishlistService.getCount(req.user.sub, country);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

export { router as wishlistRouter };
