import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { PriceLockService } from '../services/price-lock.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const priceLockService = new PriceLockService();

// Price lock schema
const createPriceLockSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
  })).min(1),
  country: z.enum(['IN', 'AE', 'UK']),
});

/**
 * POST /api/price-lock
 * Create a price lock for checkout
 * Freezes the gold price for 5 minutes
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPriceLockSchema.parse(req.body);
    
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const priceLock = await priceLockService.createPriceLock({
      userId: req.user.sub,
      items: data.items,
      country: data.country,
    });
    
    res.status(201).json({
      success: true,
      data: priceLock,
      message: `Price locked for ${priceLock.expiresIn} seconds`,
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
 * GET /api/price-lock/:id
 * Get price lock details
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const priceLock = await priceLockService.getPriceLock(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: priceLock,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/price-lock/:id/validate
 * Validate that a price lock is still active
 */
router.post('/:id/validate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const validation = await priceLockService.validatePriceLock(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/price-lock/:id/use
 * Mark price lock as used (for order creation)
 */
router.post('/:id/use', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await priceLockService.usePriceLock(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Price lock consumed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/price-lock/:id
 * Cancel a price lock
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await priceLockService.cancelPriceLock(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Price lock cancelled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/price-lock/user/active
 * Get user's active price locks
 */
router.get('/user/active', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const priceLocks = await priceLockService.getUserActiveLocks(req.user.sub);
    
    res.json({
      success: true,
      data: priceLocks,
    });
  } catch (error) {
    next(error);
  }
});

export { router as priceLockRouter };
