import type { Country } from '@grandgold/types';
import { getRedis } from '../lib/redis';

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
    const redis = getRedis();
    if (!redis) return;
    
    const key = this.getKey(userIdOrSessionId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      return;
    }

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

    try {
      await redis.setex(key, TTL, JSON.stringify(items));
    } catch {
      // Cache failed
    }
  }

  /**
   * Get recently viewed product IDs
   */
  async getRecentlyViewed(
    userIdOrSessionId: string,
    country: Country,
    limit: number = 10
  ): Promise<string[]> {
    const redis = getRedis();
    if (!redis) return [];
    
    const key = this.getKey(userIdOrSessionId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      return [];
    }

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
    const redis = getRedis();
    if (!redis) return;
    
    const key = this.getKey(userIdOrSessionId, country);
    try {
      await redis.del(key);
    } catch {
      // Cache clear failed
    }
  }
}
