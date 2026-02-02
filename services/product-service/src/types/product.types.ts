import type { Country, GoldPurity } from '@grandgold/types';

/**
 * Product entity
 */
export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  images: string[];
  price?: number;
  currentPrice?: number;
  pricingModel: 'fixed' | 'dynamic';
  goldWeight?: number;
  purity?: GoldPurity;
  stones: ProductStone[];
  laborCost?: number;
  sku: string;
  stock: number;
  countries: Country[];
  arEnabled: boolean;
  video360?: string;
  tags: string[];
  status: ProductStatus;
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product status
 */
export type ProductStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'archived';

/**
 * Stone information
 */
export interface ProductStone {
  type: string;
  weight: number;
  count: number;
}

/**
 * Create product input
 */
export interface CreateProductInput {
  sellerId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  images: string[];
  price?: number;
  pricingModel: 'fixed' | 'dynamic';
  goldWeight?: number;
  purity?: GoldPurity;
  stones?: ProductStone[];
  laborCost?: number;
  sku: string;
  stock: number;
  countries: Country[];
  arEnabled: boolean;
  video360?: string;
  tags?: string[];
}

/**
 * Update product input
 */
export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  images?: string[];
  price?: number;
  pricingModel?: 'fixed' | 'dynamic';
  goldWeight?: number;
  purity?: GoldPurity;
  stones?: ProductStone[];
  laborCost?: number;
  sku?: string;
  stock?: number;
  countries?: Country[];
  arEnabled?: boolean;
  video360?: string;
  tags?: string[];
  status?: ProductStatus;
}

/**
 * Product list options
 */
export interface ProductListOptions {
  page: number;
  limit: number;
  status?: string;
  category?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

/**
 * Product comparison result
 */
export interface ProductComparison {
  products: Product[];
  comparison: Record<string, ComparisonField>;
}

/**
 * Comparison field
 */
export interface ComparisonField {
  label: string;
  values: Record<string, string | number | boolean>;
}

/**
 * Wishlist item
 */
export interface WishlistItem {
  productId: string;
  addedAt: string;
}

/**
 * Wishlist with products
 */
export interface WishlistWithProducts {
  items: WishlistItem[];
  products?: Product[];
}

/**
 * Collection entity
 */
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bundle entity
 */
export interface Bundle {
  id: string;
  name: string;
  description?: string;
  productIds: string[];
  discountPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review entity
 */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Q&A Question
 */
export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  helpfulCount: number;
  createdAt: Date;
}

/**
 * Recently viewed item
 */
export interface RecentlyViewedItem {
  productId: string;
  viewedAt: Date;
}
