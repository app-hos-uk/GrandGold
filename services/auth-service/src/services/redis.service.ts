import Redis from 'ioredis';

/** In-memory stub when Redis is not configured - login (non-MFA) works without Redis */
const noopStore = new Map<string, { value: string; expiry?: number }>();

function isRedisConfigured(): boolean {
  const url = process.env.REDIS_URL?.trim();
  return !!url && !url.startsWith('redis://localhost') && !url.startsWith('redis://127.0.0.1');
}

export class RedisService {
  private client: Redis | null = null;
  private readonly useStub: boolean;

  constructor() {
    this.useStub = !isRedisConfigured();
    if (this.useStub) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('Redis not configured (REDIS_URL unset or localhost). Using in-memory stub. MFA and password-reset may not work.');
      }
      return;
    }
    this.client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  /**
   * Set a key with optional expiry
   */
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (this.useStub || !this.client) {
      noopStore.set(key, { value, expiry: expirySeconds ? Date.now() + expirySeconds * 1000 : undefined });
      return;
    }
    if (expirySeconds) {
      await this.client.setex(key, expirySeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get a key
   */
  async get(key: string): Promise<string | null> {
    if (this.useStub || !this.client) {
      const entry = noopStore.get(key);
      if (!entry) return null;
      if (entry.expiry && Date.now() > entry.expiry) {
        noopStore.delete(key);
        return null;
      }
      return entry.value;
    }
    return this.client.get(key);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    if (this.useStub || !this.client) {
      noopStore.delete(key);
      return;
    }
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.useStub || !this.client) return noopStore.has(key);
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, _seconds: number): Promise<void> {
    if (this.useStub || !this.client) return;
    await this.client.expire(key, _seconds);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (this.useStub || !this.client) return -1;
    return this.client.ttl(key);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (this.useStub || !this.client) return 0;
    return this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (this.useStub || !this.client) return 0;
    return this.client.decr(key);
  }

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (this.useStub || !this.client) return 0;
    return this.client.sadd(key, ...members);
  }

  /**
   * Remove from a set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    if (this.useStub || !this.client) return 0;
    return this.client.srem(key, ...members);
  }

  /**
   * Check if member is in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    if (this.useStub || !this.client) return false;
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    if (this.useStub || !this.client) return [];
    return this.client.smembers(key);
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    if (this.useStub || !this.client) return;
    await this.client.hset(key, field, value);
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (this.useStub || !this.client) return null;
    return this.client.hget(key, field);
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.useStub || !this.client) return {};
    return this.client.hgetall(key);
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, ...fields: string[]): Promise<void> {
    if (this.useStub || !this.client) return;
    await this.client.hdel(key, ...fields);
  }

  /**
   * Publish to a channel
   */
  async publish(channel: string, message: string): Promise<number> {
    if (this.useStub || !this.client) return 0;
    return this.client.publish(channel, message);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) await this.client.quit();
  }

  /**
   * Get Redis client (for advanced operations)
   */
  getClient(): Redis {
    if (!this.client) throw new Error('Redis not configured');
    return this.client;
  }
}

// Singleton instance
let instance: RedisService | null = null;

export function getRedisService(): RedisService {
  if (!instance) {
    instance = new RedisService();
  }
  return instance;
}
