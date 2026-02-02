import { Router, Request, Response, NextFunction } from 'express';
import { SellerService } from '../services/seller.service';
import { authenticate, authorize, requireSeller } from '../middleware/auth';

const router = Router();
const sellerService = new SellerService();

/**
 * GET /api/sellers/me
 * Get current seller profile
 */
router.get('/me', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const seller = await sellerService.getSellerByUserId(req.user.sub);
    
    res.json({
      success: true,
      data: seller,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/sellers/me
 * Update seller profile
 */
router.patch('/me', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const seller = await sellerService.updateSeller(req.user.sub, req.body);
    
    res.json({
      success: true,
      data: seller,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/dashboard
 * Get seller dashboard data
 */
router.get('/me/dashboard', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const period = (req.query.period as string) || 'month';
    const dashboard = await sellerService.getDashboardData(req.user.sub, period);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/performance
 * Get seller performance metrics
 */
router.get('/me/performance', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const period = (req.query.period as string) || 'month';
    const performance = await sellerService.getPerformanceMetrics(req.user.sub, period);
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/performance/dashboard
 * Get seller performance dashboard
 */
router.get('/me/performance/dashboard', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const period = (req.query.period as string) || 'month';
    const dashboard = await sellerService.getPerformanceDashboard(req.user.sub, period);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/orders
 * Get seller's orders
 */
router.get('/me/orders', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const orders = await sellerService.getSellerOrders(req.user.sub, { status, page, limit });
    
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/me/reviews
 * Get seller reviews
 */
router.get('/me/reviews', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const reviews = await sellerService.getSellerReviews(req.user.sub, { page, limit });
    
    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/me/settings
 * Update seller settings
 */
router.post('/me/settings', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const settings = await sellerService.updateSettings(req.user.sub, req.body);
    
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/:id
 * Get seller by ID (Admin)
 */
router.get(
  '/:id',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await sellerService.getSellerById(req.params.id);
      
      res.json({
        success: true,
        data: seller,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sellers
 * List all sellers (Admin)
 */
router.get(
  '/',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const country = req.query.country as string;
      const status = req.query.status as string;
      const tier = req.query.tier as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const sellers = await sellerService.listSellers({
        country,
        status,
        tier,
        page,
        limit,
        adminCountry: req.user.country,
      });
      
      res.json({
        success: true,
        data: sellers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/:id/suspend
 * Suspend a seller (Admin)
 */
router.post(
  '/:id/suspend',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { reason } = req.body;
      
      await sellerService.suspendSeller(req.params.id, req.user.sub, reason);
      
      res.json({
        success: true,
        message: 'Seller suspended successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/:id/activate
 * Activate a suspended seller (Admin)
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      await sellerService.activateSeller(req.params.id, req.user.sub);
      
      res.json({
        success: true,
        message: 'Seller activated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as sellerRouter };
