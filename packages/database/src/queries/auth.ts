import { eq, and, lt, desc, sql, isNull, or } from 'drizzle-orm';
import { db } from '../client';
import {
  sessions,
  verificationTokens,
  oauthAccounts,
  otpCodes,
  userActivities,
  roles,
  type Session,
  type NewSession,
  type VerificationToken,
  type NewVerificationToken,
  type OAuthAccount,
  type NewOAuthAccount,
  type OtpCode,
  type NewOtpCode,
  type UserActivity,
  type NewUserActivity,
  type Role,
  type NewRole,
} from '../schema/auth';

// Session queries
export async function createSession(data: NewSession): Promise<Session> {
  const result = await db.insert(sessions).values(data).returning();
  return result[0];
}

export async function findSessionById(id: string): Promise<Session | undefined> {
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result[0];
}

export async function findSessionByRefreshToken(refreshToken: string): Promise<Session | undefined> {
  const result = await db.select()
    .from(sessions)
    .where(and(eq(sessions.refreshToken, refreshToken), eq(sessions.isActive, true)))
    .limit(1);
  return result[0];
}

export async function getUserActiveSessions(userId: string): Promise<Session[]> {
  return db.select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)))
    .orderBy(desc(sessions.lastActiveAt));
}

export async function updateSessionActivity(id: string): Promise<void> {
  await db.update(sessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessions.id, id));
}

export async function invalidateSession(id: string): Promise<void> {
  await db.update(sessions)
    .set({ isActive: false })
    .where(eq(sessions.id, id));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.update(sessions)
    .set({ isActive: false })
    .where(eq(sessions.userId, userId));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// Verification token queries
export async function createVerificationToken(data: NewVerificationToken): Promise<VerificationToken> {
  const result = await db.insert(verificationTokens).values(data).returning();
  return result[0];
}

export async function findVerificationToken(token: string): Promise<VerificationToken | undefined> {
  const result = await db.select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1);
  return result[0];
}

export async function useVerificationToken(id: string): Promise<void> {
  await db.update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(verificationTokens.id, id));
}

export async function deleteExpiredVerificationTokens(): Promise<void> {
  await db.delete(verificationTokens).where(lt(verificationTokens.expiresAt, new Date()));
}

// OAuth account queries
export async function createOAuthAccount(data: NewOAuthAccount): Promise<OAuthAccount> {
  const result = await db.insert(oauthAccounts).values(data).returning();
  return result[0];
}

export async function findOAuthAccount(
  provider: 'google' | 'facebook' | 'apple',
  providerAccountId: string
): Promise<OAuthAccount | undefined> {
  const result = await db.select()
    .from(oauthAccounts)
    .where(and(
      eq(oauthAccounts.provider, provider),
      eq(oauthAccounts.providerAccountId, providerAccountId)
    ))
    .limit(1);
  return result[0];
}

export async function getUserOAuthAccounts(userId: string): Promise<OAuthAccount[]> {
  return db.select().from(oauthAccounts).where(eq(oauthAccounts.userId, userId));
}

export async function updateOAuthTokens(
  id: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<void> {
  await db.update(oauthAccounts)
    .set({
      accessToken,
      refreshToken,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(oauthAccounts.id, id));
}

// OTP queries
export async function createOtpCode(data: NewOtpCode): Promise<OtpCode> {
  const result = await db.insert(otpCodes).values(data).returning();
  return result[0];
}

export async function findLatestOtpCode(
  identifier: { phone?: string; email?: string; userId?: string },
  purpose: string
): Promise<OtpCode | undefined> {
  let condition = eq(otpCodes.purpose, purpose);
  
  if (identifier.phone) {
    condition = and(condition, eq(otpCodes.phone, identifier.phone))!;
  } else if (identifier.email) {
    condition = and(condition, eq(otpCodes.email, identifier.email.toLowerCase()))!;
  } else if (identifier.userId) {
    condition = and(condition, eq(otpCodes.userId, identifier.userId))!;
  }
  
  const result = await db.select()
    .from(otpCodes)
    .where(condition)
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  
  return result[0];
}

export async function incrementOtpAttempts(id: string): Promise<number> {
  const result = await db.update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(eq(otpCodes.id, id))
    .returning({ attempts: otpCodes.attempts });
  
  return result[0]?.attempts || 0;
}

export async function verifyOtpCode(id: string): Promise<void> {
  await db.update(otpCodes)
    .set({ verifiedAt: new Date() })
    .where(eq(otpCodes.id, id));
}

export async function cleanupExpiredOtpCodes(): Promise<void> {
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, new Date()));
}

// Activity log queries
export async function logUserActivity(data: NewUserActivity): Promise<UserActivity> {
  const result = await db.insert(userActivities).values(data).returning();
  return result[0];
}

export async function getUserActivities(
  userId: string,
  limit: number = 50
): Promise<UserActivity[]> {
  return db.select()
    .from(userActivities)
    .where(eq(userActivities.userId, userId))
    .orderBy(desc(userActivities.createdAt))
    .limit(limit);
}

// Role queries
export async function listRoles(options?: { country?: string }): Promise<Role[]> {
  if (options?.country) {
    // Return global roles + country-specific roles
    return db.select()
      .from(roles)
      .where(or(
        eq(roles.scope, 'global'),
        and(eq(roles.scope, 'country'), eq(roles.country, options.country))
      ))
      .orderBy(desc(roles.isSystem), roles.name);
  }
  return db.select().from(roles).orderBy(desc(roles.isSystem), roles.name);
}

export async function findRoleById(id: string): Promise<Role | undefined> {
  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return result[0];
}

export async function createRole(data: NewRole): Promise<Role> {
  const result = await db.insert(roles).values(data).returning();
  return result[0];
}

export async function updateRole(
  id: string,
  data: Partial<Omit<Role, 'id' | 'createdAt' | 'isSystem'>>
): Promise<Role | undefined> {
  const result = await db.update(roles)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(roles.id, id), eq(roles.isSystem, false)))
    .returning();
  return result[0];
}

export async function deleteRole(id: string): Promise<boolean> {
  const result = await db.delete(roles)
    .where(and(eq(roles.id, id), eq(roles.isSystem, false)))
    .returning({ id: roles.id });
  return result.length > 0;
}

export async function updateRoleUserCount(roleId: string, delta: number): Promise<void> {
  await db.update(roles)
    .set({ userCount: sql`GREATEST(0, ${roles.userCount} + ${delta})` })
    .where(eq(roles.id, roleId));
}
