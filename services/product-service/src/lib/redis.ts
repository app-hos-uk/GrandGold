/**
 * Shared Redis client with lazy initialization for Cloud Run compatibility.
 * Returns null if REDIS_URL is not set or connection fails.
 */
import Redis from 'ioredis';

let redisClient: Redis | null = null;
let initialized = false;

/** Get lazy Redis client - returns null if REDIS_URL is not set */
export function getRedis(): Redis | null {
  if (initialized) return redisClient;
  initialized = true;

  const url = process.env.REDIS_URL;
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('[product-service] Redis not configured (REDIS_URL unset or localhost). Caching disabled.');
    return null;
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      console.error('[product-service] Redis error:', err.message);
    });
  } catch (err) {
    console.warn('[product-service] Failed to initialize Redis:', err);
    redisClient = null;
  }

  return redisClient;
}

/** Safe Redis GET - returns null on error */
export async function redisGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/** Safe Redis SET with expiry - returns false on error */
export async function redisSetex(key: string, ttl: number, value: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.setex(key, ttl, value);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis DEL - returns false on error */
export async function redisDel(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis KEYS - returns empty array on error */
export async function redisKeys(pattern: string): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.keys(pattern);
  } catch {
    return [];
  }
}

/** Safe Redis LPUSH - returns false on error */
export async function redisLpush(key: string, value: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.lpush(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis LRANGE - returns empty array on error */
export async function redisLrange(key: string, start: number, stop: number): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.lrange(key, start, stop);
  } catch {
    return [];
  }
}

/** Safe Redis LTRIM - returns false on error */
export async function redisLtrim(key: string, start: number, stop: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.ltrim(key, start, stop);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis EXPIRE - returns false on error */
export async function redisExpire(key: string, seconds: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.expire(key, seconds);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis SADD - returns false on error */
export async function redisSadd(key: string, ...members: string[]): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.sadd(key, ...members);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis SMEMBERS - returns empty array on error */
export async function redisSmembers(key: string): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.smembers(key);
  } catch {
    return [];
  }
}

/** Safe Redis SREM - returns false on error */
export async function redisSrem(key: string, ...members: string[]): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.srem(key, ...members);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis ZADD - returns false on error */
export async function redisZadd(key: string, score: number, member: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.zadd(key, score, member);
    return true;
  } catch {
    return false;
  }
}

/** Safe Redis ZRANGE - returns empty array on error */
export async function redisZrange(key: string, start: number, stop: number): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.zrange(key, start, stop);
  } catch {
    return [];
  }
}

/** Safe Redis ZREVRANGE - returns empty array on error */
export async function redisZrevrange(key: string, start: number, stop: number): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.zrevrange(key, start, stop);
  } catch {
    return [];
  }
}

/** Safe Redis ZREM - returns false on error */
export async function redisZrem(key: string, member: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.zrem(key, member);
    return true;
  } catch {
    return false;
  }
}
