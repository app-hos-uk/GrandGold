import { Router, Request, Response, NextFunction } from 'express';
import { GoldPriceService } from '../services/gold-price.service';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const goldPriceService = new GoldPriceService();

/**
 * GET /api/fintech/price/history
 * Get gold price history
 */
router.get('/history', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as '7d' | '30d' | '90d' | '365d') || '30d';
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const purity = req.query.purity as string;

    const history = await goldPriceService.getPriceHistory(
      period,
      country,
      purity as any
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

export { router as priceHistoryRouter };
