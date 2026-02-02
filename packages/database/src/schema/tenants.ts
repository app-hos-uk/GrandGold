import { pgTable, varchar, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, countryEnum } from './users';

// Tenant status
export const tenantStatusEnum = pgEnum('tenant_status', [
  'pending',
  'active',
  'suspended',
  'terminated',
]);

// Tenants table (for multi-tenancy)
export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  schemaName: varchar('schema_name', { length: 63 }).notNull().unique(),
  
  // Owner
  ownerId: varchar('owner_id', { length: 36 }).notNull().references(() => users.id),
  
  // Status
  status: tenantStatusEnum('status').notNull().default('pending'),
  
  // Countries
  countries: jsonb('countries').$type<string[]>().notNull().default(['IN']),
  primaryCountry: countryEnum('primary_country').notNull(),
  
  // Branding
  logo: text('logo'),
  favicon: text('favicon'),
  primaryColor: varchar('primary_color', { length: 7 }),
  secondaryColor: varchar('secondary_color', { length: 7 }),
  
  // Settings
  settings: jsonb('settings').$type<{
    domain?: string;
    customDomain?: string;
    enabledFeatures: string[];
    commissionRate: number;
    settlementFrequency: 'daily' | 'weekly' | 'monthly';
  }>(),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  suspendedAt: timestamp('suspended_at'),
  terminatedAt: timestamp('terminated_at'),
});

// Tenant members (users within a tenant)
export const tenantMemberRoleEnum = pgEnum('tenant_member_role', [
  'owner',
  'admin',
  'manager',
  'staff',
]);

export const tenantMembers = pgTable('tenant_members', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  role: tenantMemberRoleEnum('role').notNull().default('staff'),
  permissions: jsonb('permissions').$type<string[]>(),
  isActive: boolean('is_active').notNull().default(true),
  invitedBy: varchar('invited_by', { length: 36 }).references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Country admins
export const countryAdmins = pgTable('country_admins', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  country: countryEnum('country').notNull(),
  permissions: jsonb('permissions').$type<string[]>(),
  isActive: boolean('is_active').notNull().default(true),
  assignedBy: varchar('assigned_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
  }),
  members: many(tenantMembers),
}));

export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantMembers.userId],
    references: [users.id],
  }),
}));

export const countryAdminsRelations = relations(countryAdmins, ({ one }) => ({
  user: one(users, {
    fields: [countryAdmins.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantMember = typeof tenantMembers.$inferSelect;
export type NewTenantMember = typeof tenantMembers.$inferInsert;
export type CountryAdmin = typeof countryAdmins.$inferSelect;
export type NewCountryAdmin = typeof countryAdmins.$inferInsert;
