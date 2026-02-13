import { generateId, sha256 } from '@grandgold/utils';
import {
  createSession as dbCreateSession,
  findSessionById,
  findSessionByRefreshToken,
  findSessionByTokenHash,
  getUserActiveSessions,
  updateSessionActivity,
  updateSessionTokenHash,
  invalidateSession,
  invalidateAllUserSessions,
  logUserActivity,
  getUserActivities,
} from '@grandgold/database';
import type { Session, UserActivity } from '@grandgold/database';

interface CreateSessionData {
  userId: string;
  refreshToken: string;
  accessToken?: string; // Used to create a hash for token-based session matching
  deviceId?: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
}

interface UpdateSessionData {
  refreshToken?: string;
  accessToken?: string; // New access token to update the hash
  lastActiveAt?: Date;
}

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(data: CreateSessionData): Promise<Session> {
    const sessionId = generateId('sess');
    
    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store SHA-256 hash of access token for token-based session matching
    const accessTokenHash = data.accessToken ? sha256(data.accessToken) : undefined;

    const session = await dbCreateSession({
      id: sessionId,
      userId: data.userId,
      refreshToken: data.refreshToken,
      accessTokenHash: accessTokenHash ?? null,
      deviceId: data.deviceId,
      deviceName: this.parseDeviceName(data.userAgent),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
      isActive: true,
    });

    // Log activity
    await this.logActivity(data.userId, 'login', {
      sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return session;
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<Session | undefined> {
    return findSessionById(sessionId);
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | undefined> {
    return findSessionByRefreshToken(refreshToken);
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions = await getUserActiveSessions(userId);
    
    // Map to a safe format (hide full tokens)
    return sessions.map(session => ({
      ...session,
      refreshToken: '***hidden***',
    }));
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, data: UpdateSessionData): Promise<void> {
    // Update access token hash when tokens are rotated (e.g., refresh)
    if (data.accessToken) {
      const newHash = sha256(data.accessToken);
      await updateSessionTokenHash(sessionId, newHash);
    } else if (data.lastActiveAt) {
      await updateSessionActivity(sessionId);
    }
  }

  /**
   * Find the current session by matching the access token hash
   */
  async findByAccessToken(userId: string, accessToken: string): Promise<Session | undefined> {
    const tokenHash = sha256(accessToken);
    return findSessionByTokenHash(userId, tokenHash);
  }

  /**
   * Invalidate a session by ID
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await findSessionById(sessionId);
    
    // Verify session belongs to user
    if (!session || session.userId !== userId) {
      throw new Error('Session not found');
    }

    await invalidateSession(sessionId);

    await this.logActivity(userId, 'session_revoked', { sessionId });
  }

  /**
   * Invalidate session by access token (hash-based matching)
   */
  async invalidateByToken(userId: string, token: string): Promise<void> {
    const tokenHash = sha256(token);
    const session = await findSessionByTokenHash(userId, tokenHash);

    if (session) {
      await invalidateSession(session.id);
      await this.logActivity(userId, 'logout', { sessionId: session.id });
    } else {
      // Fallback: if no session matches the hash (e.g., legacy sessions without hash),
      // log the logout but don't blindly revoke all sessions
      await this.logActivity(userId, 'logout', { note: 'no-matching-session' });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAll(userId: string): Promise<void> {
    await invalidateAllUserSessions(userId);
    await this.logActivity(userId, 'logout_all', {});
  }

  /**
   * Revoke all sessions except the current one (identified by access token hash)
   */
  async revokeAllExceptCurrent(userId: string, currentAccessToken: string): Promise<void> {
    const currentTokenHash = sha256(currentAccessToken);
    const allSessions = await getUserActiveSessions(userId);
    
    for (const session of allSessions) {
      // Skip current session using token hash matching
      if (session.accessTokenHash !== currentTokenHash) {
        await invalidateSession(session.id);
      }
    }

    await this.logActivity(userId, 'revoke_other_sessions', {});
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await logUserActivity({
      id: generateId('act'),
      userId,
      action,
      resource: 'auth',
      ipAddress: (metadata.ipAddress as string) || undefined,
      userAgent: (metadata.userAgent as string) || undefined,
      metadata,
    });
  }

  /**
   * Get user activity log
   */
  async getActivityLog(userId: string, limit: number = 20): Promise<UserActivity[]> {
    return getUserActivities(userId, limit);
  }

  /**
   * Parse device name from user agent
   */
  private parseDeviceName(userAgent: string): string {
    // Simple parsing - in production, use a proper UA parser library
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown Device';
  }
}
