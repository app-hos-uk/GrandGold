import Redis from 'ioredis';

export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying
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
    return this.client.get(key);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  /**
   * Remove from a set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  /**
   * Check if member is in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.client.hdel(key, ...fields);
  }

  /**
   * Publish to a channel
   */
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Get Redis client (for advanced operations)
   */
  getClient(): Redis {
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
