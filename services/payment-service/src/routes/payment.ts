import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { PaymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const paymentService = new PaymentService();

// Payment intent schema
const createPaymentSchema = z.object({
  checkoutId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(['INR', 'AED', 'GBP', 'USD']),
  paymentMethod: z.enum(['card', 'upi', 'netbanking', 'wallet', 'emi']),
  country: z.enum(['IN', 'AE', 'UK']),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/payments/create
 * Create a payment intent
 */
router.post('/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const data = createPaymentSchema.parse(req.body);
    
    const paymentIntent = await paymentService.createPayment({
      userId: req.user.sub,
      ...data,
    });
    
    res.json({
      success: true,
      data: paymentIntent,
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
 * GET /api/payments/:paymentId
 * Get payment details
 */
router.get('/:paymentId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const payment = await paymentService.getPayment(req.params.paymentId, req.user.sub);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/:paymentId/confirm
 * Confirm a payment
 */
router.post('/:paymentId/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { paymentMethodId } = req.body;
    
    const result = await paymentService.confirmPayment(
      req.params.paymentId,
      req.user.sub,
      paymentMethodId
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/:paymentId/cancel
 * Cancel a payment
 */
router.post('/:paymentId/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await paymentService.cancelPayment(req.params.paymentId, req.user.sub);
    
    res.json({
      success: true,
      data: result,
      message: 'Payment cancelled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/methods
 * Get available payment methods for country
 */
router.get('/methods/:country', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = await paymentService.getPaymentMethods(req.params.country as any);
    
    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/emi-options
 * Get EMI options for amount
 */
router.get('/emi-options', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = parseFloat(req.query.amount as string);
    const country = req.query.country as string;
    
    const emiOptions = await paymentService.getEmiOptions(amount, country as any);
    
    res.json({
      success: true,
      data: emiOptions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/calculate-emi
 * Calculate EMI breakdown
 */
router.post('/calculate-emi', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, tenure, interestRate } = req.body;
    
    const emi = await paymentService.calculateEmi(amount, tenure, interestRate);
    
    res.json({
      success: true,
      data: emi,
    });
  } catch (error) {
    next(error);
  }
});

export { router as paymentRouter };
