import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country, GoldPurity } from '@grandgold/types';
import Redis from 'ioredis';
import { MeiliSearch } from 'meilisearch';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListOptions,
  PaginatedResult,
} from '../types/product.types';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize Meilisearch
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY,
});

const productIndex = meilisearch.index('products');

export class ProductService {
  /**
   * Create product
   */
  async createProduct(input: CreateProductInput): Promise<any> {
    const productId = generateId('prd');

    const product = {
      id: productId,
      sellerId: input.sellerId,
      name: input.name,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      images: input.images,
      price: input.price,
      pricingModel: input.pricingModel,
      goldWeight: input.goldWeight,
      purity: input.purity,
      stones: input.stones || [],
      laborCost: input.laborCost,
      sku: input.sku,
      stock: input.stock,
      countries: input.countries,
      arEnabled: input.arEnabled,
      video360: input.video360,
      tags: input.tags || [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in Redis
    await redis.hset('products', productId, JSON.stringify(product));

    // Index in Meilisearch
    await productIndex.addDocuments([product]);

    return product;
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string, country?: Country): Promise<any> {
    const data = await redis.hget('products', productId);

    if (!data) {
      throw new NotFoundError('Product');
    }

    const product = JSON.parse(data);

    // Check if product is available in country
    if (country && !product.countries.includes(country)) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, sellerId: string, updates: Partial<CreateProductInput>): Promise<any> {
    const product = await this.getProduct(productId);

    if (product.sellerId !== sellerId) {
      throw new ValidationError('Unauthorized');
    }

    const updated = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };

    await redis.hset('products', productId, JSON.stringify(updated));
    await productIndex.updateDocuments([updated]);

    return updated;
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const product = await this.getProduct(productId);

    if (product.sellerId !== sellerId) {
      throw new ValidationError('Unauthorized');
    }

    await redis.hdel('products', productId);
    await productIndex.deleteDocument(productId);
  }

  /**
   * Get products by seller
   */
  async getSellerProducts(
    _sellerId: string,
    _options: ProductListOptions
  ): Promise<PaginatedResult<Product>> {
    // In production, use database query
    // For now, return mock data
    return {
      data: [],
      total: 0,
    };
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    country: Country,
    options: { page: number; limit: number }
  ): Promise<PaginatedResult<Product>> {
    const results = await productIndex.search('', {
      filter: `category = ${category} AND countries = ${country}`,
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
    });

    return {
      data: results.hits as Product[],
      total: results.estimatedTotalHits || 0,
    };
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    country: Country,
    filters?: {
      category?: string;
      priceMin?: number;
      priceMax?: number;
      purity?: GoldPurity;
      arEnabled?: boolean;
    },
    options: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    const searchFilters: string[] = [`countries = ${country}`];

    if (filters?.category) {
      searchFilters.push(`category = ${filters.category}`);
    }

    if (filters?.priceMin !== undefined) {
      searchFilters.push(`price >= ${filters.priceMin}`);
    }

    if (filters?.priceMax !== undefined) {
      searchFilters.push(`price <= ${filters.priceMax}`);
    }

    if (filters?.purity) {
      searchFilters.push(`purity = ${filters.purity}`);
    }

    if (filters?.arEnabled !== undefined) {
      searchFilters.push(`arEnabled = ${filters.arEnabled}`);
    }

    const results = await productIndex.search(query, {
      filter: searchFilters.join(' AND '),
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
    });

    return {
      data: results.hits as Product[],
      total: results.estimatedTotalHits || 0,
    };
  }

  /**
   * List all products (Admin) - no country filter
   */
  async listAllProducts(options: ProductListOptions = { page: 1, limit: 50 }): Promise<PaginatedResult<Product>> {
    const filters: string[] = [];
    if (options.category) filters.push(`category = ${options.category}`);
    if (options.status) filters.push(`status = ${options.status}`);

    const results = await productIndex.search('', {
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
    });

    return {
      data: results.hits as Product[],
      total: results.estimatedTotalHits || 0,
    };
  }
}
