/**
 * Notification store - Redis-backed for persistence.
 * Used for in-app notifications and push subscription storage.
 */
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const NOTIF_PREFIX = 'notif:user:';
const PUSH_SUBS_PREFIX = 'push_subs:';
const TTL_DAYS = 30;

export interface NotificationItem {
  id: string;
  type: 'order' | 'promo' | 'price_alert' | 'abandoned_cart';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const key = `${NOTIF_PREFIX}${userId}`;
  const raw = await redis.lrange(key, 0, 99);
  return raw.map((s) => JSON.parse(s) as NotificationItem).reverse();
}

export async function addNotification(
  userId: string,
  item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>
): Promise<NotificationItem> {
  const notif: NotificationItem = {
    ...item,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const key = `${NOTIF_PREFIX}${userId}`;
  await redis.lpush(key, JSON.stringify(notif));
  await redis.ltrim(key, 0, 99);
  await redis.expire(key, TTL_DAYS * 86400);
  return notif;
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  const items = await getNotifications(userId);
  const idx = items.findIndex((n) => n.id === id);
  if (idx < 0) return;
  items[idx].read = true;
  const key = `${NOTIF_PREFIX}${userId}`;
  await redis.del(key);
  for (const n of items.reverse()) {
    await redis.lpush(key, JSON.stringify(n));
  }
  await redis.expire(key, TTL_DAYS * 86400);
}

export async function markAllRead(userId: string): Promise<void> {
  const items = await getNotifications(userId);
  const key = `${NOTIF_PREFIX}${userId}`;
  await redis.del(key);
  for (const n of items.reverse()) {
    n.read = true;
    await redis.lpush(key, JSON.stringify(n));
  }
  await redis.expire(key, TTL_DAYS * 86400);
}

export async function savePushSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
  const key = `${PUSH_SUBS_PREFIX}${userId}`;
  await redis.hset(key, subscription.endpoint, JSON.stringify(subscription));
  await redis.expire(key, TTL_DAYS * 86400);
}

export async function getPushSubscriptions(userId: string): Promise<Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>> {
  const key = `${PUSH_SUBS_PREFIX}${userId}`;
  const obj = await redis.hgetall(key);
  return Object.values(obj).map((v) => JSON.parse(v));
}
