import { pgTable, varchar, text, boolean, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'country_admin',
  'manager',
  'staff',
  'seller',
  'influencer',
  'consultant',
  'customer',
]);

export const countryEnum = pgEnum('country', ['IN', 'AE', 'UK']);

export const kycStatusEnum = pgEnum('kyc_status', [
  'none',
  'pending',
  'tier1',
  'tier2',
  'rejected',
]);

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  role: userRoleEnum('role').notNull().default('customer'),
  country: countryEnum('country').notNull(),
  tenantId: varchar('tenant_id', { length: 36 }),
  
  // Verification
  emailVerified: boolean('email_verified').notNull().default(false),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  phoneVerifiedAt: timestamp('phone_verified_at'),
  
  // MFA
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
  mfaBackupCodes: jsonb('mfa_backup_codes').$type<string[]>(),
  
  // KYC
  kycStatus: kycStatusEnum('kyc_status').notNull().default('none'),
  kycTier: integer('kyc_tier').notNull().default(0),
  kycVerifiedAt: timestamp('kyc_verified_at'),
  
  // OAuth
  googleId: varchar('google_id', { length: 255 }),
  facebookId: varchar('facebook_id', { length: 255 }),
  appleId: varchar('apple_id', { length: 255 }),
  
  // Preferences
  preferences: jsonb('preferences').$type<{
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: { orders: boolean; promotions: boolean; priceAlerts: boolean; newsletter: boolean };
      whatsapp: { orders: boolean; promotions: boolean };
      push: { orders: boolean; promotions: boolean; priceAlerts: boolean };
    };
  }>(),
  
  // Consent
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  whatsappConsent: boolean('whatsapp_consent').notNull().default(false),
  
  // Activity
  lastLoginAt: timestamp('last_login_at'),
  loginCount: integer('login_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// User addresses table
export const userAddresses = pgTable('user_addresses', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  line1: varchar('line1', { length: 100 }).notNull(),
  line2: varchar('line2', { length: 100 }),
  city: varchar('city', { length: 50 }).notNull(),
  state: varchar('state', { length: 50 }),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  country: countryEnum('country').notNull(),
  latitude: varchar('latitude', { length: 20 }),
  longitude: varchar('longitude', { length: 20 }),
  isDefault: boolean('is_default').notNull().default(false),
  label: varchar('label', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(userAddresses),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserAddress = typeof userAddresses.$inferSelect;
export type NewUserAddress = typeof userAddresses.$inferInsert;
