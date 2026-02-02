import { Router, Request, Response, NextFunction } from 'express';
import { getRack, getCommissionSummary } from '../lib/influencer-racks';
import { ProductService } from '../services/product.service';

const router: Router = Router();
const productService = new ProductService();

/**
 * GET /api/influencers/:slug/rack
 * Get influencer curated rack with product details
 */
router.get('/:slug/rack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rack = await getRack(req.params.slug);
    if (!rack) {
      return res.status(404).json({ success: false, error: { message: 'Rack not found' } });
    }

    const products: unknown[] = [];
    for (const id of rack.productIds.slice(0, 20)) {
      try {
        const p = await productService.getProduct(id);
        if (p) products.push(p);
      } catch {
        // Fallback: add minimal product info from rack
        products.push({ id, name: `Product ${id}`, price: null, sku: id });
      }
    }

    res.json({
      success: true,
      data: { rack: { ...rack, products } },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/influencers/:slug/commission
 * Get influencer commission summary (requires auth)
 */
router.get('/:slug/commission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const summary = await getCommissionSummary(slug);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

export { router as influencerRouter };
