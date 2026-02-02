import { Router, Request, Response, NextFunction } from 'express';
import { ComparisonService } from '../services/comparison.service';
import type { Country } from '@grandgold/types';

const router = Router();
const comparisonService = new ComparisonService();

/**
 * GET /api/products/compare
 * Compare up to 4 products
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = (req.query.ids as string)?.split(',').filter(Boolean) || [];
    const country = (req.query.country as Country) || 'IN';

    const result = await comparisonService.compareProducts(ids, country);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as comparisonRouter };
