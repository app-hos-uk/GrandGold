import { generateId } from '@grandgold/utils';
import Redis from 'ioredis';

let _redisClient: Redis | null = null;
const _fallbackStore = new Map<string, string>();
const _fallbackLists = new Map<string, string[]>();

function getRedisClient(): Redis | null {
  if (_redisClient) return _redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    _redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
      lazyConnect: true,
    });
    _redisClient.on('error', () => {});
  } catch {
    return null;
  }
  return _redisClient;
}

interface Notification {
  id: string;
  sellerId: string;
  type: 'order' | 'stock' | 'settlement' | 'review' | 'support' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export class SellerNotificationService {
  /**
   * Create a notification
   */
  async createNotification(
    sellerId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    const notificationId = generateId('notif');

    const notification: Notification = {
      id: notificationId,
      sellerId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    };

    const key = `seller_notifications:${sellerId}:${notificationId}`;
    const listKey = `seller_notifications:${sellerId}`;
    const redis = getRedisClient();

    if (redis) {
      try {
        await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(notification));
        await redis.lpush(listKey, notificationId);
        await redis.ltrim(listKey, 0, 999);
      } catch {
        _fallbackStore.set(key, JSON.stringify(notification));
        const list = _fallbackLists.get(listKey) || [];
        list.unshift(notificationId);
        if (list.length > 1000) list.length = 1000;
        _fallbackLists.set(listKey, list);
      }
    } else {
      _fallbackStore.set(key, JSON.stringify(notification));
      const list = _fallbackLists.get(listKey) || [];
      list.unshift(notificationId);
      if (list.length > 1000) list.length = 1000;
      _fallbackLists.set(listKey, list);
    }

    return notification;
  }

  /**
   * Get seller notifications
   */
  async getNotifications(
    sellerId: string,
    options: { unreadOnly?: boolean; type?: string; page: number; limit: number }
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const listKey = `seller_notifications:${sellerId}`;
    let notificationIds: string[] = [];
    const redis = getRedisClient();

    if (redis) {
      try {
        notificationIds = await redis.lrange(listKey, 0, -1);
      } catch {
        notificationIds = _fallbackLists.get(listKey) || [];
      }
    } else {
      notificationIds = _fallbackLists.get(listKey) || [];
    }

    const notifications: Notification[] = [];

    for (const id of notificationIds) {
      const key = `seller_notifications:${sellerId}:${id}`;
      let data: string | null = null;
      if (redis) {
        try { data = await redis.get(key); } catch {}
      }
      if (!data) data = _fallbackStore.get(key) || null;
      if (data) {
        const notification = JSON.parse(data) as Notification;
        if (options.unreadOnly && notification.read) continue;
        if (options.type && notification.type !== options.type) continue;
        notifications.push(notification);
      }
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = notifications.length;
    const unreadCount = notifications.filter((n) => !n.read).length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = notifications.slice(start, start + options.limit);

    return {
      data: paginatedData,
      total,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(sellerId: string, notificationId: string): Promise<void> {
    const key = `seller_notifications:${sellerId}:${notificationId}`;
    const redis = getRedisClient();
    let data: string | null = null;

    if (redis) {
      try { data = await redis.get(key); } catch {}
    }
    if (!data) data = _fallbackStore.get(key) || null;

    if (data) {
      const notification = JSON.parse(data) as Notification;
      notification.read = true;
      const updated = JSON.stringify(notification);
      if (redis) {
        try { await redis.setex(key, 30 * 24 * 60 * 60, updated); } catch {
          _fallbackStore.set(key, updated);
        }
      } else {
        _fallbackStore.set(key, updated);
      }
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(sellerId: string): Promise<void> {
    const listKey = `seller_notifications:${sellerId}`;
    let notificationIds: string[] = [];
    const redis = getRedisClient();

    if (redis) {
      try { notificationIds = await redis.lrange(listKey, 0, -1); } catch {
        notificationIds = _fallbackLists.get(listKey) || [];
      }
    } else {
      notificationIds = _fallbackLists.get(listKey) || [];
    }

    for (const id of notificationIds) {
      await this.markAsRead(sellerId, id);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(sellerId: string, notificationId: string): Promise<void> {
    const key = `seller_notifications:${sellerId}:${notificationId}`;
    const listKey = `seller_notifications:${sellerId}`;
    const redis = getRedisClient();

    if (redis) {
      try {
        await redis.del(key);
        await redis.lrem(listKey, 0, notificationId);
      } catch {}
    }
    _fallbackStore.delete(key);
    const list = _fallbackLists.get(listKey);
    if (list) {
      const idx = list.indexOf(notificationId);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  /**
   * Notify seller of new order
   */
  async notifyNewOrder(sellerId: string, orderId: string, orderTotal: number): Promise<void> {
    await this.createNotification(
      sellerId,
      'order',
      'New Order Received',
      `You have received a new order #${orderId} for ₹${orderTotal.toLocaleString()}`,
      { orderId, orderTotal }
    );
  }

  /**
   * Notify seller of low stock
   */
  async notifyLowStock(sellerId: string, productId: string, productName: string, stock: number): Promise<void> {
    await this.createNotification(
      sellerId,
      'stock',
      'Low Stock Alert',
      `${productName} is running low on stock (${stock} items remaining)`,
      { productId, productName, stock }
    );
  }

  /**
   * Notify seller of settlement
   */
  async notifySettlement(sellerId: string, settlementId: string, amount: number): Promise<void> {
    await this.createNotification(
      sellerId,
      'settlement',
      'Settlement Processed',
      `Your settlement of ₹${amount.toLocaleString()} has been processed`,
      { settlementId, amount }
    );
  }

  /**
   * Notify seller of new review
   */
  async notifyNewReview(sellerId: string, reviewId: string, rating: number): Promise<void> {
    await this.createNotification(
      sellerId,
      'review',
      'New Review Received',
      `You received a ${rating}-star review`,
      { reviewId, rating }
    );
  }

  /**
   * Notify seller of support ticket update
   */
  async notifySupportUpdate(sellerId: string, ticketId: string, message: string): Promise<void> {
    await this.createNotification(
      sellerId,
      'support',
      'Support Ticket Update',
      message,
      { ticketId }
    );
  }
}
