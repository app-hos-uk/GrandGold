import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { generateId } from '@grandgold/utils';
import { CartService } from '../services/cart.service';
import { VeilService } from '../services/veil.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const cartService = new CartService();
const veilService = new VeilService();

// Add to cart schema
const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  priceAtAdd: z.number().positive().optional(),
});

const saveForLaterSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1),
});

/**
 * GET /api/cart/session
 * Get or create cart session ID for guests
 */
router.get('/session', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      return res.json({
        success: true,
        data: { cartId: req.user.sub, isLoggedIn: true },
      });
    }
    const cartId = generateId('cart');
    res.json({
      success: true,
      data: { cartId, isLoggedIn: false },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/save-for-later
 * Remove items from cart for "Save for Later" - frontend adds to wishlist separately
 */
router.post('/save-for-later', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = saveForLaterSchema.parse(req.body);
    const cartId = req.user?.sub || req.body.cartId || req.cookies?.cart_id;

    if (!cartId) {
      throw new ValidationError('Cart ID required');
    }

    let cart = await cartService.getCart(cartId);
    for (const productId of productIds) {
      cart = await cartService.removeItem(cartId, productId);
    }

    const veiledCart = veilService.veilCart(cart);

    res.json({
      success: true,
      data: { cart: veiledCart, movedProductIds: productIds },
      message: 'Items moved to save for later',
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
 * GET /api/cart
 * Get cart contents
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || (req.query.cartId as string) || req.cookies?.cart_id;

    if (!cartId && !req.user) {
      return res.json({
        success: true,
        data: {
          id: '',
          items: [],
          subtotal: 0,
          itemCount: 0,
          currency: 'INR',
          country: 'IN',
        },
      });
    }

    const effectiveCartId = cartId || (req.user ? req.user.sub : null);
    if (!effectiveCartId) {
      return res.json({
        success: true,
        data: {
          id: '',
          items: [],
          subtotal: 0,
          itemCount: 0,
          currency: 'INR',
          country: 'IN',
        },
      });
    }
    const cart = await cartService.getCart(effectiveCartId);
    
    // Apply Veil Logic to cart items - no seller info
    const veiledCart = veilService.veilCart(cart);
    
    res.json({
      success: true,
      data: veiledCart,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
router.post('/items', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = addItemSchema.parse(req.body);
    const cartId = req.user?.sub || req.body.cartId || req.cookies?.cart_id;
    const country = req.country || (req.body.country as string) || 'IN';

    if (!cartId) {
      throw new ValidationError('Cart ID required. Call GET /api/cart/session first for guests.');
    }

    const cart = await cartService.addItem(cartId, {
      ...data,
      country,
    });
    
    const veiledCart = veilService.veilCart(cart);
    
    res.json({
      success: true,
      data: veiledCart,
      message: 'Item added to cart',
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
 * PATCH /api/cart/items/:productId
 * Update cart item quantity
 */
router.patch('/items/:productId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || req.body.cartId || (req.query.cartId as string) || req.cookies?.cart_id;
    const { quantity } = req.body;
    
    if (!cartId) {
      throw new ValidationError('Cart ID required');
    }

    const cart = await cartService.updateItemQuantity(cartId, req.params.productId, quantity);
    
    const veiledCart = veilService.veilCart(cart);
    
    res.json({
      success: true,
      data: veiledCart,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/items/:productId
 * Remove item from cart
 */
router.delete('/items/:productId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || (req.query.cartId as string) || req.cookies?.cart_id;

    if (!cartId) {
      throw new ValidationError('Cart ID required');
    }

    const cart = await cartService.removeItem(cartId, req.params.productId);
    
    const veiledCart = veilService.veilCart(cart);
    
    res.json({
      success: true,
      data: veiledCart,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart
 * Clear cart
 */
router.delete('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || (req.query.cartId as string) || req.cookies?.cart_id;
    
    await cartService.clearCart(cartId);
    
    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/merge
 * Merge guest cart with user cart after login
 */
router.post('/merge', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { guestCartId } = req.body;
    
    const cart = await cartService.mergeCarts(guestCartId, req.user.sub);
    
    const veiledCart = veilService.veilCart(cart);
    
    res.json({
      success: true,
      data: veiledCart,
      message: 'Carts merged successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cart/validate
 * Validate cart before checkout
 */
router.get('/validate', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || (req.query.cartId as string) || req.cookies?.cart_id;
    
    const validation = await cartService.validateCart(cartId);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cart/count
 * Get cart item count
 */
router.get('/count', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.user?.sub || (req.query.cartId as string) || req.cookies?.cart_id;
    
    const count = await cartService.getItemCount(cartId);
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

export { router as cartRouter };
