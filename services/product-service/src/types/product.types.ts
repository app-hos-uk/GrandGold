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
 * Stone information (jewelry-standard detail)
 */
export interface ProductStone {
  type: string;             // diamond, ruby, emerald, sapphire …
  cut?: string;             // round, princess, oval …
  clarity?: string;         // IF, VVS1, VS1, SI1 …
  color?: string;           // D-Z (diamonds) or descriptive
  caratWeight?: number;     // per-stone carat weight
  count: number;
  weight?: number;          // legacy alias for caratWeight
  ratePerCarat?: number;    // price per carat
  totalValue?: number;      // pre-calculated total value
  certification?: string;   // GIA, IGI, HRD …
  certificationNumber?: string;
}

/**
 * Product specifications
 */
export interface ProductSpecifications {
  grossWeight?: number;     // total piece weight (grams)
  netWeight?: number;       // metal-only weight (grams)
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'inch';
  };
  size?: string;            // ring size, bangle size …
  hallmarkNumber?: string;  // BIS hallmark (India)
  certifications?: string[];
  customAttributes?: Record<string, string>;
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
  // Pricing
  price?: number;
  currency?: string;
  pricingModel: 'fixed' | 'dynamic';
  // Metal
  metalType?: string;
  goldWeight?: number;
  purity?: GoldPurity;
  wastagePercent?: number;
  // Making & charges
  makingCharges?: number;
  makingChargeType?: 'per_gram' | 'percentage' | 'flat';
  laborCost?: number;
  wastageCharges?: number;
  otherCharges?: number;
  otherChargesNote?: string;
  // Stones
  stones?: ProductStone[];
  // Specifications
  specifications?: ProductSpecifications;
  // Metadata
  occasion?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  style?: string;
  // Inventory
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
  /** When set, only return products available in this country */
  country?: string;
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
