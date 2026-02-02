import { Router, Request, Response, NextFunction } from 'express';
import { PayPalService } from '../services/paypal.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const paypalService = new PayPalService();

/**
 * POST /api/payments/paypal/create
 * Create PayPal order
 */
router.post('/paypal/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { amount, currency, orderId, returnUrl, cancelUrl } = req.body;

    const paypalOrder = await paypalService.createOrder({
      amount,
      currency,
      orderId,
      returnUrl,
      cancelUrl,
    });

    res.json({
      success: true,
      data: paypalOrder,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/paypal/capture
 * Capture PayPal payment
 */
router.post('/paypal/capture', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { orderId } = req.body;

    const capture = await paypalService.capturePayment(orderId);

    res.json({
      success: true,
      data: capture,
      message: 'Payment captured',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/paypal/order/:orderId
 * Get PayPal order details
 */
router.get('/paypal/order/:orderId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const order = await paypalService.getOrder(req.params.orderId);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

export { router as paypalRouter };
