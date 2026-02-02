import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { OrderModificationService } from '../services/order-modification.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const modificationService = new OrderModificationService();

// Modification schema
const modifyOrderSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.enum(['IN', 'AE', 'UK']),
  }).optional(),
  deliveryOption: z.enum(['standard', 'express', 'click_collect']).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/orders/:orderId/modify
 * Request order modification
 */
router.post('/:orderId/modify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = modifyOrderSchema.parse(req.body);

    const modification = await modificationService.requestModification({
      orderId: req.params.orderId,
      userId: req.user.sub,
      changes: data,
    });

    res.status(201).json({
      success: true,
      data: modification,
      message: 'Modification request submitted',
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
 * GET /api/orders/:orderId/modifications
 * Get order modifications
 */
router.get('/:orderId/modifications', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const modifications = await modificationService.getOrderModifications(
      req.params.orderId,
      req.user.sub
    );

    res.json({
      success: true,
      data: modifications,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/modifications/:modificationId/approve
 * Approve modification (Admin/Seller)
 */
router.post('/modifications/:modificationId/approve', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const modification = await modificationService.approveModification(
      req.params.modificationId,
      req.user.sub
    );

    res.json({
      success: true,
      data: modification,
      message: 'Modification approved',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/modifications/:modificationId/reject
 * Reject modification (Admin/Seller)
 */
router.post('/modifications/:modificationId/reject', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { reason } = req.body;

    const modification = await modificationService.rejectModification(
      req.params.modificationId,
      req.user.sub,
      reason
    );

    res.json({
      success: true,
      data: modification,
      message: 'Modification rejected',
    });
  } catch (error) {
    next(error);
  }
});

export { router as modificationRouter };
