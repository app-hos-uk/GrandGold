import { Router, Request, Response, NextFunction } from 'express';
import { RefundService } from '../services/refund.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const refundService = new RefundService();

/**
 * POST /api/payments/refunds/request
 * Request a refund
 */
router.post('/request', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { orderId, reason, amount } = req.body;
    
    const refund = await refundService.requestRefund({
      orderId,
      userId: req.user.sub,
      reason,
      amount,
    });
    
    res.json({
      success: true,
      data: refund,
      message: 'Refund request submitted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/refunds/:refundId
 * Get refund details
 */
router.get('/:refundId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const refund = await refundService.getRefund(req.params.refundId, req.user.sub);
    
    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/refunds
 * Get user's refunds
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const refunds = await refundService.getUserRefunds(req.user.sub, { page, limit });
    
    res.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/refunds/:refundId/approve
 * Approve refund (Admin)
 */
router.post(
  '/:refundId/approve',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const refund = await refundService.approveRefund(
        req.params.refundId,
        req.user.sub
      );
      
      res.json({
        success: true,
        data: refund,
        message: 'Refund approved',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/refunds/:refundId/reject
 * Reject refund (Admin)
 */
router.post(
  '/:refundId/reject',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { reason } = req.body;
      
      const refund = await refundService.rejectRefund(
        req.params.refundId,
        req.user.sub,
        reason
      );
      
      res.json({
        success: true,
        data: refund,
        message: 'Refund rejected',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/refunds/:refundId/process
 * Process approved refund
 */
router.post(
  '/:refundId/process',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const refund = await refundService.processRefund(req.params.refundId);
      
      res.json({
        success: true,
        data: refund,
        message: 'Refund processed',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as refundRouter };
