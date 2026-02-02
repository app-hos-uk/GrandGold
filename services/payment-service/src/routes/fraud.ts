import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const fraudService = new FraudDetectionService();

const fraudCheckSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  country: z.string().length(2),
  paymentMethod: z.string(),
  ipAddress: z.string().optional(),
  deviceId: z.string().optional(),
  billingAddress: z.any().optional(),
  shippingAddress: z.any().optional(),
});

/**
 * POST /api/payments/fraud/check
 * Check transaction for fraud
 */
router.post('/fraud/check', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const data = fraudCheckSchema.parse(req.body);

    const result = await fraudService.checkFraud({
      userId: req.user.sub,
      ...data,
      ipAddress: data.ipAddress || req.ip || req.socket.remoteAddress || '0.0.0.0',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

export { router as fraudRouter };
