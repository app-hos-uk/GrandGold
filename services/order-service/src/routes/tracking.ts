import { Router, Request, Response, NextFunction } from 'express';
import { TrackingService } from '../services/tracking.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const trackingService = new TrackingService();

/**
 * GET /api/tracking/:orderId
 * Get order tracking info
 */
router.get('/:orderId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const tracking = await trackingService.getTracking(req.params.orderId, req.user.sub);
    
    res.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tracking/number/:trackingNumber
 * Get tracking by tracking number
 */
router.get('/number/:trackingNumber', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracking = await trackingService.getTrackingByNumber(req.params.trackingNumber);
    
    res.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tracking/:orderId/update
 * Update tracking (Webhook from logistics partners)
 */
router.post('/:orderId/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { carrier, trackingNumber, status, location, timestamp, description } = req.body;
    
    // Verify webhook signature
    const signature = req.headers['x-webhook-signature'] as string;
    
    await trackingService.updateTracking(req.params.orderId, {
      carrier,
      trackingNumber,
      status,
      location,
      timestamp,
      description,
      signature,
    });
    
    res.json({
      success: true,
      message: 'Tracking updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tracking/:orderId/timeline
 * Get full tracking timeline
 */
router.get('/:orderId/timeline', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const timeline = await trackingService.getTimeline(req.params.orderId, req.user.sub);
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tracking/:orderId/estimated-delivery
 * Get estimated delivery date
 */
router.get('/:orderId/estimated-delivery', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const estimate = await trackingService.getEstimatedDelivery(req.params.orderId, req.user.sub);
    
    res.json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    next(error);
  }
});

export { router as trackingRouter };
