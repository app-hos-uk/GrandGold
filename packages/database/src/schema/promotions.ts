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

// ─── Influencer / Affiliate Margins ─────────────────────────────────

export const marginModelEnum = pgEnum('margin_model', ['combined', 'split']);

export const influencerMargins = pgTable('influencer_margins', {
  id: varchar('id', { length: 36 }).primaryKey(),
  influencerId: varchar('influencer_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 30 }).unique(), // influencer referral code

  // Margin model
  marginModel: marginModelEnum('margin_model').notNull().default('combined'),

  // Combined margin (when model = 'combined')
  combinedMarginPercent: numeric('combined_margin_percent', { precision: 5, scale: 2 }),

  // Split margin (when model = 'split')
  metalMarginPercent: numeric('metal_margin_percent', { precision: 5, scale: 2 }),
  stoneMarginPercent: numeric('stone_margin_percent', { precision: 5, scale: 2 }),
  mcMarginPercent: numeric('mc_margin_percent', { precision: 5, scale: 2 }),

  // Scope
  applicableCategories: jsonb('applicable_categories').$type<string[]>(),
  applicableMetalTypes: jsonb('applicable_metal_types').$type<string[]>(),
  minOrderWeight: numeric('min_order_weight', { precision: 8, scale: 3 }),

  // Validity
  countries: jsonb('countries').$type<string[]>().default(['IN', 'AE', 'UK']),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  // Performance tracking
  totalOrders: integer('total_orders').notNull().default(0),
  totalWeightSold: numeric('total_weight_sold', { precision: 12, scale: 3 }).default('0'),
  totalEarnings: numeric('total_earnings', { precision: 14, scale: 2 }).default('0'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Influencer payout ledger
export const influencerPayouts = pgTable('influencer_payouts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  influencerMarginId: varchar('influencer_margin_id', { length: 36 }).notNull().references(() => influencerMargins.id),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  orderItemId: varchar('order_item_id', { length: 36 }),

  // Payout breakdown
  metalValue: numeric('metal_value', { precision: 12, scale: 2 }),
  stoneValue: numeric('stone_value', { precision: 12, scale: 2 }),
  mcValue: numeric('mc_value', { precision: 12, scale: 2 }),
  orderTotal: numeric('order_total', { precision: 12, scale: 2 }).notNull(),

  // Calculated payout
  metalPayout: numeric('metal_payout', { precision: 10, scale: 2 }),
  stonePayout: numeric('stone_payout', { precision: 10, scale: 2 }),
  mcPayout: numeric('mc_payout', { precision: 10, scale: 2 }),
  totalPayout: numeric('total_payout', { precision: 10, scale: 2 }).notNull(),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // 'pending' | 'approved' | 'paid' | 'reversed'
  paidAt: timestamp('paid_at'),
  paymentReference: varchar('payment_reference', { length: 100 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type InfluencerMargin = typeof influencerMargins.$inferSelect;
export type NewInfluencerMargin = typeof influencerMargins.$inferInsert;
export type InfluencerPayout = typeof influencerPayouts.$inferSelect;
export type NewInfluencerPayout = typeof influencerPayouts.$inferInsert;
