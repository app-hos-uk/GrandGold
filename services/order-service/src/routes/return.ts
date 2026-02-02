import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ReturnService } from '../services/return.service';
import { LogisticsService } from '../services/logistics.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const returnService = new ReturnService();
const logisticsService = new LogisticsService();

// Return request schema
const createReturnSchema = z.object({
  items: z.array(z.string()).min(1),
  reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other']),
  reasonDetails: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  preferredResolution: z.enum(['refund', 'exchange', 'store_credit']),
});

/**
 * POST /api/orders/:orderId/return
 * Initiate return request
 */
router.post('/:orderId/return', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = createReturnSchema.parse(req.body);

    const returnRequest = await returnService.initiateReturn({
      orderId: req.params.orderId,
      userId: req.user.sub,
      ...data,
    });

    res.status(201).json({
      success: true,
      data: returnRequest,
      message: 'Return request submitted',
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
 * GET /api/orders/returns
 * Get user's returns
 */
router.get('/returns', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const returns = await returnService.getUserReturns(req.user.sub, { status, page, limit });

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/returns/:returnId
 * Get return details
 */
router.get('/returns/:returnId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const returnRequest = await returnService.getReturn(req.params.returnId, req.user.sub);

    res.json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/returns/:returnId/approve
 * Approve return (Admin/Seller)
 */
router.post(
  '/returns/:returnId/approve',
  authenticate,
  authorize('super_admin', 'country_admin', 'seller'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { refundAmount } = req.body;

      const returnRequest = await returnService.approveReturn(
        req.params.returnId,
        req.user.sub,
        refundAmount
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Return approved',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/reject
 * Reject return (Admin/Seller)
 */
router.post(
  '/returns/:returnId/reject',
  authenticate,
  authorize('super_admin', 'country_admin', 'seller'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { reason } = req.body;

      const returnRequest = await returnService.rejectReturn(
        req.params.returnId,
        req.user.sub,
        reason
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Return rejected',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/returns/:returnId/label
 * Get return shipping label (after approved)
 */
router.get('/returns/:returnId/label', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const returnRequest = await returnService.getReturn(req.params.returnId, req.user.sub);

    if (returnRequest.status !== 'approved' && returnRequest.status !== 'processed') {
      throw new ValidationError('Return label available after approval');
    }

    if (returnRequest.returnLabelUrl) {
      return res.json({
        success: true,
        data: {
          labelUrl: returnRequest.returnLabelUrl,
          trackingNumber: returnRequest.trackingNumber,
        },
      });
    }

    const label = await logisticsService.generateReturnLabel({
      returnId: returnRequest.id,
      orderId: returnRequest.orderId,
      address: { line1: 'Warehouse', city: 'Mumbai', postalCode: '400001', country: 'IN' },
    });

    res.json({
      success: true,
      data: label,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/returns/:returnId/cancel
 * Cancel return request (Customer)
 */
router.post('/returns/:returnId/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await returnService.cancelReturn(req.params.returnId, req.user.sub);

    res.json({
      success: true,
      message: 'Return request cancelled',
    });
  } catch (error) {
    next(error);
  }
});

export { router as returnRouter };
