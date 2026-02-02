import type { Country } from '@grandgold/types';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const RECENTLY_VIEWED_PREFIX = 'recently_viewed:';
const MAX_ITEMS = 20;
const TTL = 60 * 60 * 24 * 30; // 30 days

export class RecentlyViewedService {
  private getKey(userIdOrSessionId: string, country: Country): string {
    return `${RECENTLY_VIEWED_PREFIX}${userIdOrSessionId}:${country}`;
  }

  /**
   * Add product to recently viewed
   */
  async addProduct(
    userIdOrSessionId: string,
    productId: string,
    country: Country
  ): Promise<void> {
    const key = this.getKey(userIdOrSessionId, country);
    const data = await redis.get(key);

    let items: { productId: string; viewedAt: string }[] = data
      ? JSON.parse(data)
      : [];

    // Remove if already exists (to move to front)
    items = items.filter((i) => i.productId !== productId);

    // Add to front
    items.unshift({
      productId,
      viewedAt: new Date().toISOString(),
    });

    // Trim to max
    items = items.slice(0, MAX_ITEMS);

    await redis.setex(key, TTL, JSON.stringify(items));
  }

  /**
   * Get recently viewed product IDs
   */
  async getRecentlyViewed(
    userIdOrSessionId: string,
    country: Country,
    limit: number = 10
  ): Promise<string[]> {
    const key = this.getKey(userIdOrSessionId, country);
    const data = await redis.get(key);

    if (!data) return [];

    const items: { productId: string }[] = JSON.parse(data);
    return items.slice(0, limit).map((i) => i.productId);
  }

  /**
   * Clear recently viewed
   */
  async clear(
    userIdOrSessionId: string,
    country: Country
  ): Promise<void> {
    const key = this.getKey(userIdOrSessionId, country);
    await redis.del(key);
  }
}
