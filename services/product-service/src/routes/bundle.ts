import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { BundleService } from '../services/bundle.service';
import { authenticate, optionalAuth } from '../middleware/auth';
import type { Country } from '@grandgold/types';

const router = Router();
const bundleService = new BundleService();

const createBundleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).min(2),
  discountPercent: z.number().min(0).max(100).optional(),
  bundlePrice: z.number().positive().optional(),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).min(1),
});

/**
 * POST /api/bundles
 * Create bundle
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const data = createBundleSchema.parse(req.body);

    const bundle = await bundleService.createBundle({
      ...data,
      sellerId: req.user.sub,
    });

    res.status(201).json({
      success: true,
      data: bundle,
      message: 'Bundle created',
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
 * GET /api/bundles/:id
 * Get bundle with products
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as Country) || 'IN';

    const bundle = await bundleService.getBundle(req.params.id, country);

    res.json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bundles/product/:productId
 * Get bundles containing product
 */
router.get('/product/:productId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as Country) || 'IN';

    const bundles = await bundleService.getBundlesForProduct(req.params.productId, country);

    res.json({
      success: true,
      data: bundles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/bundles/:id
 * Update bundle
 */
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const bundle = await bundleService.updateBundle(
      req.params.id,
      req.user.sub,
      req.body
    );

    res.json({
      success: true,
      data: bundle,
      message: 'Bundle updated',
    });
  } catch (error) {
    next(error);
  }
});

export { router as bundleRouter };
