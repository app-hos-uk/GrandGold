import { pgTable, varchar, text, boolean, timestamp, integer, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, countryEnum } from './users';
import { products } from './products';
import { tenants } from './tenants';

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
]);

// Orders table
export const orders = pgTable('orders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  
  // Customer
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  
  // Seller (hidden until payment - Veil Logic)
  sellerId: varchar('seller_id', { length: 36 }).notNull(),
  sellerRevealed: boolean('seller_revealed').notNull().default(false),
  
  // Tenant
  tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id),
  
  // Country
  country: countryEnum('country').notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  
  // Addresses
  shippingAddress: jsonb('shipping_address').$type<{
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    latitude?: string;
    longitude?: string;
  }>().notNull(),
  billingAddress: jsonb('billing_address').$type<{
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }>().notNull(),
  
  // Pricing
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  
  // Price lock
  priceLockId: varchar('price_lock_id', { length: 36 }),
  priceLockExpiresAt: timestamp('price_lock_expires_at'),
  
  // Status
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  
  // Payment
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentGateway: varchar('payment_gateway', { length: 20 }),
  paymentTransactionId: varchar('payment_transaction_id', { length: 100 }),
  paidAt: timestamp('paid_at'),
  
  // Shipping
  shippingMethod: varchar('shipping_method', { length: 50 }),
  shippingCarrier: varchar('shipping_carrier', { length: 50 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  
  // Notes
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),
  
  // Gift
  isGift: boolean('is_gift').notNull().default(false),
  giftMessage: text('gift_message'),
  giftWrapping: boolean('gift_wrapping').notNull().default(false),
  
  // Insurance
  insuranceIncluded: boolean('insurance_included').notNull().default(false),
  insuranceAmount: numeric('insurance_amount', { precision: 10, scale: 2 }),
  
  // Timestamps
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order items table
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]);

export const orderItems = pgTable('order_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id),
  productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id),
  variantId: varchar('variant_id', { length: 36 }),
  
  // Product snapshot (frozen at purchase time for audit trail)
  productSnapshot: jsonb('product_snapshot').$type<{
    name: string;
    sku: string;
    image: string;
    category: string;
    // Metal details
    metalType?: string;
    purity?: string;
    goldWeight?: number;         // net metal weight in grams
    grossWeight?: number;        // total weight incl. stones in grams
    // Making charges
    makingCharges?: number;      // absolute MC amount
    makingChargeType?: string;   // 'per_gram' | 'percentage' | 'flat'
    makingChargePercent?: number; // MC as % of metal value
    laborCost?: number;
    wastagePercent?: number;
    wastageCharges?: number;
    // Stone details
    stoneWeight?: number;        // total stone carat weight
    stoneValue?: number;         // total stone cost
    stonesCount?: number;
    // Pricing breakdown
    metalValue?: number;         // pure metal value (goldWeight x rate)
    goldRateAtPurchase?: number; // per-gram rate at time of purchase
    // Hallmark
    hallmarkNumber?: string;
  }>().notNull(),
  
  // Quantity
  quantity: integer('quantity').notNull(),
  
  // Pricing
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  priceCalculation: jsonb('price_calculation'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  
  // Status
  status: orderItemStatusEnum('status').notNull().default('pending'),
  
  // Fulfillment
  fulfilledQuantity: integer('fulfilled_quantity').notNull().default(0),
  returnedQuantity: integer('returned_quantity').notNull().default(0),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order timeline
export const orderTimeline = pgTable('order_timeline', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id),
  event: varchar('event', { length: 100 }).notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Price locks table (for checkout price freezing)
export const priceLocks = pgTable('price_locks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  
  // Items with locked prices
  items: jsonb('items').$type<{
    productId: string;
    variantId?: string;
    quantity: number;
    lockedPrice: number;
    priceCalculation: Record<string, unknown>;
  }[]>().notNull(),
  
  // Lock details
  goldPriceAtLock: numeric('gold_price_at_lock', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('active'),
  
  // Timing
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Shopping carts
export const carts = pgTable('carts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  sessionId: varchar('session_id', { length: 100 }),
  
  // Items
  items: jsonb('items').$type<{
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
    addedAt: string;
  }[]>().notNull().default([]),
  
  // Country
  country: countryEnum('country').notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

// ─── Return / Exchange / Refund ──────────────────────────────────────

export const returnReasonEnum = pgEnum('return_reason', [
  'defective',
  'not_as_described',
  'wrong_item',
  'changed_mind',
  'size_issue',
  // Jewelry-specific reasons
  'purity_mismatch',
  'weight_discrepancy',
  'stone_missing',
  'stone_damaged',
  'hallmark_issue',
  'certificate_mismatch',
  'other',
]);

export const returnStatusEnum = pgEnum('return_status', [
  'requested',
  'approved',
  'rejected',
  'in_transit',
  'received',
  'qc_inspection',
  'qc_passed',
  'qc_failed',
  'dispute',
  'exchange_in_progress',
  'refund_processing',
  'refunded',
  'exchanged',
  'credit_issued',
  'closed',
]);

// Resolution type enum
export const returnResolutionEnum = pgEnum('return_resolution', [
  'refund',
  'exchange',
  'store_credit',
  'gold_credit',
]);

export const returnRequests = pgTable('return_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => orders.id),
  orderItemId: varchar('order_item_id', { length: 36 }).notNull().references(() => orderItems.id),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id),

  // Reason
  reason: returnReasonEnum('reason').notNull(),
  reasonDetails: text('reason_details'),
  customerPhotos: jsonb('customer_photos').$type<string[]>().default([]),

  // Items
  quantity: integer('quantity').notNull(),

  // Status & Resolution
  status: returnStatusEnum('status').notNull().default('requested'),
  resolution: returnResolutionEnum('resolution'),

  // ── Refund breakdown ──
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
  refundBreakdown: jsonb('refund_breakdown').$type<{
    metalValue: number;
    makingCharges: number;
    stoneValue: number;
    subtotal: number;
    taxReversed: number;
    shippingRefund: number;
    restockingFee: number;
    restockingFeeTax: number;
    returnShippingDeducted: number;
    netRefund: number;
    // Gold credit specific
    goldCreditGrams?: number;
    goldRateAtRefund?: number;
  }>(),
  refundedAt: timestamp('refunded_at'),
  refundTransactionId: varchar('refund_transaction_id', { length: 100 }),

  // ── Exchange details ──
  exchangeProductId: varchar('exchange_product_id', { length: 36 }),
  exchangeOrderId: varchar('exchange_order_id', { length: 36 }),
  priceDifference: numeric('price_difference', { precision: 12, scale: 2 }),
  // positive = customer pays more, negative = customer gets partial refund

  // ── QC Inspection ──
  qcInspection: jsonb('qc_inspection').$type<{
    // Weight verification
    originalWeightGrams: number;
    returnedWeightGrams: number;
    weightVarianceGrams: number;
    weightToleranceGrams: number;
    weightVerdict: 'pass' | 'fail';
    // Purity test
    originalPurity: string;
    testedPurity: string;
    purityVerdict: 'pass' | 'fail' | 'skipped';
    purityTestMethod: 'xrf' | 'touchstone' | 'acid_test' | 'fire_assay';
    // Stones
    stonesIntact: boolean;
    stonesCount: number;
    stonesVerdict: 'pass' | 'fail' | 'na';
    // Hallmark
    hallmarkVerified: boolean;
    hallmarkNumber: string;
    // Condition
    itemCondition: 'as_new' | 'minor_wear' | 'damaged' | 'tampered';
    conditionNotes: string;
    // Inspector details
    inspectedBy: string;
    inspectedAt: string;
    qcPhotos: string[];
  }>(),

  // ── Tax Credit Note ──
  taxCreditNote: jsonb('tax_credit_note').$type<{
    creditNoteNumber: string;
    creditNoteDate: string;
    originalInvoiceNumber: string;
    originalInvoiceDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxableValue: number;
      taxRate: number;
      taxAmount: number;
      totalValue: number;
      // Weight details for audit
      goldWeight?: number;
      purity?: string;
    }>;
    subtotal: number;
    taxReversed: number;
    totalCredited: number;
    currency: string;
    taxType: string; // 'GST' | 'VAT'
    // For exchange: link to the new invoice
    exchangeInvoiceNumber?: string;
  }>(),

  // ── Return shipping ──
  returnShippingPolicy: varchar('return_shipping_policy', { length: 20 }),
  returnShippingPaidBy: varchar('return_shipping_paid_by', { length: 10 }),
  returnShippingCost: numeric('return_shipping_cost', { precision: 10, scale: 2 }),
  returnLabel: text('return_label'),
  returnTrackingNumber: varchar('return_tracking_number', { length: 100 }),
  insuranceDeclaredValue: numeric('insurance_declared_value', { precision: 12, scale: 2 }),

  // ── Approval / Processing ──
  approvedBy: varchar('approved_by', { length: 36 }),
  approvedAt: timestamp('approved_at'),
  rejectedBy: varchar('rejected_by', { length: 36 }),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  receivedAt: timestamp('received_at'),
  processedBy: varchar('processed_by', { length: 36 }),
  processedAt: timestamp('processed_at'),

  // ── Restocking ──
  restockingFeePercent: numeric('restocking_fee_percent', { precision: 5, scale: 2 }).default('0'),

  // Notes
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Gold Credits (wallet) ──────────────────────────────────────────

export const goldCredits = pgTable('gold_credits', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id),

  // Balance
  balanceGrams: numeric('balance_grams', { precision: 10, scale: 4 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const goldCreditTransactions = pgTable('gold_credit_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id),

  type: varchar('type', { length: 10 }).notNull(), // 'credit' | 'debit'
  grams: numeric('grams', { precision: 10, scale: 4 }).notNull(),
  goldRatePerGram: numeric('gold_rate_per_gram', { precision: 10, scale: 2 }).notNull(),
  equivalentAmount: numeric('equivalent_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),

  // Reference
  returnRequestId: varchar('return_request_id', { length: 36 }),
  orderId: varchar('order_id', { length: 36 }),
  note: text('note'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  items: many(orderItems),
  timeline: many(orderTimeline),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Type exports
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type PriceLock = typeof priceLocks.$inferSelect;
export type NewPriceLock = typeof priceLocks.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type NewReturnRequest = typeof returnRequests.$inferInsert;
export type GoldCredit = typeof goldCredits.$inferSelect;
export type NewGoldCredit = typeof goldCredits.$inferInsert;
export type GoldCreditTransaction = typeof goldCreditTransactions.$inferSelect;
export type NewGoldCreditTransaction = typeof goldCreditTransactions.$inferInsert;
