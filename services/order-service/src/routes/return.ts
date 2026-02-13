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
  reason: z.enum([
    'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'size_issue',
    'purity_mismatch', 'weight_discrepancy', 'stone_missing', 'stone_damaged',
    'hallmark_issue', 'certificate_mismatch', 'other',
  ]),
  reasonDetails: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  preferredResolution: z.enum(['refund', 'exchange', 'store_credit', 'gold_credit']),
});

// QC inspection schema
const qcInspectionSchema = z.object({
  originalWeightGrams: z.number().positive(),
  returnedWeightGrams: z.number().positive(),
  originalPurity: z.string(),
  testedPurity: z.string(),
  purityVerdict: z.enum(['pass', 'fail', 'skipped']),
  purityTestMethod: z.enum(['xrf', 'touchstone', 'acid_test', 'fire_assay']).optional(),
  stonesIntact: z.boolean(),
  stonesCount: z.number().int().min(0),
  stonesVerdict: z.enum(['pass', 'fail', 'na']),
  hallmarkVerified: z.boolean(),
  hallmarkNumber: z.string().optional(),
  itemCondition: z.enum(['as_new', 'minor_wear', 'damaged', 'tampered']),
  conditionNotes: z.string().optional(),
  qcPhotos: z.array(z.string()).optional(),
});

// Resolve schema
const resolveReturnSchema = z.object({
  resolution: z.enum(['refund', 'exchange', 'store_credit', 'gold_credit']),
  exchangeProductId: z.string().optional(),
  currentGoldRate: z.number().positive().optional(),
  manualRefundAmount: z.number().positive().optional(),
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
 * GET /api/orders/returns/gold-credit
 * Get customer's gold credit balance
 */
router.get('/returns/gold-credit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const balance = returnService.getGoldCreditBalance(req.user.sub);

    res.json({
      success: true,
      data: balance,
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

// ─── SOP Steps (Admin) ──────────────────────────────────────────────

/**
 * POST /api/orders/returns/:returnId/receive
 * Mark returned item as received at warehouse (Admin)
 */
router.post(
  '/returns/:returnId/receive',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager', 'staff'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      const returnRequest = await returnService.receiveReturn(
        req.params.returnId,
        req.user.sub
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Return item received — ready for QC inspection',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/qc
 * Submit QC inspection results (Admin/QC Inspector)
 */
router.post(
  '/returns/:returnId/qc',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager', 'staff'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      const qcData = qcInspectionSchema.parse(req.body);

      const returnRequest = await returnService.submitQCInspection(
        req.params.returnId,
        req.user.sub,
        {
          ...qcData,
          weightVarianceGrams: 0,   // calculated by service
          weightToleranceGrams: 0,  // set by service
          weightVerdict: 'pass',    // calculated by service
          inspectedBy: req.user.sub,
          inspectedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        data: returnRequest,
        message: `QC inspection complete — verdict: ${returnRequest.status}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('QC data validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/resolve
 * Resolve return: refund / exchange / store_credit / gold_credit (Admin)
 */
router.post(
  '/returns/:returnId/resolve',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      const data = resolveReturnSchema.parse(req.body);

      const returnRequest = await returnService.resolveReturn(
        req.params.returnId,
        req.user.sub,
        data.resolution,
        {
          exchangeProductId: data.exchangeProductId,
          currentGoldRate: data.currentGoldRate,
          manualRefundAmount: data.manualRefundAmount,
        }
      );

      res.json({
        success: true,
        data: returnRequest,
        message: `Return resolved: ${data.resolution}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/complete-refund
 * Mark refund as completed with transaction ID (Admin/System)
 */
router.post(
  '/returns/:returnId/complete-refund',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactionId } = req.body;
      if (!transactionId) throw new ValidationError('transactionId is required');

      const returnRequest = await returnService.completeRefund(
        req.params.returnId,
        transactionId
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Refund completed',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/complete-exchange
 * Complete exchange with new order ID (Admin)
 */
router.post(
  '/returns/:returnId/complete-exchange',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { exchangeOrderId, priceDifference } = req.body;
      if (!exchangeOrderId) throw new ValidationError('exchangeOrderId is required');

      const returnRequest = await returnService.completeExchange(
        req.params.returnId,
        exchangeOrderId,
        priceDifference || 0
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Exchange completed',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/returns/:returnId/close
 * Close return request (Admin)
 */
router.post(
  '/returns/:returnId/close',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      const returnRequest = await returnService.closeReturn(
        req.params.returnId,
        req.user.sub
      );

      res.json({
        success: true,
        data: returnRequest,
        message: 'Return closed',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as returnRouter };
