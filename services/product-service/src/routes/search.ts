import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { optionalAuth, authenticate } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

/**
 * GET /api/search/admin
 * List all products for admin (no country filter)
 */
router.get('/admin', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.user as { role?: string })?.role;
    if (role !== 'super_admin' && role !== 'country_admin') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const results = await productService.listAllProducts({ page, limit, category, status });
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    // Return 503 with empty fallback data so admin dashboard degrades gracefully
    // but still indicates the backend/MeiliSearch issue for debugging
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Search service temporarily unavailable' },
      data: { data: [], total: 0 },
    });
  }
});

/**
 * GET /api/search
 * Search products
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || '';
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const category = req.query.category as string;
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined;
    const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined;
    const purity = req.query.purity as string;
    const arEnabled = req.query.arEnabled === 'true' ? true : req.query.arEnabled === 'false' ? false : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const results = await productService.searchProducts(
      query,
      country,
      {
        category,
        priceMin,
        priceMax,
        purity: purity as any,
        arEnabled,
      },
      { page, limit }
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

export { router as searchRouter };
