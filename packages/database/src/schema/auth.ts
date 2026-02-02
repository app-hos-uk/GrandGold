import { pgTable, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Session table for tracking active sessions
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  refreshToken: text('refresh_token').notNull(),
  deviceId: varchar('device_id', { length: 100 }),
  deviceName: varchar('device_name', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  lastActiveAt: timestamp('last_active_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Verification tokens (email, password reset, etc.)
export const verificationTokenTypeEnum = pgEnum('verification_token_type', [
  'email_verification',
  'password_reset',
  'phone_verification',
  'mfa_setup',
]);

export const verificationTokens = pgTable('verification_tokens', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  token: varchar('token', { length: 100 }).notNull().unique(),
  type: verificationTokenTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// OAuth accounts
export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'facebook', 'apple']);

export const oauthAccounts = pgTable('oauth_accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  provider: oauthProviderEnum('provider').notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// OTP codes for phone/MFA verification
export const otpCodes = pgTable('otp_codes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  code: varchar('code', { length: 6 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(), // 'login', 'registration', 'password_reset'
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User activity log
export const userActivities = pgTable('user_activities', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: varchar('resource_id', { length: 36 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Import missing types
import { integer, jsonb } from 'drizzle-orm/pg-core';

// Relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
export type UserActivity = typeof userActivities.$inferSelect;
export type NewUserActivity = typeof userActivities.$inferInsert;
