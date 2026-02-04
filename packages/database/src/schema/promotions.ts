import { pgTable, varchar, text, boolean, timestamp, integer, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const promoTypeEnum = pgEnum('promo_type', ['percentage', 'fixed', 'free_shipping', 'bogo']);
export const promoScopeEnum = pgEnum('promo_scope', ['entire_order', 'category', 'product', 'min_quantity']);
export const promoStatusEnum = pgEnum('promo_status', ['active', 'scheduled', 'expired', 'disabled']);

export const coupons = pgTable('coupons', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  type: promoTypeEnum('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 }),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 12, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usageLimitPerUser: integer('usage_limit_per_user').default(1),
  usedCount: integer('used_count').notNull().default(0),
  scope: promoScopeEnum('scope').notNull().default('entire_order'),
  scopeCategoryIds: jsonb('scope_category_ids').$type<string[]>(),
  scopeProductIds: jsonb('scope_product_ids').$type<string[]>(),
  countries: jsonb('countries').$type<string[]>().default(['IN', 'AE', 'UK']),
  status: promoStatusEnum('status').notNull().default('active'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 36 }),
});

export const automaticDiscounts = pgTable('automatic_discounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: promoTypeEnum('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 }),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 12, scale: 2 }),
  scope: promoScopeEnum('scope').notNull().default('entire_order'),
  scopeCategoryIds: jsonb('scope_category_ids').$type<string[]>(),
  countries: jsonb('countries').$type<string[]>().default(['IN', 'AE', 'UK']),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const flashSales = pgTable('flash_sales', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  discountType: promoTypeEnum('type').notNull(),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  productIds: jsonb('product_ids').$type<string[]>().notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  countries: jsonb('countries').$type<string[]>().default(['IN', 'AE', 'UK']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type AutomaticDiscount = typeof automaticDiscounts.$inferSelect;
export type NewAutomaticDiscount = typeof automaticDiscounts.$inferInsert;
export type FlashSale = typeof flashSales.$inferSelect;
export type NewFlashSale = typeof flashSales.$inferInsert;
