import { eq, and, or, desc, sql, ilike, inArray } from 'drizzle-orm';
import { db } from '../client';
import { users, userAddresses, type User, type NewUser, type UserAddress, type NewUserAddress } from '../schema/users';

// User queries
export async function findUserById(id: string, includeDeleted = false): Promise<User | undefined> {
  const conditions = [eq(users.id, id)];
  if (!includeDeleted) {
    conditions.push(eq(users.isDeleted, false));
  }
  const result = await db.select().from(users).where(and(...conditions)).limit(1);
  return result[0];
}

export async function findUserByEmail(email: string, includeDeleted = false): Promise<User | undefined> {
  const conditions = [eq(users.email, email.toLowerCase())];
  if (!includeDeleted) {
    conditions.push(eq(users.isDeleted, false));
  }
  const result = await db.select().from(users).where(and(...conditions)).limit(1);
  return result[0];
}

export async function findUserByPhone(phone: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function findUserByOAuthId(
  provider: 'google' | 'facebook' | 'apple',
  providerId: string
): Promise<User | undefined> {
  let condition;
  switch (provider) {
    case 'google':
      condition = eq(users.googleId, providerId);
      break;
    case 'facebook':
      condition = eq(users.facebookId, providerId);
      break;
    case 'apple':
      condition = eq(users.appleId, providerId);
      break;
  }
  
  const result = await db.select().from(users).where(condition).limit(1);
  return result[0];
}

export async function createUser(data: NewUser): Promise<User> {
  const result = await db.insert(users).values({
    ...data,
    email: data.email.toLowerCase(),
  }).returning();
  return result[0];
}

export async function updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
  const result = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function updateUserLastLogin(id: string): Promise<void> {
  await db.update(users)
    .set({
      lastLoginAt: new Date(),
      loginCount: sql`${users.loginCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  await db.update(users)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function verifyEmail(id: string): Promise<void> {
  await db.update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function verifyPhone(id: string): Promise<void> {
  await db.update(users)
    .set({
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function enableMfa(id: string, secret: string, backupCodes: string[]): Promise<void> {
  await db.update(users)
    .set({
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function disableMfa(id: string): Promise<void> {
  await db.update(users)
    .set({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function updateKycStatus(
  id: string,
  status: 'none' | 'pending' | 'tier1' | 'tier2' | 'rejected',
  tier: 0 | 1 | 2
): Promise<void> {
  await db.update(users)
    .set({
      kycStatus: status,
      kycTier: tier,
      kycVerifiedAt: status === 'tier1' || status === 'tier2' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

// Address queries
export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  return db.select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault));
}

export async function createUserAddress(data: NewUserAddress): Promise<UserAddress> {
  // If this is the default address, unset other defaults
  if (data.isDefault) {
    await db.update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(userAddresses.userId, data.userId));
  }
  
  const result = await db.insert(userAddresses).values(data).returning();
  return result[0];
}

export async function updateUserAddress(
  id: string,
  userId: string,
  data: Partial<NewUserAddress>
): Promise<UserAddress | undefined> {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db.update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)));
  }
  
  const result = await db.update(userAddresses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteUserAddress(id: string, userId: string): Promise<void> {
  await db.delete(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
}

export interface ListUsersOptions {
  page?: number;
  limit?: number;
  country?: string;
  role?: string;
  search?: string;
  /** When set, return only users with these IDs (ignores page/limit for count). */
  ids?: string[];
}

export async function listUsers(options: ListUsersOptions = {}): Promise<{ users: User[]; total: number }> {
  const { page = 1, limit = 20, country, role, search, ids } = options;
  const conditions = [eq(users.isDeleted, false)];

  if (ids !== undefined && ids.length > 0) {
    conditions.push(inArray(users.id, ids));
  }
  if (country) conditions.push(eq(users.country, country as 'IN' | 'AE' | 'UK'));
  if (role) conditions.push(eq(users.role, role as any));
  if (search) {
    const term = `%${search}%`;
    conditions.push(or(ilike(users.email, term), ilike(users.firstName, term), ilike(users.lastName, term))!);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [usersList, countResult] = await Promise.all([
    db.select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  return { users: usersList, total };
}
