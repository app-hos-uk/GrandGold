import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import Redis from 'ioredis';
import { ProductService } from './product.service';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const BUNDLE_PREFIX = 'product_bundle:';
const TTL = 60 * 60 * 24 * 365;
const productService = new ProductService();

export interface ProductBundle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productIds: string[];
  discountPercent?: number;
  bundlePrice?: number;
  sellerId: string;
  countries: Country[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class BundleService {
  /**
   * Create bundle
   */
  async createBundle(input: {
    name: string;
    description?: string;
    productIds: string[];
    discountPercent?: number;
    bundlePrice?: number;
    sellerId: string;
    countries: Country[];
  }): Promise<ProductBundle> {
    if (input.productIds.length < 2) {
      throw new ValidationError('Bundle must have at least 2 products');
    }

    const id = generateId('bnd');
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const bundle: ProductBundle = {
      id,
      name: input.name,
      slug: `${slug}-${id.slice(-6)}`,
      description: input.description,
      productIds: input.productIds,
      discountPercent: input.discountPercent,
      bundlePrice: input.bundlePrice,
      sellerId: input.sellerId,
      countries: input.countries,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.setex(`${BUNDLE_PREFIX}${id}`, TTL, JSON.stringify(bundle));
    await redis.sadd(`bundles:${input.sellerId}`, id);

    return bundle;
  }

  /**
   * Get bundle with products
   */
  async getBundle(bundleId: string, country?: Country): Promise<any> {
    const data = await redis.get(`${BUNDLE_PREFIX}${bundleId}`);
    if (!data) throw new NotFoundError('Bundle');

    const bundle = JSON.parse(data);
    if (country && !bundle.countries.includes(country)) {
      throw new NotFoundError('Bundle');
    }

    const products = [];
    for (const pid of bundle.productIds) {
      try {
        const p = await productService.getProduct(pid, country);
        products.push(p);
      } catch {
        // Skip unavailable products
      }
    }

    const totalPrice = products.reduce((sum, p) => sum + (p.price || p.currentPrice || 0), 0);
    const discountedPrice = bundle.discountPercent
      ? totalPrice * (1 - bundle.discountPercent / 100)
      : bundle.bundlePrice ?? totalPrice;

    return {
      ...bundle,
      products,
      totalPrice,
      discountedPrice,
      savings: totalPrice - discountedPrice,
    };
  }

  /**
   * Get bundles for product
   */
  async getBundlesForProduct(productId: string, country?: Country): Promise<ProductBundle[]> {
    const keys = await redis.keys(`${BUNDLE_PREFIX}*`);
    const bundles: ProductBundle[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const b = JSON.parse(data);
        if (b.productIds.includes(productId) && b.isActive) {
          if (!country || b.countries.includes(country)) {
            bundles.push(b);
          }
        }
      }
    }

    return bundles;
  }

  /**
   * Update bundle
   */
  async updateBundle(
    bundleId: string,
    sellerId: string,
    updates: Partial<ProductBundle>
  ): Promise<ProductBundle> {
    const data = await redis.get(`${BUNDLE_PREFIX}${bundleId}`);
    if (!data) throw new NotFoundError('Bundle');

    const bundle = JSON.parse(data);
    if (bundle.sellerId !== sellerId) {
      throw new ValidationError('Unauthorized');
    }

    const updated = { ...bundle, ...updates, updatedAt: new Date().toISOString() };
    await redis.setex(`${BUNDLE_PREFIX}${bundleId}`, TTL, JSON.stringify(updated));

    return updated;
  }
}
