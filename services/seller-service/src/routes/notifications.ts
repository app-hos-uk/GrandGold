import { Router, Request, Response, NextFunction } from 'express';
import { SellerNotificationService } from '../services/notification.service';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();
const notificationService = new SellerNotificationService();

/**
 * GET /api/sellers/notifications
 * Get seller notifications
 */
router.get('/', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getNotifications(sellerId, {
      unreadOnly,
      type,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/sellers/notifications/:notificationId/read
 * Mark notification as read
 */
router.patch('/:notificationId/read', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    await notificationService.markAsRead(sellerId, req.params.notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    await notificationService.markAllAsRead(sellerId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sellers/notifications/:notificationId
 * Delete notification
 */
router.delete('/:notificationId', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    await notificationService.deleteNotification(sellerId, req.params.notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

export { router as notificationRouter };
