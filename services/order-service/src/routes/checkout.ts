import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { CheckoutService } from '../services/checkout.service';
import { VeilService } from '../services/veil.service';
import { LogisticsService } from '../services/logistics.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const checkoutService = new CheckoutService();
const veilService = new VeilService();
const logisticsService = new LogisticsService();

// Checkout initiation schema
const initiateCheckoutSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.enum(['IN', 'AE', 'UK']),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  billingAddress: z.object({
    sameAsShipping: z.boolean(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.enum(['IN', 'AE', 'UK']).optional(),
  }),
  deliveryOption: z.enum(['standard', 'express', 'click_collect']),
  notes: z.string().optional(),
  // Phase 3 enhancements
  giftWrapping: z.boolean().optional(),
  giftMessage: z.string().max(500).optional(),
  insuranceIncluded: z.boolean().optional(),
  scheduledDeliveryDate: z.string().optional(), // ISO date string
  isExpressCheckout: z.boolean().optional(),
});

/**
 * POST /api/checkout/initiate
 * Initiate checkout process
 */
router.post('/initiate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const data = initiateCheckoutSchema.parse(req.body);
    
    const checkout = await checkoutService.initiateCheckout(req.user.sub, data);
    
    res.json({
      success: true,
      data: checkout,
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
 * GET /api/checkout/shipping-quotes
 * Get real-time shipping quotes (no auth required)
 */
router.get('/shipping-quotes', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const postalCode = (req.query.postalCode as string) || '';
    const subtotal = parseFloat(req.query.subtotal as string) || 0;

    const quotes = await logisticsService.getShippingQuotes(
      country,
      postalCode,
      subtotal
    );

    res.json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkout/delivery-estimate
 * Get delivery time estimate
 */
router.get('/delivery-estimate', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const postalCode = (req.query.postalCode as string) || '';

    const estimate = await logisticsService.getDeliveryEstimate(
      country,
      postalCode
    );

    res.json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/validate-location
 * Validate map picker coordinates (geofencing)
 */
router.post('/validate-location', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, lat, lng } = req.body;
    const result = await logisticsService.validateDeliveryLocation(
      country || 'IN',
      parseFloat(lat),
      parseFloat(lng)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkout/import-duty
 * Calculate import duty for cross-border
 */
router.get('/import-duty', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const productValue = parseFloat(req.query.productValue as string) || 0;
    const category = (req.query.category as string) || 'jewelry';

    const duty = await logisticsService.calculateImportDuty(
      country,
      productValue,
      category
    );
    res.json({ success: true, data: duty });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkout/:checkoutId
 * Get checkout details
 */
router.get('/:checkoutId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const checkout = await checkoutService.getCheckout(req.params.checkoutId, req.user.sub);
    
    // At checkout page, reveal seller info partially
    const unveiledCheckout = veilService.partialUnveil(checkout);
    
    res.json({
      success: true,
      data: unveiledCheckout,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/:checkoutId/calculate
 * Calculate totals with shipping, tax, and duties
 */
router.post('/:checkoutId/calculate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { promoCode } = req.body;
    
    const totals = await checkoutService.calculateTotals(
      req.params.checkoutId,
      req.user.sub,
      promoCode
    );
    
    res.json({
      success: true,
      data: totals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/:checkoutId/promo
 * Apply promo code
 */
router.post('/:checkoutId/promo', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { code } = req.body;
    
    const result = await checkoutService.applyPromoCode(
      req.params.checkoutId,
      req.user.sub,
      code
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
 * DELETE /api/checkout/:checkoutId/promo
 * Remove promo code
 */
router.delete('/:checkoutId/promo', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await checkoutService.removePromoCode(
      req.params.checkoutId,
      req.user.sub
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
 * POST /api/checkout/:checkoutId/confirm
 * Confirm checkout and create order
 */
router.post('/:checkoutId/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { paymentIntentId, paymentMethod } = req.body;
    
    const order = await checkoutService.confirmCheckout(
      req.params.checkoutId,
      req.user.sub,
      { paymentIntentId, paymentMethod }
    );
    
    // After payment, fully reveal seller info
    const fullOrder = veilService.fullyUnveil(order);
    
    res.json({
      success: true,
      data: fullOrder,
      message: 'Order placed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkout/:checkoutId/shipping-options
 * Get available shipping options
 */
router.get('/:checkoutId/shipping-options', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const options = await checkoutService.getShippingOptions(
      req.params.checkoutId,
      req.user.sub
    );
    
    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkout/:checkoutId/click-collect
 * Set click and collect location
 */
router.post('/:checkoutId/click-collect', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { storeId, collectionDate, collectionTime } = req.body;
    
    const result = await checkoutService.setClickCollect(
      req.params.checkoutId,
      req.user.sub,
      { storeId, collectionDate, collectionTime }
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as checkoutRouter };
