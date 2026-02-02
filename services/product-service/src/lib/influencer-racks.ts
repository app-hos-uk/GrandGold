/**
 * Influencer curated racks - Redis-backed.
 */
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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
  const key = `${RACK_PREFIX}${slug}`;
  const raw = await redis.get(key);
  if (raw) return JSON.parse(raw) as InfluencerRack;
  const rack = DEFAULT_RACKS[slug] ?? null;
  if (rack) await redis.set(key, JSON.stringify(rack), 'EX', TTL_DAYS * 86400);
  return rack;
}

export async function setRack(rack: InfluencerRack): Promise<void> {
  const key = `${RACK_PREFIX}${rack.slug}`;
  await redis.set(key, JSON.stringify(rack), 'EX', TTL_DAYS * 86400);
}

export async function recordCommission(influencerId: string, orderId: string, amount: number): Promise<void> {
  const key = `${COMMISSION_PREFIX}${influencerId}`;
  await redis.lpush(key, JSON.stringify({ orderId, amount, at: new Date().toISOString() }));
  await redis.ltrim(key, 0, 999);
  await redis.expire(key, TTL_DAYS * 86400);
}

export async function getCommissionSummary(influencerId: string): Promise<{ total: number; pending: number; paid: number; orders: number }> {
  const key = `${COMMISSION_PREFIX}${influencerId}`;
  const raw = await redis.lrange(key, 0, 99);
  const entries = raw.map((s) => JSON.parse(s) as { orderId: string; amount: number });
  const total = entries.reduce((s, e) => s + e.amount, 0);
  return { total, pending: total * 0.7, paid: total * 0.3, orders: entries.length };
}
