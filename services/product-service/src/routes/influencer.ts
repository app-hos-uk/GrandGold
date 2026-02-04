import { Router, Request, Response, NextFunction } from 'express';
import { getRack, setRack, listRacks, getCommissionSummary } from '../lib/influencer-racks';
import { ProductService } from '../services/product.service';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();
const productService = new ProductService();

// Admin roles allowed to manage influencer racks
const ADMIN_ROLES = ['super_admin', 'country_admin'];

/**
 * GET /api/influencers
 * List all influencer racks (admin / storefront list)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const racks = await listRacks();
    res.json({ success: true, data: { racks } });
  } catch (error) {
    // Return 503 with empty fallback so frontend degrades gracefully but error is visible
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Failed to load influencer racks' },
      data: { racks: [] },
    });
  }
});

/**
 * POST /api/influencers
 * Create a new influencer rack (admin only)
 */
router.post('/', authenticate, authorize(...ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, name, bio, productIds, commissionRate } = req.body || {};
    if (!slug || typeof slug !== 'string' || !name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'slug and name are required' } });
    }
    const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const rack = {
      slug: safeSlug,
      name: (name as string).trim(),
      bio: typeof bio === 'string' ? bio.trim() : '',
      productIds: Array.isArray(productIds) ? productIds.map(String) : [],
      commissionRate: typeof commissionRate === 'number' ? commissionRate : 5,
    };
    await setRack(rack);
    res.status(201).json({ success: true, data: { rack } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/influencers/:slug
 * Update an influencer rack (admin only)
 */
router.put('/:slug', authenticate, authorize(...ADMIN_ROLES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await getRack(req.params.slug);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Rack not found' } });
    }
    const { name, bio, productIds, commissionRate } = req.body || {};
    const rack = {
      ...existing,
      ...(typeof name === 'string' && { name: name.trim() }),
      ...(typeof bio === 'string' && { bio: bio.trim() }),
      ...(Array.isArray(productIds) && { productIds: productIds.map(String) }),
      ...(typeof commissionRate === 'number' && { commissionRate }),
    };
    await setRack(rack);
    res.json({ success: true, data: { rack } });
  } catch (error) {
    next(error);
  }
});

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
router.get('/:slug/commission', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const summary = await getCommissionSummary(slug);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

export { router as influencerRouter };
