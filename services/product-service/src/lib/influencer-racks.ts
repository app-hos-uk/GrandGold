/**
 * Influencer curated racks - Redis-backed with lazy initialization.
 */
import { getRedis } from './redis';

const RACK_PREFIX = 'influencer:rack:';
const COMMISSION_PREFIX = 'influencer:commission:';
const TTL_DAYS = 365;

export interface InfluencerRack {
  slug: string;
  name: string;
  bio: string;
  productIds: string[];
  commissionRate?: number; // e.g. 5 = 5%
}

const DEFAULT_RACKS: Record<string, InfluencerRack> = {
  priya: { slug: 'priya', name: "Priya's Picks", bio: 'Bridal & traditional jewellery curated by fashion influencer Priya', productIds: ['1', '3', '5', '2'], commissionRate: 5 },
  rahul: { slug: 'rahul', name: "Rahul's Collection", bio: 'Contemporary & investment pieces selected by Rahul', productIds: ['3', '7', '4', '6'], commissionRate: 5 },
};

export async function getRack(slug: string): Promise<InfluencerRack | null> {
  const redis = getRedis();
  const key = `${RACK_PREFIX}${slug}`;
  try {
    if (redis) {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as InfluencerRack;
    }
  } catch {
    // Redis unavailable, fall through to defaults
  }
  const rack = DEFAULT_RACKS[slug] ?? null;
  if (rack && redis) {
    try {
      await redis.set(key, JSON.stringify(rack), 'EX', TTL_DAYS * 86400);
    } catch {
      // Ignore cache errors
    }
  }
  return rack;
}

/** List all racks: defaults merged with any stored in Redis */
export async function listRacks(): Promise<InfluencerRack[]> {
  const redis = getRedis();
  const seen = new Set<string>();
  const out: InfluencerRack[] = [];
  try {
    if (redis) {
      const keys = await redis.keys(`${RACK_PREFIX}*`);
      for (const key of keys) {
        const raw = await redis.get(key);
        if (raw) {
          const rack = JSON.parse(raw) as InfluencerRack;
          if (rack.slug) {
            seen.add(rack.slug);
            out.push(rack);
          }
        }
      }
    }
  } catch {
    // fallback to defaults only
  }
  for (const rack of Object.values(DEFAULT_RACKS)) {
    if (!seen.has(rack.slug)) {
      seen.add(rack.slug);
      out.push(rack);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function setRack(rack: InfluencerRack): Promise<void> {
  const redis = getRedis();
  if (!redis) return; // Cannot persist without Redis
  const key = `${RACK_PREFIX}${rack.slug}`;
  try {
    await redis.set(key, JSON.stringify(rack), 'EX', TTL_DAYS * 86400);
  } catch {
    // Ignore cache errors
  }
}

export async function recordCommission(influencerId: string, orderId: string, amount: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = `${COMMISSION_PREFIX}${influencerId}`;
  try {
    await redis.lpush(key, JSON.stringify({ orderId, amount, at: new Date().toISOString() }));
    await redis.ltrim(key, 0, 999);
    await redis.expire(key, TTL_DAYS * 86400);
  } catch {
    // Ignore cache errors
  }
}

export async function getCommissionSummary(influencerId: string): Promise<{ total: number; pending: number; paid: number; orders: number }> {
  const redis = getRedis();
  if (!redis) return { total: 0, pending: 0, paid: 0, orders: 0 };
  const key = `${COMMISSION_PREFIX}${influencerId}`;
  try {
    const raw = await redis.lrange(key, 0, 99);
    const entries = raw.map((s) => JSON.parse(s) as { orderId: string; amount: number });
    const total = entries.reduce((s, e) => s + e.amount, 0);
    return { total, pending: total * 0.7, paid: total * 0.3, orders: entries.length };
  } catch {
    return { total: 0, pending: 0, paid: 0, orders: 0 };
  }
}
