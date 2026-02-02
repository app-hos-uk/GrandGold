import { Router, Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkout.service';

const router = Router();
const checkoutService = new CheckoutService();

// Initialize checkout
router.post('/initiate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const input = req.body;
    
    const checkout = await checkoutService.initiateCheckout(userId, input);
    
    res.json({ success: true, data: checkout });
  } catch (error) {
    next(error);
  }
});

// Get checkout session
router.get('/:checkoutId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    
    const checkout = await checkoutService.getCheckout(checkoutId, userId);
    
    res.json({ success: true, data: checkout });
  } catch (error) {
    next(error);
  }
});

// Calculate totals
router.post('/:checkoutId/totals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    const { promoCode } = req.body;
    
    const totals = await checkoutService.calculateTotals(checkoutId, userId, promoCode);
    
    res.json({ success: true, data: totals });
  } catch (error) {
    next(error);
  }
});

// Apply promo code
router.post('/:checkoutId/promo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    const { code } = req.body;
    
    const result = await checkoutService.applyPromoCode(checkoutId, userId, code);
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Remove promo code
router.delete('/:checkoutId/promo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    
    const result = await checkoutService.removePromoCode(checkoutId, userId);
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get shipping options
router.get('/:checkoutId/shipping', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    
    const options = await checkoutService.getShippingOptions(checkoutId, userId);
    
    res.json({ success: true, data: options });
  } catch (error) {
    next(error);
  }
});

// Set click & collect
router.post('/:checkoutId/click-collect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    const data = req.body;
    
    const checkout = await checkoutService.setClickCollect(checkoutId, userId, data);
    
    res.json({ success: true, data: checkout });
  } catch (error) {
    next(error);
  }
});

// Confirm checkout (place order)
router.post('/:checkoutId/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { checkoutId } = req.params;
    const payment = req.body;
    
    const order = await checkoutService.confirmCheckout(checkoutId, userId, payment);
    
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export { router as checkoutRouter };
