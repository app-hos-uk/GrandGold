import { Router, Request, Response, NextFunction } from 'express';
import { SavedPaymentService } from '../services/saved-payment.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const savedPaymentService = new SavedPaymentService();

/**
 * GET /api/payments/saved
 * Get saved payment methods
 */
router.get('/saved', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const methods = await savedPaymentService.getSavedPaymentMethods(req.user.sub);

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/saved
 * Save payment method
 */
router.post('/saved', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { paymentMethodId, provider, isDefault } = req.body;

    const savedMethod = await savedPaymentService.savePaymentMethod(
      req.user.sub,
      paymentMethodId,
      provider,
      isDefault
    );

    res.status(201).json({
      success: true,
      data: savedMethod,
      message: 'Payment method saved',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/payments/saved/:methodId/default
 * Set default payment method
 */
router.patch('/saved/:methodId/default', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await savedPaymentService.setDefault(req.params.methodId, req.user.sub);

    res.json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/payments/saved/:methodId
 * Delete saved payment method
 */
router.delete('/saved/:methodId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await savedPaymentService.deletePaymentMethod(req.params.methodId, req.user.sub);

    res.json({
      success: true,
      message: 'Payment method deleted',
    });
  } catch (error) {
    next(error);
  }
});

export { router as savedPaymentRouter };
