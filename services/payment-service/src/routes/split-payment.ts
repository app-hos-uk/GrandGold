import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { SplitPaymentService } from '../services/split-payment.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const splitPaymentService = new SplitPaymentService();

const splitPaymentSchema = z.object({
  totalAmount: z.number().positive(),
  currency: z.string().length(3),
  orderId: z.string().min(1),
  methods: z.array(z.object({
    type: z.enum(['card', 'wallet', 'upi', 'bank_transfer']),
    amount: z.number().positive(),
    provider: z.string().optional(),
    paymentMethodId: z.string().optional(),
  })).min(2).max(3),
});

/**
 * POST /api/payments/split
 * Process split payment (multiple payment methods)
 */
router.post('/split', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const data = splitPaymentSchema.parse(req.body);

    const validation = splitPaymentService.validateSplitPayment(data);
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid split payment');
    }

    const result = await splitPaymentService.processSplitPayment(
      data,
      req.user.sub,
      data.orderId
    );

    res.json({
      success: true,
      data: result,
      message: result.success ? 'Payment successful' : 'Some payments failed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

export { router as splitPaymentRouter };
