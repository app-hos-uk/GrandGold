import { generateId } from '@grandgold/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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

    // Store in Redis with TTL of 30 days
    const key = `seller_notifications:${sellerId}:${notificationId}`;
    await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(notification));

    // Add to seller's notification list
    await redis.lpush(`seller_notifications:${sellerId}`, notificationId);
    await redis.ltrim(`seller_notifications:${sellerId}`, 0, 999); // Keep last 1000

    return notification;
  }

  /**
   * Get seller notifications
   */
  async getNotifications(
    sellerId: string,
    options: { unreadOnly?: boolean; type?: string; page: number; limit: number }
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const notificationIds = await redis.lrange(
      `seller_notifications:${sellerId}`,
      0,
      -1
    );

    const notifications: Notification[] = [];

    for (const id of notificationIds) {
      const key = `seller_notifications:${sellerId}:${id}`;
      const data = await redis.get(key);
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
    const data = await redis.get(key);

    if (data) {
      const notification = JSON.parse(data) as Notification;
      notification.read = true;
      await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(notification));
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(sellerId: string): Promise<void> {
    const notificationIds = await redis.lrange(
      `seller_notifications:${sellerId}`,
      0,
      -1
    );

    for (const id of notificationIds) {
      await this.markAsRead(sellerId, id);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(sellerId: string, notificationId: string): Promise<void> {
    const key = `seller_notifications:${sellerId}:${notificationId}`;
    await redis.del(key);
    await redis.lrem(`seller_notifications:${sellerId}`, 0, notificationId);
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
