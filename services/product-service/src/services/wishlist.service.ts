import type { Country } from '@grandgold/types';
import { getRedis } from '../lib/redis';
import type { Product, WishlistWithProducts } from '../types/product.types';

interface WishlistItem {
  productId: string;
  addedAt: string;
}

const WISHLIST_PREFIX = 'wishlist:';
const WISHLIST_TTL = 60 * 60 * 24 * 365; // 1 year

export class WishlistService {
  private getKey(userId: string, country: Country): string {
    return `${WISHLIST_PREFIX}${userId}:${country}`;
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(
    userId: string,
    country: Country,
    productDetails?: (productIds: string[]) => Promise<Product[]>
  ): Promise<WishlistWithProducts> {
    const redis = getRedis();
    if (!redis) return { items: [] };
    
    const key = this.getKey(userId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      return { items: [] };
    }

    if (!data) {
      return { items: [] };
    }

    const items: WishlistItem[] = JSON.parse(data);

    if (productDetails && items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const products = await productDetails(productIds);
      return { items, products };
    }

    return { items };
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(
    userId: string,
    productId: string,
    country: Country
  ): Promise<{ added: boolean; count: number }> {
    const redis = getRedis();
    if (!redis) return { added: false, count: 0 };
    
    const key = this.getKey(userId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      // Redis unavailable
    }
    const items: WishlistItem[] = data ? JSON.parse(data) : [];

    const exists = items.some((i) => i.productId === productId);
    if (exists) {
      return { added: false, count: items.length };
    }

    items.push({
      productId,
      addedAt: new Date().toISOString(),
    });

    try {
      await redis.setex(key, WISHLIST_TTL, JSON.stringify(items));
    } catch {
      // Cache failed
    }
    return { added: true, count: items.length };
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(
    userId: string,
    productId: string,
    country: Country
  ): Promise<{ removed: boolean; count: number }> {
    const redis = getRedis();
    if (!redis) return { removed: false, count: 0 };
    
    const key = this.getKey(userId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      return { removed: false, count: 0 };
    }

    if (!data) {
      return { removed: false, count: 0 };
    }

    const items: WishlistItem[] = JSON.parse(data);
    const initialCount = items.length;
    const filtered = items.filter((i) => i.productId !== productId);

    if (filtered.length === initialCount) {
      return { removed: false, count: initialCount };
    }

    try {
      if (filtered.length === 0) {
        await redis.del(key);
        return { removed: true, count: 0 };
      }

      await redis.setex(key, WISHLIST_TTL, JSON.stringify(filtered));
    } catch {
      // Cache operation failed
    }
    return { removed: true, count: filtered.length };
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(
    userId: string,
    productId: string,
    country: Country
  ): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;
    
    const key = this.getKey(userId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      return false;
    }

    if (!data) return false;

    const items: WishlistItem[] = JSON.parse(data);
    return items.some((i) => i.productId === productId);
  }

  /**
   * Get wishlist count
   */
  async getCount(userId: string, country: Country): Promise<number> {
    const { items } = await this.getWishlist(userId, country);
    return items.length;
  }

  /**
   * Move items from cart to wishlist (Save for Later)
   */
  async addManyToWishlist(
    userId: string,
    productIds: string[],
    country: Country
  ): Promise<{ added: number; count: number }> {
    const redis = getRedis();
    if (!redis) return { added: 0, count: 0 };
    
    const key = this.getKey(userId, country);
    let data: string | null = null;
    try {
      data = await redis.get(key);
    } catch {
      // Redis unavailable
    }
    const items: WishlistItem[] = data ? JSON.parse(data) : [];
    const existingIds = new Set(items.map((i) => i.productId));

    let added = 0;
    for (const productId of productIds) {
      if (!existingIds.has(productId)) {
        items.push({
          productId,
          addedAt: new Date().toISOString(),
        });
        existingIds.add(productId);
        added++;
      }
    }

    if (added > 0) {
      try {
        await redis.setex(key, WISHLIST_TTL, JSON.stringify(items));
      } catch {
        // Cache failed
      }
    }

    return { added, count: items.length };
  }
}
