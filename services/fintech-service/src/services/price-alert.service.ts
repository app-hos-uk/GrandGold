import Redis from 'ioredis';
import { generateId, NotFoundError } from '@grandgold/utils';
import type { Country, GoldPurity } from '@grandgold/types';

interface PriceAlert {
  id: string;
  userId: string;
  targetPrice: number;
  direction: 'above' | 'below';
  purity: GoldPurity;
  country: Country;
  notificationChannels: ('email' | 'push' | 'whatsapp')[];
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAlertInput {
  userId: string;
  targetPrice: number;
  direction: 'above' | 'below';
  purity: GoldPurity;
  country: Country;
  notificationChannels: ('email' | 'push' | 'whatsapp')[];
}

export class PriceAlertService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Create a new price alert
   */
  async createAlert(input: CreateAlertInput): Promise<PriceAlert> {
    const alertId = generateId('alert');
    const now = new Date();

    const alert: PriceAlert = {
      id: alertId,
      userId: input.userId,
      targetPrice: input.targetPrice,
      direction: input.direction,
      purity: input.purity,
      country: input.country,
      notificationChannels: input.notificationChannels,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Store alert
    await this.redis.hset('alerts', alertId, JSON.stringify(alert));
    
    // Add to user's alerts set
    await this.redis.sadd(`alerts:user:${input.userId}`, alertId);
    
    // Add to active alerts for the purity/country
    await this.redis.sadd(`alerts:active:${input.country}:${input.purity}`, alertId);

    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string, userId: string): Promise<PriceAlert> {
    const data = await this.redis.hget('alerts', alertId);
    
    if (!data) {
      throw new NotFoundError('Price alert');
    }

    const alert: PriceAlert = JSON.parse(data);

    if (alert.userId !== userId) {
      throw new NotFoundError('Price alert');
    }

    return alert;
  }

  /**
   * Get user's alerts
   */
  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    const alertIds = await this.redis.smembers(`alerts:user:${userId}`);
    const alerts: PriceAlert[] = [];

    for (const alertId of alertIds) {
      const data = await this.redis.hget('alerts', alertId);
      if (data) {
        alerts.push(JSON.parse(data));
      }
    }

    return alerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Update alert
   */
  async updateAlert(
    alertId: string,
    userId: string,
    updates: Partial<Pick<PriceAlert, 'targetPrice' | 'direction' | 'notificationChannels'>>
  ): Promise<PriceAlert> {
    const alert = await this.getAlert(alertId, userId);

    const updatedAlert: PriceAlert = {
      ...alert,
      ...updates,
      updatedAt: new Date(),
    };

    await this.redis.hset('alerts', alertId, JSON.stringify(updatedAlert));

    return updatedAlert;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    await this.redis.hdel('alerts', alertId);
    await this.redis.srem(`alerts:user:${userId}`, alertId);
    await this.redis.srem(`alerts:active:${alert.country}:${alert.purity}`, alertId);
  }

  /**
   * Enable alert
   */
  async enableAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    alert.isActive = true;
    alert.updatedAt = new Date();

    await this.redis.hset('alerts', alertId, JSON.stringify(alert));
    await this.redis.sadd(`alerts:active:${alert.country}:${alert.purity}`, alertId);
  }

  /**
   * Disable alert
   */
  async disableAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    alert.isActive = false;
    alert.updatedAt = new Date();

    await this.redis.hset('alerts', alertId, JSON.stringify(alert));
    await this.redis.srem(`alerts:active:${alert.country}:${alert.purity}`, alertId);
  }

  /**
   * Check alerts for price trigger
   */
  async checkAlerts(country: Country, purity: GoldPurity, currentPrice: number): Promise<PriceAlert[]> {
    const alertIds = await this.redis.smembers(`alerts:active:${country}:${purity}`);
    const triggeredAlerts: PriceAlert[] = [];

    for (const alertId of alertIds) {
      const data = await this.redis.hget('alerts', alertId);
      if (!data) continue;

      const alert: PriceAlert = JSON.parse(data);

      // Check if alert should trigger
      let shouldTrigger = false;
      if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Mark as triggered
        alert.triggeredAt = new Date();
        alert.isActive = false;
        alert.updatedAt = new Date();

        await this.redis.hset('alerts', alertId, JSON.stringify(alert));
        await this.redis.srem(`alerts:active:${country}:${purity}`, alertId);

        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(userId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    byPurity: Record<string, number>;
  }> {
    const alerts = await this.getUserAlerts(userId);

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.isActive).length,
      triggered: alerts.filter((a) => a.triggeredAt).length,
      byPurity: alerts.reduce((acc, a) => {
        acc[a.purity] = (acc[a.purity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
