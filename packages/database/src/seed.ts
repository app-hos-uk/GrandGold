/**
 * Seed Super Admin user.
 * 
 * Run: pnpm --filter @grandgold/database db:seed
 * Or from repo root: DATABASE_URL=... pnpm exec tsx packages/database/src/seed.ts
 *
 * Super Admin: mail@jsabu.com / Admin@1234
 * 
 * NOTE: The Super Admin is a GLOBAL role with access to ALL countries (IN, AE, UK).
 * The 'country' field below is only a default/home preference (required by DB schema)
 * but does NOT restrict access. Super Admin can:
 *   - View and manage data across all countries
 *   - Create and assign Country Admins for specific countries
 *   - Access all admin features without geographic limits
 */

import { hashPassword, generateId } from '@grandgold/utils';
import { createUser, findUserByEmail } from './queries/users';
import { closeDatabaseConnection } from './client';

const SUPER_ADMIN_EMAIL = 'mail@jsabu.com';
const SUPER_ADMIN_PASSWORD = 'Admin@1234';
const SUPER_ADMIN_FIRST_NAME = 'Sabuj';
const SUPER_ADMIN_LAST_NAME = 'Anchuparayil';

async function seedSuperAdmin(): Promise<void> {
  const existing = await findUserByEmail(SUPER_ADMIN_EMAIL);
  if (existing) {
    console.log(`Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
    await closeDatabaseConnection();
    process.exit(0);
    return;
  }

  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);
  const userId = generateId('usr');

  // 'country' is required by DB schema but Super Admin has GLOBAL access (not restricted to this country)
  await createUser({
    id: userId,
    email: SUPER_ADMIN_EMAIL,
    passwordHash,
    firstName: SUPER_ADMIN_FIRST_NAME,
    lastName: SUPER_ADMIN_LAST_NAME,
    country: 'IN', // Default preference only; Super Admin sees all countries
    role: 'super_admin',
    emailVerified: true,
    preferences: {
      language: 'en',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      theme: 'system',
      notifications: {
        email: { orders: true, promotions: false, priceAlerts: true, newsletter: false },
        whatsapp: { orders: false, promotions: false },
        push: { orders: true, promotions: false, priceAlerts: true },
      },
    },
  });

  console.log('Super Admin created successfully.');
  console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log('  Role: super_admin (GLOBAL access to all countries)');
  await closeDatabaseConnection();
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
