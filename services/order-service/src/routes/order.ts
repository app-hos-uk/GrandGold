import { Router, Request, Response, NextFunction } from 'express';
import type { OrderStatus } from '@grandgold/types';
import { OrderService } from '../services/order.service';
import { VeilService } from '../services/veil.service';
import { ReorderService } from '../services/reorder.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const orderService = new OrderService();
const veilService = new VeilService();
const reorderService = new ReorderService();

/**
 * GET /api/orders
 * Get customer's orders
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const orders = await orderService.getCustomerOrders(req.user.sub, {
      status,
      page,
      limit,
    });
    
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const order = await orderService.getOrder(req.params.id, req.user.sub);
    
    // Apply Veil Logic - strip seller details until payment
    const veiledOrder = veilService.veilOrder(order as Record<string, unknown>, order.status as OrderStatus);
    
    res.json({
      success: true,
      data: veiledOrder,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id/invoice
 * Get order invoice
 */
router.get('/:id/invoice', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const invoice = await orderService.getInvoice(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { reason } = req.body;
    
    const order = await orderService.cancelOrder(req.params.id, req.user.sub, reason);
    
    res.json({
      success: true,
      data: order,
      message: 'Order cancellation requested',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/return
 * Request return for an order
 */
router.post('/:id/return', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { items, reason, images } = req.body;
    
    const returnRequest = await orderService.requestReturn(req.params.id, req.user.sub, {
      items,
      reason,
      images,
    });
    
    res.json({
      success: true,
      data: returnRequest,
      message: 'Return request submitted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/review
 * Add review for an order
 */
router.post('/:id/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { productId, rating, title, content, images } = req.body;
    
    const review = await orderService.addReview(req.params.id, req.user.sub, {
      productId,
      rating,
      title,
      content,
      images,
    });
    
    res.json({
      success: true,
      data: review,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/reorder
 * Reorder from previous order
 */
router.post('/:id/reorder', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await reorderService.reorder(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: result,
      message: `Added ${result.itemsAdded} items to cart`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/reorder/suggestions
 * Get reorder suggestions
 */
router.get('/reorder/suggestions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const suggestions = await reorderService.getReorderSuggestions(req.user.sub);
    
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes

/**
 * GET /api/orders/admin/all
 * Get all orders (Admin)
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const country = req.query.country as string;
      const status = req.query.status as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const orders = await orderService.getAllOrders({
        country,
        status,
        dateFrom,
        dateTo,
        page,
        limit,
        adminCountry: req.user.country,
      });
      
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/orders/admin/:id/status
 * Update order status (Admin)
 */
router.patch(
  '/admin/:id/status',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { status, note } = req.body;
      
      const order = await orderService.updateOrderStatus(
        req.params.id,
        status,
        req.user.sub,
        note,
        req.user.country // Pass admin's country for authorization
      );
      
      res.json({
        success: true,
        data: order,
        message: 'Order status updated',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as orderRouter };
