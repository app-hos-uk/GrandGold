import { Router, Request, Response, NextFunction } from 'express';
import { RecentlyViewedService } from '../services/recently-viewed.service';
import { optionalAuth } from '../middleware/auth';
import type { Country } from '@grandgold/types';

const router = Router();
const recentlyViewedService = new RecentlyViewedService();

/**
 * POST /api/recently-viewed
 * Add product to recently viewed
 */
router.post('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const country = (req.body.country as Country) || (req.query.country as Country) || 'IN';

    const userIdOrSessionId = req.user?.sub || req.headers['x-session-id'] || req.cookies?.session_id || 'anonymous';
    const id = typeof userIdOrSessionId === 'string' ? userIdOrSessionId : 'anonymous';

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { message: 'productId is required' },
      });
    }

    await recentlyViewedService.addProduct(id, productId, country);

    res.json({
      success: true,
      message: 'Product added to recently viewed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recently-viewed
 * Get recently viewed product IDs
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as Country) || 'IN';
    const limit = parseInt(req.query.limit as string) || 10;

    const userIdOrSessionId = req.user?.sub || req.headers['x-session-id'] || req.cookies?.session_id || 'anonymous';
    const id = typeof userIdOrSessionId === 'string' ? userIdOrSessionId : 'anonymous';

    const productIds = await recentlyViewedService.getRecentlyViewed(id, country, limit);

    res.json({
      success: true,
      data: { productIds },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/recently-viewed
 * Clear recently viewed
 */
router.delete('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as Country) || 'IN';

    const userIdOrSessionId = req.user?.sub || req.headers['x-session-id'] || req.cookies?.session_id || 'anonymous';
    const id = typeof userIdOrSessionId === 'string' ? userIdOrSessionId : 'anonymous';

    await recentlyViewedService.clear(id, country);

    res.json({
      success: true,
      message: 'Recently viewed cleared',
    });
  } catch (error) {
    next(error);
  }
});

export { router as recentlyViewedRouter };
