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
  private redis: Redis;
  private goldPriceService: GoldPriceService;
  private priceCalculationService: PriceCalculationService;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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

    // Store in Redis with expiry
    await this.redis.setex(
      `pricelock:${lockId}`,
      PRICE_LOCK_DURATION,
      JSON.stringify(priceLock)
    );

    // Add to user's active locks set
    await this.redis.sadd(`pricelock:user:${input.userId}`, lockId);

    return priceLock;
  }

  /**
   * Get price lock by ID
   */
  async getPriceLock(lockId: string, userId: string): Promise<PriceLock> {
    const data = await this.redis.get(`pricelock:${lockId}`);
    
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

    // Store with remaining TTL
    const ttl = await this.redis.ttl(`pricelock:${lockId}`);
    if (ttl > 0) {
      await this.redis.setex(`pricelock:${lockId}`, ttl, JSON.stringify(priceLock));
    }

    // Remove from active locks
    await this.redis.srem(`pricelock:user:${userId}`, lockId);
  }

  /**
   * Cancel price lock
   */
  async cancelPriceLock(lockId: string, userId: string): Promise<void> {
    try {
      const priceLock = await this.getPriceLock(lockId, userId);

      if (priceLock.status !== 'active') {
        return; // Already cancelled or used
      }

      // Delete from Redis
      await this.redis.del(`pricelock:${lockId}`);
      await this.redis.srem(`pricelock:user:${userId}`, lockId);
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
    const lockIds = await this.redis.smembers(`pricelock:user:${userId}`);
    const locks: PriceLock[] = [];

    for (const lockId of lockIds) {
      try {
        const lock = await this.getPriceLock(lockId, userId);
        if (lock.status === 'active' && lock.expiresIn > 0) {
          locks.push(lock);
        }
      } catch (error) {
        // Lock expired, clean up
        await this.redis.srem(`pricelock:user:${userId}`, lockId);
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
    await this.redis.quit();
  }
}
