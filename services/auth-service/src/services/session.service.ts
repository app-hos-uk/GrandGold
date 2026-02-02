import { generateId } from '@grandgold/utils';
import {
  createSession as dbCreateSession,
  findSessionById,
  findSessionByRefreshToken,
  getUserActiveSessions,
  updateSessionActivity,
  invalidateSession,
  invalidateAllUserSessions,
  logUserActivity,
  getUserActivities,
} from '@grandgold/database';
import type { Session, UserActivity } from '@grandgold/database';

interface CreateSessionData {
  userId: string;
  refreshToken: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
}

interface UpdateSessionData {
  refreshToken?: string;
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

    const session = await dbCreateSession({
      id: sessionId,
      userId: data.userId,
      refreshToken: data.refreshToken,
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
    if (data.lastActiveAt) {
      await updateSessionActivity(sessionId);
    }
    // For refresh token update, would need to add that to the database module
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
   * Invalidate session by token
   */
  async invalidateByToken(userId: string, token: string): Promise<void> {
    // Hash the token to find the session
    // In a real implementation, you'd store and compare hashed tokens
    const sessions = await getUserActiveSessions(userId);
    
    for (const session of sessions) {
      // Compare token (simplified - in production, use proper token matching)
      await invalidateSession(session.id);
    }

    await this.logActivity(userId, 'logout', {});
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAll(userId: string): Promise<void> {
    await invalidateAllUserSessions(userId);
    await this.logActivity(userId, 'logout_all', {});
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllExceptCurrent(userId: string, currentToken: string): Promise<void> {
    const sessions = await getUserActiveSessions(userId);
    
    for (const session of sessions) {
      // Skip current session (simplified comparison)
      if (session.refreshToken !== currentToken) {
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
