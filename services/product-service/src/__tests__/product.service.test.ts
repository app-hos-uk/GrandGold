import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis
vi.mock('ioredis', () => {
  const MockRedis = class {
    get = vi.fn();
    set = vi.fn();
    setex = vi.fn();
    del = vi.fn();
    on = vi.fn();
    hset = vi.fn();
    hget = vi.fn();
    hdel = vi.fn();
    hgetall = vi.fn();
  };
  return { default: MockRedis };
});

// Mock MeiliSearch
vi.mock('meilisearch', () => {
  const MockMeiliSearch = class {
    index = vi.fn(() => ({
      search: vi.fn().mockResolvedValue({
        hits: [
          {
            id: 'prd_123',
            name: 'Gold Necklace',
            price: 50000,
            category: 'necklaces',
            purity: '22K',
            countries: ['IN'],
          },
        ],
        estimatedTotalHits: 1,
      }),
      addDocuments: vi.fn(),
      updateDocuments: vi.fn(),
      deleteDocument: vi.fn(),
    }));
  };
  return { MeiliSearch: MockMeiliSearch };
});

// Mock utils
vi.mock('@grandgold/utils', () => ({
  generateId: vi.fn().mockReturnValue('prd_test_123'),
  NotFoundError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  ValidationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

import { ProductService } from '../services/product.service';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product with valid input', async () => {
      const input = {
        sellerId: 'seller_123',
        name: 'Gold Necklace',
        description: 'Beautiful 22K gold necklace',
        category: 'necklaces',
        images: ['image1.jpg', 'image2.jpg'],
        price: 50000,
        pricingModel: 'fixed' as const,
        goldWeight: 10,
        purity: '22K' as const,
        sku: 'GN-001',
        stock: 5,
        countries: ['IN' as const],
        arEnabled: true,
      };

      const result = await productService.createProduct(input);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Gold Necklace');
      expect(result.category).toBe('necklaces');
      expect(result.status).toBe('draft');
    });

    it('should set default values for optional fields', async () => {
      const input = {
        sellerId: 'seller_123',
        name: 'Simple Ring',
        description: 'A simple gold ring',
        category: 'rings',
        images: ['ring.jpg'],
        pricingModel: 'fixed' as const,
        sku: 'SR-001',
        stock: 10,
        countries: ['IN' as const],
        arEnabled: false,
      };

      const result = await productService.createProduct(input);

      expect(result.stones).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.status).toBe('draft');
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for a category', async () => {
      const result = await productService.getProductsByCategory(
        'necklaces',
        'IN',
        { page: 1, limit: 20 }
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('searchProducts', () => {
    it('should search products with query', async () => {
      const result = await productService.searchProducts(
        'gold necklace',
        'IN',
        { category: 'necklaces' },
        { page: 1, limit: 20 }
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });

    it('should apply price filters', async () => {
      const result = await productService.searchProducts(
        'gold',
        'IN',
        { priceMin: 10000, priceMax: 100000 },
        { page: 1, limit: 20 }
      );

      expect(result).toHaveProperty('data');
    });

    it('should filter by AR enabled', async () => {
      const result = await productService.searchProducts(
        'necklace',
        'IN',
        { arEnabled: true },
        { page: 1, limit: 20 }
      );

      expect(result).toHaveProperty('data');
    });
  });

  describe('listAllProducts', () => {
    it('should list all products for admin', async () => {
      const result = await productService.listAllProducts({
        page: 1,
        limit: 50,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });

    it('should filter by category', async () => {
      const result = await productService.listAllProducts({
        page: 1,
        limit: 50,
        category: 'necklaces',
      });

      expect(result).toHaveProperty('data');
    });
  });
});
