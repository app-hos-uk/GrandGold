import { pgTable, varchar, text, boolean, timestamp, integer, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, countryEnum } from './users';
import { tenants } from './tenants';

// Seller status enum
export const sellerStatusEnum = pgEnum('seller_status', [
  'pending',
  'in_review',
  'approved',
  'rejected',
  'suspended',
]);

// Seller tier enum
export const sellerTierEnum = pgEnum('seller_tier', ['bronze', 'silver', 'gold', 'platinum']);

// Onboarding type enum
export const onboardingTypeEnum = pgEnum('onboarding_type', ['automated', 'manual']);

// Sellers table
export const sellers = pgTable('sellers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  
  // Business Info
  businessName: varchar('business_name', { length: 100 }).notNull(),
  businessType: varchar('business_type', { length: 20 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 50 }),
  taxId: varchar('tax_id', { length: 50 }),
  
  // Contact
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  website: text('website'),
  
  // Address
  businessAddress: jsonb('business_address').$type<{
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }>().notNull(),
  warehouseAddresses: jsonb('warehouse_addresses').$type<{
    id: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[]>().default([]),
  
  // Documents
  tradeLicense: jsonb('trade_license').$type<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>(),
  vatCertificate: jsonb('vat_certificate').$type<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>(),
  goldDealerPermit: jsonb('gold_dealer_permit').$type<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>(),
  
  // Bank Details
  bankDetails: jsonb('bank_details').$type<{
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchCode?: string;
    swiftCode?: string;
    iban?: string;
    country: string;
    isVerified: boolean;
  }>(),
  
  // Onboarding
  onboardingType: onboardingTypeEnum('onboarding_type').notNull(),
  onboardingStatus: sellerStatusEnum('onboarding_status').notNull().default('pending'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  
  // Agreement
  agreementSignedAt: timestamp('agreement_signed_at'),
  agreementDocuSignId: varchar('agreement_docusign_id', { length: 100 }),
  
  // Verification
  backgroundCheckStatus: varchar('background_check_status', { length: 20 }).notNull().default('pending'),
  backgroundCheckResult: jsonb('background_check_result'),
  
  // Settings
  settings: jsonb('settings').$type<{
    autoAcceptOrders: boolean;
    lowStockAlertThreshold: number;
    notificationPreferences: {
      newOrder: boolean;
      lowStock: boolean;
      review: boolean;
      settlement: boolean;
    };
    shippingSettings: {
      processingTime: number;
      domesticShipping: boolean;
      internationalShipping: boolean;
      freeShippingThreshold?: number;
    };
    visibility: {
      showInSearch: boolean;
      showRating: boolean;
      showResponseTime: boolean;
    };
  }>(),
  
  // Performance
  tier: sellerTierEnum('tier').notNull().default('bronze'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  totalSales: numeric('total_sales', { precision: 14, scale: 2 }).notNull().default('0'),
  totalOrders: integer('total_orders').notNull().default(0),
  
  // Commission
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull().default('10'),
  
  // Countries
  operatingCountries: jsonb('operating_countries').$type<string[]>().notNull().default(['IN']),
  
  // Store
  storeName: varchar('store_name', { length: 100 }),
  storeSlug: varchar('store_slug', { length: 100 }),
  storeLogo: text('store_logo'),
  storeBanner: text('store_banner'),
  storeDescription: text('store_description'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// Seller settlements
export const settlementStatusEnum = pgEnum('settlement_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const sellerSettlements = pgTable('seller_settlements', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sellerId: varchar('seller_id', { length: 36 }).notNull().references(() => sellers.id),
  
  // Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Amounts
  grossAmount: numeric('gross_amount', { precision: 14, scale: 2 }).notNull(),
  commission: numeric('commission', { precision: 12, scale: 2 }).notNull(),
  gatewayFees: numeric('gateway_fees', { precision: 10, scale: 2 }).notNull(),
  taxes: numeric('taxes', { precision: 10, scale: 2 }).notNull(),
  otherDeductions: numeric('other_deductions', { precision: 10, scale: 2 }).notNull().default('0'),
  netAmount: numeric('net_amount', { precision: 14, scale: 2 }).notNull(),
  
  // Status
  status: settlementStatusEnum('status').notNull().default('pending'),
  
  // Payment
  paymentMethod: varchar('payment_method', { length: 20 }),
  paymentReference: varchar('payment_reference', { length: 100 }),
  paidAt: timestamp('paid_at'),
  
  // Orders
  orderCount: integer('order_count').notNull(),
  orderIds: jsonb('order_ids').$type<string[]>().notNull(),
  
  // Currency
  currency: varchar('currency', { length: 3 }).notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Seller ratings/reviews
export const sellerReviews = pgTable('seller_reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sellerId: varchar('seller_id', { length: 36 }).notNull().references(() => sellers.id),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id),
  orderId: varchar('order_id', { length: 36 }),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 100 }),
  content: text('content'),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Seller support tickets
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in_progress',
  'waiting_response',
  'resolved',
  'closed',
]);

export const sellerSupportTickets = pgTable('seller_support_tickets', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sellerId: varchar('seller_id', { length: 36 }).notNull().references(() => sellers.id),
  subject: varchar('subject', { length: 200 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  status: ticketStatusEnum('status').notNull().default('open'),
  assignedTo: varchar('assigned_to', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const sellersRelations = relations(sellers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sellers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [sellers.userId],
    references: [users.id],
  }),
  settlements: many(sellerSettlements),
  reviews: many(sellerReviews),
  supportTickets: many(sellerSupportTickets),
}));

export const sellerSettlementsRelations = relations(sellerSettlements, ({ one }) => ({
  seller: one(sellers, {
    fields: [sellerSettlements.sellerId],
    references: [sellers.id],
  }),
}));

// Type exports
export type Seller = typeof sellers.$inferSelect;
export type NewSeller = typeof sellers.$inferInsert;
export type SellerSettlement = typeof sellerSettlements.$inferSelect;
export type NewSellerSettlement = typeof sellerSettlements.$inferInsert;
export type SellerReview = typeof sellerReviews.$inferSelect;
export type NewSellerReview = typeof sellerReviews.$inferInsert;
export type SellerSupportTicket = typeof sellerSupportTickets.$inferSelect;
export type NewSellerSupportTicket = typeof sellerSupportTickets.$inferInsert;
