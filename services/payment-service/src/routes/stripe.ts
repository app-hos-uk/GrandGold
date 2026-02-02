import { Router, Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const stripeService = new StripeService();

/**
 * POST /api/payments/stripe/create-intent
 * Create Stripe payment intent
 */
router.post('/create-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { amount, currency, metadata } = req.body;
    
    const intent = await stripeService.createPaymentIntent({
      amount,
      currency,
      customerId: req.user.sub,
      metadata,
    });
    
    res.json({
      success: true,
      data: {
        clientSecret: intent.clientSecret,
        paymentIntentId: intent.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/stripe/create-setup-intent
 * Create Stripe setup intent for saving cards
 */
router.post('/create-setup-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const intent = await stripeService.createSetupIntent(req.user.sub);
    
    res.json({
      success: true,
      data: {
        clientSecret: intent.clientSecret,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/stripe/saved-cards
 * Get user's saved cards
 */
router.get('/saved-cards', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const cards = await stripeService.getSavedCards(req.user.sub);
    
    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/payments/stripe/saved-cards/:cardId
 * Delete a saved card
 */
router.delete('/saved-cards/:cardId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await stripeService.deleteCard(req.user.sub, req.params.cardId);
    
    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/stripe/confirm
 * Confirm Stripe payment
 */
router.post('/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { paymentIntentId, paymentMethodId } = req.body;
    
    const result = await stripeService.confirmPayment(paymentIntentId, paymentMethodId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as stripeRouter };
