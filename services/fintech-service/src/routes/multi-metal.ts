import { Router, Request, Response, NextFunction } from 'express';
import { MultiMetalService } from '../services/multi-metal.service';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const multiMetalService = new MultiMetalService();

/**
 * GET /api/fintech/metals/prices
 * Get all metal prices
 */
router.get('/prices', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';

    const prices = await multiMetalService.getAllMetalPrices(country);

    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fintech/metals/:metal/price
 * Get specific metal price
 */
router.get('/:metal/price', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metal = req.params.metal as 'gold' | 'silver' | 'platinum';
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';

    const price = await multiMetalService.getMetalPrice(metal, country);

    res.json({
      success: true,
      data: price,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fintech/metals/:metal/history
 * Get metal price history
 */
router.get('/:metal/history', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metal = req.params.metal as 'gold' | 'silver' | 'platinum';
    const period = (req.query.period as '7d' | '30d' | '90d' | '365d') || '30d';
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';

    const history = await multiMetalService.getMetalPriceHistory(metal, period, country);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

export { router as multiMetalRouter };
