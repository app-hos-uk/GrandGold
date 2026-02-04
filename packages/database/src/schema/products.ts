import { pgTable, varchar, text, boolean, timestamp, integer, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { countryEnum } from './users';
import { tenants } from './tenants';

// Product category enum
export const productCategoryEnum = pgEnum('product_category', [
  'necklaces',
  'earrings',
  'rings',
  'bracelets',
  'bangles',
  'pendants',
  'mens_jewelry',
  'gold_bars',
  'gold_coins',
]);

// Metal type enum
export const metalTypeEnum = pgEnum('metal_type', ['gold', 'silver', 'platinum', 'palladium']);

// Purity enum
export const purityEnum = pgEnum('purity', ['24K', '22K', '21K', '18K', '14K', '10K']);

// Pricing model enum
export const pricingModelEnum = pgEnum('pricing_model', ['fixed', 'dynamic']);

// Stock status enum
export const stockStatusEnum = pgEnum('stock_status', ['in_stock', 'low_stock', 'out_of_stock', 'made_to_order']);

// Products table
export const products = pgTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 250 }).notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  
  // Categorization
  category: productCategoryEnum('category').notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  collections: jsonb('collections').$type<string[]>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Media
  images: jsonb('images').$type<{
    id: string;
    url: string;
    alt?: string;
    order: number;
    isPrimary: boolean;
    type: 'main' | 'angle' | 'detail' | 'lifestyle';
  }[]>().default([]),
  video360Url: text('video_360_url'),
  arModelUrl: text('ar_model_url'),
  arEnabled: boolean('ar_enabled').notNull().default(false),
  
  // Pricing
  pricingModel: pricingModelEnum('pricing_model').notNull().default('fixed'),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
  currentPrice: numeric('current_price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  
  // For dynamic pricing
  goldWeight: numeric('gold_weight', { precision: 8, scale: 3 }),
  purity: purityEnum('purity'),
  metalType: metalTypeEnum('metal_type'),
  laborCost: numeric('labor_cost', { precision: 10, scale: 2 }),
  makingCharges: numeric('making_charges', { precision: 5, scale: 2 }),
  
  // Stones
  stones: jsonb('stones').$type<{
    type: string;
    cut?: string;
    clarity?: string;
    color?: string;
    caratWeight?: number;
    count: number;
    value: number;
  }[]>(),
  
  // Specifications
  specifications: jsonb('specifications').$type<{
    weight: number;
    dimensions?: { length?: number; width?: number; height?: number; unit: string };
    hallmarkNumber?: string;
    certifications?: string[];
    customAttributes?: Record<string, string>;
  }>(),
  
  // Inventory
  stockQuantity: integer('stock_quantity').notNull().default(0),
  stockStatus: stockStatusEnum('stock_status').notNull().default('in_stock'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  
  // Visibility
  isActive: boolean('is_active').notNull().default(true),
  isVisible: boolean('is_visible').notNull().default(true),
  countries: jsonb('countries').$type<string[]>().notNull().default(['IN', 'AE', 'UK']),
  
  // Seller
  sellerId: varchar('seller_id', { length: 36 }).notNull(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 100 }),
  metaDescription: text('meta_description'),
  
  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  purchaseCount: integer('purchase_count').notNull().default(0),
  wishlistCount: integer('wishlist_count').notNull().default(0),
  
  // Ratings
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// Collections table
export const collections = pgTable('collections', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  image: text('image'),
  bannerImage: text('banner_image'),
  productCount: integer('product_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  order: integer('order').notNull().default(0),
  type: varchar('type', { length: 20 }).notNull().default('curated'),
  rules: jsonb('rules'),
  countries: jsonb('countries').$type<string[]>().notNull().default(['IN', 'AE', 'UK']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Product reviews
export const productReviews = pgTable('product_reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id),
  userId: varchar('user_id', { length: 36 }).notNull(),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 100 }),
  content: text('content'),
  images: jsonb('images').$type<string[]>(),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  isApproved: boolean('is_approved').notNull().default(false),
  helpfulCount: integer('helpful_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Wishlist
export const wishlists = pgTable('wishlists', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id),
  country: countryEnum('country').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  reviews: many(productReviews),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));

// Categories table (dynamic, hierarchical)
export const categories = pgTable('categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  parentId: varchar('parent_id', { length: 36 }),
  image: text('image'),
  icon: varchar('icon', { length: 50 }),
  productCount: integer('product_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  order: integer('order').notNull().default(0),
  level: integer('level').notNull().default(0), // 0 = root, 1 = child, 2 = grandchild
  path: text('path'), // e.g., "1/5/12" for breadcrumb
  metaTitle: varchar('meta_title', { length: 100 }),
  metaDescription: text('meta_description'),
  countries: jsonb('countries').$type<string[]>().notNull().default(['IN', 'AE', 'UK']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, { relationName: 'parentChild' }),
}));

// Type exports
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
