/**
 * Customer in-app notifications (order updates, promotions, etc.)
 * Redis-backed for persistence.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  savePushSubscription,
} from '../lib/notification-store';

const router = Router();

/**
 * GET /api/notifications
 * List notifications for current user
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.json({ success: true, data: { items: [], unreadCount: 0 } });
    }

    const list = await getNotifications(userId);
    const unreadCount = list.filter((n) => !n.read).length;

    res.json({
      success: true,
      data: {
        items: list,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } });
    }

    await markNotificationRead(userId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all as read
 */
router.post('/mark-all-read', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } });
    }

    await markAllRead(userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/push-subscribe
 * Store push subscription for Web Push
 */
router.post('/push-subscribe', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } });
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid subscription: endpoint and keys required' },
      });
    }

    await savePushSubscription(userId, { endpoint, keys });
    res.json({ success: true, message: 'Push subscription registered' });
  } catch (err) {
    next(err);
  }
});

export { router as notificationsRouter };
export { addNotification } from '../lib/notification-store';
