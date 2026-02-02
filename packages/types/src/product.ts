// Product types

import { Country, Currency, FileUpload, Money, Timestamps, SoftDelete } from './common';

export type ProductCategory =
  | 'necklaces'
  | 'earrings'
  | 'rings'
  | 'bracelets'
  | 'bangles'
  | 'pendants'
  | 'mens_jewelry'
  | 'gold_bars'
  | 'gold_coins';

export type MetalType = 'gold' | 'silver' | 'platinum' | 'palladium';

export type GoldPurity = '24K' | '22K' | '21K' | '18K' | '14K' | '10K';

export type PricingModel = 'fixed' | 'dynamic';

export interface Product extends Timestamps, SoftDelete {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Categorization
  category: ProductCategory;
  subcategory?: string;
  collections: string[];
  tags: string[];
  
  // Media
  images: ProductImage[];
  video360Url?: string;
  arModelUrl?: string; // GLB format
  arEnabled: boolean;
  
  // Pricing
  pricingModel: PricingModel;
  basePrice: Money;
  currentPrice?: Money;
  
  // For dynamic pricing
  goldWeight?: number; // in grams
  purity?: GoldPurity;
  metalType?: MetalType;
  laborCost?: Money;
  makingCharges?: number; // percentage
  
  // Stone details
  stones?: StoneDetail[];
  
  // Specifications
  specifications: ProductSpecifications;
  
  // Inventory
  stockQuantity: number;
  stockStatus: StockStatus;
  lowStockThreshold: number;
  
  // Visibility
  isActive: boolean;
  isVisible: boolean;
  countries: Country[]; // Available in these countries
  
  // Seller
  sellerId: string;
  tenantId: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Analytics
  viewCount: number;
  purchaseCount: number;
  wishlistCount: number;
  
  // Ratings
  averageRating: number;
  reviewCount: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
  type: 'main' | 'angle' | 'detail' | 'lifestyle';
}

export interface StoneDetail {
  type: string; // diamond, ruby, emerald, etc.
  cut?: string;
  clarity?: string;
  color?: string;
  caratWeight?: number;
  count: number;
  value: Money;
}

export interface ProductSpecifications {
  weight: number; // in grams
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'inch';
  };
  hallmarkNumber?: string;
  certifications?: string[];
  customAttributes?: Record<string, string>;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  options: Record<string, string>; // e.g., { size: 'M', color: 'gold' }
  priceModifier: Money;
  stockQuantity: number;
  images?: ProductImage[];
}

export interface Collection extends Timestamps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  productCount: number;
  isActive: boolean;
  order: number;
  type: 'curated' | 'automatic';
  rules?: CollectionRule[]; // For automatic collections
  countries: Country[];
}

export interface CollectionRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

// Predefined collections
export const PREDEFINED_COLLECTIONS = [
  'traditional_indian_bridal',
  'contemporary_minimalist',
  'middle_eastern_ornate',
  'festive_collection',
  'everyday_wear',
  'wedding_collection',
] as const;

export interface ProductFilter {
  category?: ProductCategory[];
  priceRange?: { min: number; max: number };
  metalType?: MetalType[];
  purity?: GoldPurity[];
  stoneType?: string[];
  collections?: string[];
  arEnabled?: boolean;
  inStock?: boolean;
  country?: Country;
  sellerId?: string;
}

export interface ProductSearchResult {
  products: Product[];
  filters: {
    categories: { name: ProductCategory; count: number }[];
    priceRange: { min: number; max: number };
    metals: { name: MetalType; count: number }[];
    purities: { name: GoldPurity; count: number }[];
  };
  total: number;
}

// Dynamic pricing calculation
export interface PriceCalculation {
  baseGoldPrice: number; // per gram
  goldWeight: number;
  purity: GoldPurity;
  purityMultiplier: number;
  goldValue: number;
  stoneValue: number;
  laborCost: number;
  makingCharges: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: Currency;
  calculatedAt: Date;
  validUntil: Date;
}

// Purity multipliers
export const PURITY_MULTIPLIERS: Record<GoldPurity, number> = {
  '24K': 1.0,
  '22K': 0.9167,
  '21K': 0.875,
  '18K': 0.75,
  '14K': 0.583,
  '10K': 0.417,
};
