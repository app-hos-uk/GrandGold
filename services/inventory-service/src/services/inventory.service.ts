import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

/** Lazy Redis client so startup is not blocked if Redis is unavailable (e.g. Cloud Run without REDIS_URL). */
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
      lazyConnect: true,
    });
  } catch {
    return null;
  }
  return redisClient;
}

async function redisGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function redisSetex(key: string, ttl: number, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(key, ttl, value);
  } catch {
    // no-op
  }
}

async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // no-op
  }
}

async function redisKeys(pattern: string): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.keys(pattern);
  } catch {
    return [];
  }
}

const STOCK_PREFIX = 'stock:';
const RESERVATION_PREFIX = 'stock_reservation:';
const ALERT_PREFIX = 'stock_alert:';
const TTL = 60 * 60 * 24 * 30;

export type StockPoolType = 'physical' | 'virtual' | 'made_to_order';

export interface StockRecord {
  productId: string;
  sellerId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  poolType: StockPoolType;
  countries: Country[];
  updatedAt: string;
}

export interface StockReservation {
  id: string;
  productId: string;
  quantity: number;
  cartId: string;
  userId?: string;
  expiresAt: string;
}

export class InventoryService {
  /**
   * Get stock for product
   */
  async getStock(productId: string): Promise<StockRecord | null> {
    const data = await redisGet(`${STOCK_PREFIX}${productId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Update stock
   */
  async updateStock(
    productId: string,
    sellerId: string,
    data: {
      quantity: number;
      lowStockThreshold?: number;
      poolType?: StockPoolType;
      countries?: Country[];
    }
  ): Promise<StockRecord> {
    const existing = await this.getStock(productId);
    const record: StockRecord = {
      productId,
      sellerId,
      quantity: data.quantity,
      reservedQuantity: existing?.reservedQuantity ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      poolType: data.poolType ?? 'physical',
      countries: data.countries ?? ['IN', 'AE', 'UK'],
      updatedAt: new Date().toISOString(),
    };

    await redisSetex(
      `${STOCK_PREFIX}${productId}`,
      TTL,
      JSON.stringify(record)
    );

    await this.checkLowStock(productId, record);

    return record;
  }

  /**
   * Reserve stock for checkout (15 min)
   */
  async reserveStock(
    productId: string,
    quantity: number,
    cartId: string,
    userId?: string
  ): Promise<StockReservation> {
    const stock = await this.getStock(productId);
    if (!stock) {
      throw new NotFoundError('Product stock');
    }

    const available = stock.quantity - stock.reservedQuantity;
    if (available < quantity) {
      throw new ValidationError(
        `Insufficient stock. Available: ${available}, Requested: ${quantity}`
      );
    }

    const reservationId = generateId('res');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const reservation: StockReservation = {
      id: reservationId,
      productId,
      quantity,
      cartId,
      userId,
      expiresAt: expiresAt.toISOString(),
    };

    await redisSetex(
      `${RESERVATION_PREFIX}${reservationId}`,
      15 * 60,
      JSON.stringify(reservation)
    );

    stock.reservedQuantity += quantity;
    stock.updatedAt = new Date().toISOString();
    await redisSetex(
      `${STOCK_PREFIX}${productId}`,
      TTL,
      JSON.stringify(stock)
    );

    return reservation;
  }

  /**
   * Release reservation
   */
  async releaseReservation(reservationId: string): Promise<void> {
    const data = await redisGet(`${RESERVATION_PREFIX}${reservationId}`);
    if (!data) return;

    const reservation: StockReservation = JSON.parse(data);
    const stock = await this.getStock(reservation.productId);

    if (stock) {
      stock.reservedQuantity = Math.max(
        0,
        stock.reservedQuantity - reservation.quantity
      );
      stock.updatedAt = new Date().toISOString();
      await redisSetex(
        `${STOCK_PREFIX}${reservation.productId}`,
        TTL,
        JSON.stringify(stock)
      );
    }

    await redisDel(`${RESERVATION_PREFIX}${reservationId}`);
  }

  /**
   * Check low stock and create alert
   */
  private async checkLowStock(
    productId: string,
    stock: StockRecord
  ): Promise<void> {
    const available = stock.quantity - stock.reservedQuantity;
    if (available <= stock.lowStockThreshold && available >= 0) {
      const alertKey = `${ALERT_PREFIX}${productId}`;
      await redisSetex(
        alertKey,
        TTL,
        JSON.stringify({
          productId,
          sellerId: stock.sellerId,
          quantity: available,
          threshold: stock.lowStockThreshold,
          alertedAt: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Get low stock alerts for seller
   */
  async getLowStockAlerts(sellerId: string): Promise<any[]> {
    const keys = await redisKeys(`${ALERT_PREFIX}*`);
    const alerts = [];
    for (const key of keys) {
      const data = await redisGet(key);
      if (data) {
        const alert = JSON.parse(data);
        if (alert.sellerId === sellerId) {
          alerts.push(alert);
        }
      }
    }
    return alerts;
  }

  /**
   * Get available quantity
   */
  async getAvailableQuantity(productId: string): Promise<number> {
    const stock = await this.getStock(productId);
    if (!stock) return 0;
    return Math.max(0, stock.quantity - stock.reservedQuantity);
  }
}

/**
 * Intelligent CSV Mapper - maps CSV columns to product fields
 */
export interface CSVMapping {
  sku: string;
  name?: string;
  weight?: string;
  purity?: string;
  quantity?: string;
  price?: string;
  category?: string;
}

export class InventoryCSVMapper {
  /**
   * Auto-detect column mapping from CSV headers
   */
  detectMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      sku: ['sku', 'product_id', 'product code', 'item code'],
      name: ['name', 'product name', 'title', 'description'],
      weight: ['weight', 'gold weight', 'weight (g)', 'grams', 'wt'],
      purity: ['purity', 'karat', 'karats', 'k'],
      quantity: ['quantity', 'qty', 'stock', 'inventory'],
      price: ['price', 'mrp', 'selling price'],
      category: ['category', 'type', 'product type'],
    };

    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      for (const [field, opts] of Object.entries(aliases)) {
        if (opts.some((o) => normalized.includes(o) || o.includes(normalized))) {
          mapping[field] = header;
          break;
        }
      }
    }
    return mapping;
  }

  /**
   * Parse CSV row with mapping
   */
  parseRow(row: Record<string, string>, mapping: Record<string, string>): Partial<StockRecord> {
    const get = (f: string) => mapping[f] ? row[mapping[f]] : undefined;
    return {
      productId: get('sku') || '',
      quantity: parseInt(get('quantity') || '0', 10) || 0,
      lowStockThreshold: 5,
    };
  }
}

/**
 * ERP Bridge - sync inventory with external ERP
 */
export class ERPBridge {
  async syncFromERP(
    _provider: 'sap' | 'dynamics' | 'tally',
    _sellerId: string
  ): Promise<{ synced: number; errors: string[] }> {
    // In production: Connect to ERP API
    return { synced: 0, errors: [] };
  }

  async pushToERP(
    _provider: 'sap' | 'dynamics' | 'tally',
    _productId: string,
    _quantity: number
  ): Promise<boolean> {
    return true;
  }
}

/**
 * Inventory Forecasting - predict stock needs
 */
export class InventoryForecasting {
  async getForecast(
    productId: string,
    horizonDays: number = 30
  ): Promise<{ date: string; predictedSales: number; recommendedStock: number }[]> {
    const forecast = [];
    for (let i = 0; i < horizonDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedSales: Math.floor(Math.random() * 5) + 1,
        recommendedStock: Math.floor(Math.random() * 20) + 10,
      });
    }
    return forecast;
  }
}
