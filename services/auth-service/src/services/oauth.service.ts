import { generateId, generateTokenPair } from '@grandgold/utils';
import {
  findUserByEmail,
  findUserByOAuthId,
  createUser,
  updateUser,
  createOAuthAccount,
  findOAuthAccount,
} from '@grandgold/database';
import type { TokenPair, Country } from '@grandgold/types';
import { SessionService } from './session.service';

interface GoogleAuthData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

interface FacebookAuthData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

interface AppleAuthData {
  idToken: string;
  code: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface LoginContext {
  ipAddress: string;
  userAgent: string;
}

export class OAuthService {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Handle Google OAuth authentication
   */
  async handleGoogleAuth(data: GoogleAuthData): Promise<any> {
    // Check if user exists by Google ID
    let user = await findUserByOAuthId('google', data.id);

    if (user) {
      // Update user's Google token
      await updateUser(user.id, { googleId: data.id });
      return user;
    }

    // Check if user exists by email
    user = await findUserByEmail(data.email);

    if (user) {
      // Link Google account to existing user
      await updateUser(user.id, { googleId: data.id });
      
      // Create OAuth account record
      await createOAuthAccount({
        id: generateId('oauth'),
        userId: user.id,
        provider: 'google',
        providerAccountId: data.id,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      return user;
    }

    // Create new user
    const userId = generateId('usr');
    user = await createUser({
      id: userId,
      email: data.email.toLowerCase(),
      firstName: data.firstName || 'User',
      lastName: data.lastName || '',
      avatar: data.avatar,
      googleId: data.id,
      role: 'customer',
      country: 'IN', // Default country, will be updated based on context
      emailVerified: true, // Google accounts are pre-verified
      preferences: this.getDefaultPreferences('IN'),
    });

    // Create OAuth account record
    await createOAuthAccount({
      id: generateId('oauth'),
      userId: user.id,
      provider: 'google',
      providerAccountId: data.id,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return user;
  }

  /**
   * Handle Facebook OAuth authentication
   */
  async handleFacebookAuth(data: FacebookAuthData): Promise<any> {
    // Check if user exists by Facebook ID
    let user = await findUserByOAuthId('facebook', data.id);

    if (user) {
      return user;
    }

    // Check if user exists by email
    if (data.email) {
      user = await findUserByEmail(data.email);

      if (user) {
        // Link Facebook account to existing user
        await updateUser(user.id, { facebookId: data.id });
        
        await createOAuthAccount({
          id: generateId('oauth'),
          userId: user.id,
          provider: 'facebook',
          providerAccountId: data.id,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        return user;
      }
    }

    // Create new user
    const userId = generateId('usr');
    user = await createUser({
      id: userId,
      email: data.email?.toLowerCase() || `fb_${data.id}@placeholder.grandgold.com`,
      firstName: data.firstName || 'User',
      lastName: data.lastName || '',
      avatar: data.avatar,
      facebookId: data.id,
      role: 'customer',
      country: 'IN',
      emailVerified: !!data.email,
      preferences: this.getDefaultPreferences('IN'),
    });

    await createOAuthAccount({
      id: generateId('oauth'),
      userId: user.id,
      provider: 'facebook',
      providerAccountId: data.id,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return user;
  }

  /**
   * Handle Apple Sign In authentication
   */
  async handleAppleAuth(data: AppleAuthData): Promise<any> {
    // Decode and verify Apple ID token
    // This would require jwt verification with Apple's public keys
    // For now, we'll use a simplified version
    
    const appleId = this.extractAppleIdFromToken(data.idToken);
    
    // Check if user exists by Apple ID
    let user = await findUserByOAuthId('apple', appleId);

    if (user) {
      return user;
    }

    // Check if user exists by email
    if (data.email) {
      user = await findUserByEmail(data.email);

      if (user) {
        // Link Apple account to existing user
        await updateUser(user.id, { appleId });
        
        await createOAuthAccount({
          id: generateId('oauth'),
          userId: user.id,
          provider: 'apple',
          providerAccountId: appleId,
        });

        return user;
      }
    }

    // Create new user
    const userId = generateId('usr');
    user = await createUser({
      id: userId,
      email: data.email?.toLowerCase() || `apple_${appleId}@placeholder.grandgold.com`,
      firstName: data.firstName || 'Apple',
      lastName: data.lastName || 'User',
      appleId,
      role: 'customer',
      country: 'IN',
      emailVerified: true, // Apple accounts are pre-verified
      preferences: this.getDefaultPreferences('IN'),
    });

    await createOAuthAccount({
      id: generateId('oauth'),
      userId: user.id,
      provider: 'apple',
      providerAccountId: appleId,
    });

    return user;
  }

  /**
   * Generate tokens for authenticated OAuth user
   */
  async generateTokensForUser(
    user: any,
    context: LoginContext
  ): Promise<{ tokens: TokenPair }> {
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
      country: user.country,
      permissions: this.getUserPermissions(user.role),
    });

    // Create session
    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { tokens };
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccount(
    userId: string,
    provider: 'google' | 'facebook' | 'apple',
    providerAccountId: string,
    tokens?: { accessToken?: string; refreshToken?: string }
  ): Promise<void> {
    // Check if this OAuth account is already linked
    const existingAccount = await findOAuthAccount(provider, providerAccountId);
    if (existingAccount) {
      if (existingAccount.userId !== userId) {
        throw new Error('This account is already linked to another user');
      }
      return; // Already linked
    }

    // Update user with provider ID
    const updateData: Record<string, string> = {};
    if (provider === 'google') updateData.googleId = providerAccountId;
    if (provider === 'facebook') updateData.facebookId = providerAccountId;
    if (provider === 'apple') updateData.appleId = providerAccountId;
    
    await updateUser(userId, updateData);

    // Create OAuth account record
    await createOAuthAccount({
      id: generateId('oauth'),
      userId,
      provider,
      providerAccountId,
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
    });
  }

  private extractAppleIdFromToken(idToken: string): string {
    // In production, this should properly decode and verify the JWT
    // For now, just extract the 'sub' claim
    try {
      const payload = idToken.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      return decoded.sub;
    } catch {
      throw new Error('Invalid Apple ID token');
    }
  }

  private getUserPermissions(role: string): string[] {
    const permissionsByRole: Record<string, string[]> = {
      super_admin: ['*'],
      country_admin: ['users:read', 'users:write', 'orders:*', 'products:*', 'sellers:*'],
      seller: ['products:own', 'orders:own', 'inventory:own'],
      customer: ['orders:own', 'profile:own'],
    };

    return permissionsByRole[role] || [];
  }

  private getDefaultPreferences(country: Country) {
    return {
      language: 'en',
      currency: country === 'IN' ? 'INR' : country === 'AE' ? 'AED' : 'GBP',
      timezone: country === 'IN' ? 'Asia/Kolkata' : country === 'AE' ? 'Asia/Dubai' : 'Europe/London',
      theme: 'system' as const,
      notifications: {
        email: { orders: true, promotions: false, priceAlerts: true, newsletter: false },
        whatsapp: { orders: false, promotions: false },
        push: { orders: true, promotions: false, priceAlerts: true },
      },
    };
  }
}
