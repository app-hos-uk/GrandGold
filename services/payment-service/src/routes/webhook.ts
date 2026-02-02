import { Router, Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';

const router = Router();
const webhookService = new WebhookService();

/**
 * POST /api/payments/webhook/stripe
 * Stripe webhook handler
 */
router.post('/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.body;
    
    await webhookService.handleStripeWebhook(rawBody, signature);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/payments/webhook/razorpay
 * Razorpay webhook handler
 */
router.post('/razorpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;
    
    await webhookService.handleRazorpayWebhook(payload, signature);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export { router as webhookRouter };
