import Redis from 'ioredis';
import { generateId, NotFoundError, ValidationError, PriceLockError } from '@grandgold/utils';
import type { Country, GoldPurity } from '@grandgold/types';
import { GoldPriceService } from './gold-price.service';
import { PriceCalculationService } from './price-calculation.service';

interface PriceLockItem {
  productId: string;
  variantId?: string;
  quantity: number;
  lockedPrice: number;
  priceCalculation: {
    goldWeight: number;
    purity: GoldPurity;
    goldValue: number;
    stoneValue: number;
    laborCost: number;
    makingCharges: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface PriceLock {
  id: string;
  userId: string;
  items: PriceLockItem[];
  goldPriceAtLock: number;
  currency: string;
  status: 'active' | 'used' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  expiresIn: number;
}

interface CreatePriceLockInput {
  userId: string;
  items: { productId: string; variantId?: string; quantity: number }[];
  country: Country;
}

// Price lock duration in seconds (5 minutes)
const PRICE_LOCK_DURATION = 300;

export class PriceLockService {
  private redis: Redis | null = null;
  private goldPriceService: GoldPriceService;
  private priceCalculationService: PriceCalculationService;
  private memStore = new Map<string, { value: string; expiresAt: number }>();
  private memSets = new Map<string, Set<string>>();

  private getRedis(): Redis | null {
    if (this.redis) return this.redis;
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
      this.redis = new Redis(url, { maxRetriesPerRequest: 2, retryStrategy: (times) => (times <= 2 ? 500 : null), lazyConnect: true });
      this.redis.on('error', () => {});
    } catch { return null; }
    return this.redis;
  }

  constructor() {
    this.goldPriceService = new GoldPriceService();
    this.priceCalculationService = new PriceCalculationService();
  }

  /**
   * Create a new price lock
   */
  async createPriceLock(input: CreatePriceLockInput): Promise<PriceLock> {
    // Check if user already has an active price lock
    const existingLocks = await this.getUserActiveLocks(input.userId);
    if (existingLocks.length > 0) {
      // Cancel existing locks
      for (const lock of existingLocks) {
        await this.cancelPriceLock(lock.id, input.userId);
      }
    }

    // Get current gold prices
    const goldPrices = await this.goldPriceService.getCurrentPrices(input.country);

    // Calculate prices for each item
    // In production, you'd fetch actual product details from database
    const lockedItems: PriceLockItem[] = [];
    
    for (const item of input.items) {
      // Mock product data - in production, fetch from product service
      const productData = await this.getProductPricingData(item.productId);
      
      const calculation = await this.priceCalculationService.calculatePrice({
        goldWeight: productData.goldWeight,
        purity: productData.purity,
        stoneValue: productData.stoneValue,
        laborCost: productData.laborCost,
        makingChargesPercent: productData.makingChargesPercent,
        country: input.country,
      });

      lockedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        lockedPrice: calculation.total * item.quantity,
        priceCalculation: {
          goldWeight: productData.goldWeight,
          purity: productData.purity,
          goldValue: calculation.goldValue,
          stoneValue: calculation.stoneValue,
          laborCost: calculation.laborCost,
          makingCharges: calculation.makingCharges,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
        },
      });
    }

    // Create price lock
    const lockId = generateId('pl');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PRICE_LOCK_DURATION * 1000);

    const priceLock: PriceLock = {
      id: lockId,
      userId: input.userId,
      items: lockedItems,
      goldPriceAtLock: goldPrices.prices['24K'],
      currency: goldPrices.currency,
      status: 'active',
      createdAt: now,
      expiresAt,
      expiresIn: PRICE_LOCK_DURATION,
    };

    // Store with expiry
    const redis = this.getRedis();
    const lockKey = `pricelock:${lockId}`;
    const userKey = `pricelock:user:${input.userId}`;
    const serialized = JSON.stringify(priceLock);
    try {
      if (redis) {
        await redis.setex(lockKey, PRICE_LOCK_DURATION, serialized);
        await redis.sadd(userKey, lockId);
      } else {
        this.memStore.set(lockKey, { value: serialized, expiresAt: Date.now() + PRICE_LOCK_DURATION * 1000 });
        if (!this.memSets.has(userKey)) this.memSets.set(userKey, new Set());
        this.memSets.get(userKey)!.add(lockId);
      }
    } catch {
      this.memStore.set(lockKey, { value: serialized, expiresAt: Date.now() + PRICE_LOCK_DURATION * 1000 });
      if (!this.memSets.has(userKey)) this.memSets.set(userKey, new Set());
      this.memSets.get(userKey)!.add(lockId);
    }

    return priceLock;
  }

  /**
   * Get price lock by ID
   */
  async getPriceLock(lockId: string, userId: string): Promise<PriceLock> {
    const redis = this.getRedis();
    const lockKey = `pricelock:${lockId}`;
    let data: string | null = null;
    try {
      if (redis) {
        data = await redis.get(lockKey);
      } else {
        const entry = this.memStore.get(lockKey);
        if (entry && entry.expiresAt > Date.now()) data = entry.value;
        else if (entry) this.memStore.delete(lockKey);
      }
    } catch {
      const entry = this.memStore.get(lockKey);
      if (entry && entry.expiresAt > Date.now()) data = entry.value;
      else if (entry) this.memStore.delete(lockKey);
    }

    if (!data) {
      throw new NotFoundError('Price lock');
    }

    const priceLock: PriceLock = JSON.parse(data);

    if (priceLock.userId !== userId) {
      throw new NotFoundError('Price lock');
    }

    // Update expires in
    const now = new Date();
    priceLock.expiresIn = Math.max(
      0,
      Math.floor((new Date(priceLock.expiresAt).getTime() - now.getTime()) / 1000)
    );

    return priceLock;
  }

  /**
   * Validate price lock is still active
   */
  async validatePriceLock(
    lockId: string,
    userId: string
  ): Promise<{ valid: boolean; reason?: string; priceLock?: PriceLock }> {
    try {
      const priceLock = await this.getPriceLock(lockId, userId);

      if (priceLock.status !== 'active') {
        return { valid: false, reason: `Price lock is ${priceLock.status}` };
      }

      if (priceLock.expiresIn <= 0) {
        return { valid: false, reason: 'Price lock has expired' };
      }

      return { valid: true, priceLock };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { valid: false, reason: 'Price lock not found or expired' };
      }
      throw error;
    }
  }

  /**
   * Mark price lock as used
   */
  async usePriceLock(lockId: string, userId: string): Promise<void> {
    const priceLock = await this.getPriceLock(lockId, userId);

    if (priceLock.status !== 'active') {
      throw new PriceLockError(`Price lock is already ${priceLock.status}`);
    }

    if (priceLock.expiresIn <= 0) {
      throw new PriceLockError('Price lock has expired');
    }

    // Update status
    priceLock.status = 'used';
    priceLock.usedAt = new Date();

    const redis = this.getRedis();
    const lockKey = `pricelock:${lockId}`;
    const userKey = `pricelock:user:${userId}`;
    const serialized = JSON.stringify(priceLock);
    try {
      if (redis) {
        const ttl = await redis.ttl(lockKey);
        if (ttl > 0) {
          await redis.setex(lockKey, ttl, serialized);
        }
        await redis.srem(userKey, lockId);
      } else {
        const entry = this.memStore.get(lockKey);
        if (entry && entry.expiresAt > Date.now()) {
          this.memStore.set(lockKey, { value: serialized, expiresAt: entry.expiresAt });
        }
        this.memSets.get(userKey)?.delete(lockId);
      }
    } catch {
      const entry = this.memStore.get(lockKey);
      if (entry && entry.expiresAt > Date.now()) {
        this.memStore.set(lockKey, { value: serialized, expiresAt: entry.expiresAt });
      }
      this.memSets.get(userKey)?.delete(lockId);
    }
  }

  /**
   * Cancel price lock
   */
  async cancelPriceLock(lockId: string, userId: string): Promise<void> {
    try {
      const priceLock = await this.getPriceLock(lockId, userId);

      if (priceLock.status !== 'active') {
        return;
      }

      const redis = this.getRedis();
      const lockKey = `pricelock:${lockId}`;
      const userKey = `pricelock:user:${userId}`;
      try {
        if (redis) {
          await redis.del(lockKey);
          await redis.srem(userKey, lockId);
        } else {
          this.memStore.delete(lockKey);
          this.memSets.get(userKey)?.delete(lockId);
        }
      } catch {
        this.memStore.delete(lockKey);
        this.memSets.get(userKey)?.delete(lockId);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Already expired or doesn't exist
        return;
      }
      throw error;
    }
  }

  /**
   * Get user's active price locks
   */
  async getUserActiveLocks(userId: string): Promise<PriceLock[]> {
    const redis = this.getRedis();
    const userKey = `pricelock:user:${userId}`;
    let lockIds: string[] = [];
    try {
      if (redis) {
        lockIds = await redis.smembers(userKey);
      } else {
        lockIds = Array.from(this.memSets.get(userKey) || []);
      }
    } catch {
      lockIds = Array.from(this.memSets.get(userKey) || []);
    }

    const locks: PriceLock[] = [];
    for (const lockId of lockIds) {
      try {
        const lock = await this.getPriceLock(lockId, userId);
        if (lock.status === 'active' && lock.expiresIn > 0) {
          locks.push(lock);
        }
      } catch {
        try {
          if (redis) await redis.srem(userKey, lockId);
          else this.memSets.get(userKey)?.delete(lockId);
        } catch {
          this.memSets.get(userKey)?.delete(lockId);
        }
      }
    }

    return locks;
  }

  /**
   * Get product pricing data (mock - would fetch from product service)
   */
  private async getProductPricingData(productId: string): Promise<{
    goldWeight: number;
    purity: GoldPurity;
    stoneValue: number;
    laborCost: number;
    makingChargesPercent: number;
  }> {
    // In production, fetch from product service
    return {
      goldWeight: 10, // 10 grams
      purity: '22K',
      stoneValue: 5000,
      laborCost: 2000,
      makingChargesPercent: 10,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try { if (this.redis) await this.redis.quit(); } catch {}
  }
}
