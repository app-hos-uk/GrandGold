import Redis from 'ioredis';
import type { Country } from '@grandgold/types';
import { findUserById } from '@grandgold/database';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const ABANDONED_CART_PREFIX = 'abandoned_cart:';
const ABANDONED_CART_BY_CREATED = 'abandoned_cart:by_created';
const CART_PREFIX = 'cart:';
const TTL = 60 * 60 * 24 * 7; // 7 days
const ABANDON_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export interface AbandonedCartRecord {
  cartId: string;
  userId?: string;
  email?: string;
  phone?: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  subtotal: number;
  country: Country;
  currency: string;
  remindersSent: number[];
  createdAt: string;
  updatedAt: string;
}

export class AbandonedCartService {
  /**
   * Record abandoned cart for recovery
   */
  async recordAbandonedCart(data: {
    cartId: string;
    userId?: string;
    email?: string;
    phone?: string;
    items: AbandonedCartRecord['items'];
    subtotal: number;
    country: Country;
    currency: string;
  }): Promise<void> {
    const key = `${ABANDONED_CART_PREFIX}${data.cartId}`;
    const now = new Date().toISOString();
    const record: AbandonedCartRecord = {
      ...data,
      remindersSent: [],
      createdAt: now,
      updatedAt: now,
    };

    await redis.setex(key, TTL, JSON.stringify(record));
    const ts = new Date(now).getTime();
    await redis.zadd(ABANDONED_CART_BY_CREATED, ts, data.cartId);
  }

  /**
   * Get abandoned cart
   */
  async getAbandonedCart(cartId: string): Promise<AbandonedCartRecord | null> {
    const key = `${ABANDONED_CART_PREFIX}${cartId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Mark reminder as sent (1h, 24h, 72h)
   */
  async markReminderSent(cartId: string, reminderType: '1h' | '24h' | '72h'): Promise<void> {
    const record = await this.getAbandonedCart(cartId);
    if (!record) return;

    const hourMap = { '1h': 1, '24h': 24, '72h': 72 };
    const hour = hourMap[reminderType];
    if (!record.remindersSent.includes(hour)) {
      record.remindersSent.push(hour);
      record.remindersSent.sort((a, b) => a - b);
      record.updatedAt = new Date().toISOString();

      const key = `${ABANDONED_CART_PREFIX}${cartId}`;
      await redis.setex(key, TTL, JSON.stringify(record));
    }
  }

  /**
   * Get carts eligible for reminder (abandoned X hours ago, reminder not yet sent)
   */
  async getCartsForReminder(
    reminderType: '1h' | '24h' | '72h'
  ): Promise<AbandonedCartRecord[]> {
    const hourMap = { '1h': 1, '24h': 24, '72h': 72 };
    const hours = hourMap[reminderType];
    const now = Date.now();
    const minMs = (hours - 0.5) * 60 * 60 * 1000;
    const maxMs = (hours + 0.5) * 60 * 60 * 1000;
    const minScore = now - maxMs;
    const maxScore = now - minMs;

    const cartIds = await redis.zrangebyscore(
      ABANDONED_CART_BY_CREATED,
      minScore,
      maxScore
    );

    const results: AbandonedCartRecord[] = [];
    for (const cartId of cartIds) {
      const record = await this.getAbandonedCart(cartId);
      if (!record) continue;
      if (record.remindersSent.includes(hours)) continue;
      if (!record.email && !record.phone) continue;
      results.push(record);
    }
    return results;
  }

  /**
   * Delete abandoned cart (e.g., after checkout)
   */
  async deleteAbandonedCart(cartId: string): Promise<void> {
    const key = `${ABANDONED_CART_PREFIX}${cartId}`;
    await redis.del(key);
    await redis.zrem(ABANDONED_CART_BY_CREATED, cartId);
  }

  /**
   * Detect carts idle > 1h and record as abandoned. Called by cron.
   */
  async detectAndRecordAbandonedCarts(): Promise<number> {
    let recorded = 0;
    const stream = redis.scanStream({ match: `${CART_PREFIX}*`, count: 100 });

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        if (!key.startsWith(CART_PREFIX)) continue;
        const cartId = key.slice(CART_PREFIX.length);
        const existing = await this.getAbandonedCart(cartId);
        if (existing) continue;

        const data = await redis.get(key);
        if (!data) continue;

        let cart: { items: unknown[]; updatedAt: string; subtotal: number; currency: string; country: string };
        try {
          cart = JSON.parse(data);
        } catch {
          continue;
        }

        if (!cart.items?.length) continue;

        const updatedAt = new Date(cart.updatedAt).getTime();
        if (Date.now() - updatedAt < ABANDON_THRESHOLD_MS) continue;

        let email: string | undefined;
        let phone: string | undefined;
        let userId: string | undefined;

        const isLikelyUserId = /^usr_|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartId);
        if (isLikelyUserId) {
          try {
            const user = await findUserById(cartId);
            if (user) {
              email = user.email;
              phone = user.phone ?? undefined;
              userId = user.id;
            }
          } catch {
            // DB may be unavailable; skip user lookup
          }
        }

        if (!email && !phone) continue;

        const items = (cart.items as { productId: string; name: string; quantity: number; price: number }[]).map(
          (i) => ({
            productId: i.productId,
            name: i.name || 'Product',
            quantity: i.quantity || 1,
            price: i.price || 0,
          })
        );

        await this.recordAbandonedCart({
          cartId,
          userId,
          email,
          phone,
          items,
          subtotal: cart.subtotal ?? 0,
          country: (cart.country as Country) || 'IN',
          currency: cart.currency || 'INR',
        });
        recorded++;
      }
    }
    return recorded;
  }
}
