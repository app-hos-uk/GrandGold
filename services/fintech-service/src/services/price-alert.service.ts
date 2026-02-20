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
  private redis: Redis | null = null;
  private memHash = new Map<string, Map<string, string>>();
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

  private memHset(hash: string, field: string, value: string) {
    if (!this.memHash.has(hash)) this.memHash.set(hash, new Map());
    this.memHash.get(hash)!.set(field, value);
  }
  private memHget(hash: string, field: string): string | null {
    return this.memHash.get(hash)?.get(field) ?? null;
  }
  private memHdel(hash: string, field: string) {
    this.memHash.get(hash)?.delete(field);
  }
  private memSadd(key: string, member: string) {
    if (!this.memSets.has(key)) this.memSets.set(key, new Set());
    this.memSets.get(key)!.add(member);
  }
  private memSrem(key: string, member: string) {
    this.memSets.get(key)?.delete(member);
  }
  private memSmembers(key: string): string[] {
    return Array.from(this.memSets.get(key) || []);
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

    const redis = this.getRedis();
    const serialized = JSON.stringify(alert);
    const userKey = `alerts:user:${input.userId}`;
    const activeKey = `alerts:active:${input.country}:${input.purity}`;
    try {
      if (redis) {
        await redis.hset('alerts', alertId, serialized);
        await redis.sadd(userKey, alertId);
        await redis.sadd(activeKey, alertId);
      } else {
        this.memHset('alerts', alertId, serialized);
        this.memSadd(userKey, alertId);
        this.memSadd(activeKey, alertId);
      }
    } catch {
      this.memHset('alerts', alertId, serialized);
      this.memSadd(userKey, alertId);
      this.memSadd(activeKey, alertId);
    }

    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string, userId: string): Promise<PriceAlert> {
    const redis = this.getRedis();
    let data: string | null = null;
    try {
      if (redis) {
        data = await redis.hget('alerts', alertId);
      } else {
        data = this.memHget('alerts', alertId);
      }
    } catch {
      data = this.memHget('alerts', alertId);
    }

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
    const redis = this.getRedis();
    const userKey = `alerts:user:${userId}`;
    let alertIds: string[] = [];
    try {
      if (redis) {
        alertIds = await redis.smembers(userKey);
      } else {
        alertIds = this.memSmembers(userKey);
      }
    } catch {
      alertIds = this.memSmembers(userKey);
    }

    const alerts: PriceAlert[] = [];
    for (const alertId of alertIds) {
      let data: string | null = null;
      try {
        if (redis) {
          data = await redis.hget('alerts', alertId);
        } else {
          data = this.memHget('alerts', alertId);
        }
      } catch {
        data = this.memHget('alerts', alertId);
      }
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

    const redis = this.getRedis();
    const serialized = JSON.stringify(updatedAlert);
    try {
      if (redis) {
        await redis.hset('alerts', alertId, serialized);
      } else {
        this.memHset('alerts', alertId, serialized);
      }
    } catch {
      this.memHset('alerts', alertId, serialized);
    }

    return updatedAlert;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    const redis = this.getRedis();
    const userKey = `alerts:user:${userId}`;
    const activeKey = `alerts:active:${alert.country}:${alert.purity}`;
    try {
      if (redis) {
        await redis.hdel('alerts', alertId);
        await redis.srem(userKey, alertId);
        await redis.srem(activeKey, alertId);
      } else {
        this.memHdel('alerts', alertId);
        this.memSrem(userKey, alertId);
        this.memSrem(activeKey, alertId);
      }
    } catch {
      this.memHdel('alerts', alertId);
      this.memSrem(userKey, alertId);
      this.memSrem(activeKey, alertId);
    }
  }

  /**
   * Enable alert
   */
  async enableAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    alert.isActive = true;
    alert.updatedAt = new Date();

    const redis = this.getRedis();
    const serialized = JSON.stringify(alert);
    const activeKey = `alerts:active:${alert.country}:${alert.purity}`;
    try {
      if (redis) {
        await redis.hset('alerts', alertId, serialized);
        await redis.sadd(activeKey, alertId);
      } else {
        this.memHset('alerts', alertId, serialized);
        this.memSadd(activeKey, alertId);
      }
    } catch {
      this.memHset('alerts', alertId, serialized);
      this.memSadd(activeKey, alertId);
    }
  }

  /**
   * Disable alert
   */
  async disableAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId, userId);

    alert.isActive = false;
    alert.updatedAt = new Date();

    const redis = this.getRedis();
    const serialized = JSON.stringify(alert);
    const activeKey = `alerts:active:${alert.country}:${alert.purity}`;
    try {
      if (redis) {
        await redis.hset('alerts', alertId, serialized);
        await redis.srem(activeKey, alertId);
      } else {
        this.memHset('alerts', alertId, serialized);
        this.memSrem(activeKey, alertId);
      }
    } catch {
      this.memHset('alerts', alertId, serialized);
      this.memSrem(activeKey, alertId);
    }
  }

  /**
   * Check alerts for price trigger
   */
  async checkAlerts(country: Country, purity: GoldPurity, currentPrice: number): Promise<PriceAlert[]> {
    const redis = this.getRedis();
    const activeKey = `alerts:active:${country}:${purity}`;
    let alertIds: string[] = [];
    try {
      if (redis) {
        alertIds = await redis.smembers(activeKey);
      } else {
        alertIds = this.memSmembers(activeKey);
      }
    } catch {
      alertIds = this.memSmembers(activeKey);
    }

    const triggeredAlerts: PriceAlert[] = [];

    for (const alertId of alertIds) {
      let data: string | null = null;
      try {
        if (redis) {
          data = await redis.hget('alerts', alertId);
        } else {
          data = this.memHget('alerts', alertId);
        }
      } catch {
        data = this.memHget('alerts', alertId);
      }
      if (!data) continue;

      const alert: PriceAlert = JSON.parse(data);

      let shouldTrigger = false;
      if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        alert.triggeredAt = new Date();
        alert.isActive = false;
        alert.updatedAt = new Date();

        const serialized = JSON.stringify(alert);
        try {
          if (redis) {
            await redis.hset('alerts', alertId, serialized);
            await redis.srem(activeKey, alertId);
          } else {
            this.memHset('alerts', alertId, serialized);
            this.memSrem(activeKey, alertId);
          }
        } catch {
          this.memHset('alerts', alertId, serialized);
          this.memSrem(activeKey, alertId);
        }

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
    try { if (this.redis) await this.redis.quit(); } catch {}
  }
}
