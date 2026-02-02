import {
  hashPassword,
  comparePassword,
  generateId,
  generateToken,
  generateTokenPair,
  verifyToken,
  generateOtp,
  verifyTotpToken,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@grandgold/utils';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  updateUserLastLogin,
  verifyEmail as verifyUserEmail,
  verifyPhone as verifyUserPhone,
} from '@grandgold/database';
import type { RegisterRequest, LoginRequest, MfaVerifyRequest, LoginResponse, TokenPair, JwtPayload, Country } from '@grandgold/types';
import { SessionService } from './session.service';
import { RedisService } from './redis.service';

interface LoginContext {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
}

export class AuthService {
  private sessionService: SessionService;
  private redisService: RedisService;

  constructor() {
    this.sessionService = new SessionService();
    this.redisService = new RedisService();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<{ userId: string; email: string }> {
    // Check if user already exists
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = generateId('usr');
    const user = await createUser({
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      country: data.country,
      role: 'customer',
      marketingConsent: data.marketingConsent || false,
      preferences: {
        language: 'en',
        currency: data.country === 'IN' ? 'INR' : data.country === 'AE' ? 'AED' : 'GBP',
        timezone: data.country === 'IN' ? 'Asia/Kolkata' : data.country === 'AE' ? 'Asia/Dubai' : 'Europe/London',
        theme: 'system',
        notifications: {
          email: { orders: true, promotions: data.marketingConsent || false, priceAlerts: true, newsletter: data.marketingConsent || false },
          whatsapp: { orders: false, promotions: false },
          push: { orders: true, promotions: false, priceAlerts: true },
        },
      },
    });

    // Send verification email (async, don't wait)
    this.sendVerificationEmail(user.id, user.email).catch(console.error);

    return {
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest, context: LoginContext): Promise<LoginResponse> {
    // Find user
    const user = await findUserByEmail(data.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is deleted
    if (user.isDeleted) {
      throw new AuthenticationError('This account has been deleted');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new AuthenticationError('Please use social login for this account');
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Generate MFA session token
      const mfaToken = generateToken(32);
      
      // Store MFA session in Redis (5 minutes)
      await this.redisService.set(`mfa:${mfaToken}`, JSON.stringify({
        userId: user.id,
        ...context,
      }), 300);

      return {
        user: this.mapUserToAuthenticatedUser(user),
        tokens: { accessToken: '', refreshToken: '', expiresIn: 0 },
        requiresMfa: true,
        mfaToken,
      };
    }

    // Generate tokens and create session
    const tokens = await this.createSessionAndTokens(user, context);

    // Update last login
    await updateUserLastLogin(user.id);

    return {
      user: this.mapUserToAuthenticatedUser(user),
      tokens,
      requiresMfa: false,
    };
  }

  /**
   * Verify MFA code to complete login
   */
  async verifyMfaLogin(data: MfaVerifyRequest, context: LoginContext): Promise<LoginResponse> {
    // Get MFA session
    const sessionData = await this.redisService.get(`mfa:${data.mfaToken}`);
    if (!sessionData) {
      throw new AuthenticationError('MFA session expired. Please login again.');
    }

    const { userId } = JSON.parse(sessionData);

    // Find user
    const user = await findUserById(userId);
    if (!user || !user.mfaSecret) {
      throw new AuthenticationError('User not found');
    }

    // Verify TOTP code
    const isValid = verifyTotpToken({
      secret: user.mfaSecret,
      token: data.code,
    });

    if (!isValid) {
      throw new AuthenticationError('Invalid MFA code');
    }

    // Delete MFA session
    await this.redisService.delete(`mfa:${data.mfaToken}`);

    // Generate tokens and create session
    const tokens = await this.createSessionAndTokens(user, context);

    // Update last login
    await updateUserLastLogin(user.id);

    return {
      user: this.mapUserToAuthenticatedUser(user),
      tokens,
      requiresMfa: false,
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string): Promise<{ tokens: TokenPair }> {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = verifyToken<JwtPayload>(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if session exists
    const session = await this.sessionService.findByRefreshToken(refreshToken);
    if (!session || !session.isActive) {
      throw new AuthenticationError('Session expired. Please login again.');
    }

    // Get user
    const user = await findUserById(payload.sub);
    if (!user || user.isDeleted) {
      throw new AuthenticationError('User not found');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
      country: user.country,
      permissions: this.getUserPermissions(user.role),
    });

    // Update session
    await this.sessionService.updateSession(session.id, {
      refreshToken: tokens.refreshToken,
      lastActiveAt: new Date(),
    });

    return { tokens };
  }

  /**
   * Logout
   */
  async logout(userId: string, token: string): Promise<void> {
    // Invalidate the current session
    await this.sessionService.invalidateByToken(userId, token);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.invalidateAll(userId);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = generateToken(32);
    
    // Store in Redis (1 hour)
    await this.redisService.set(`password_reset:${resetToken}`, user.id, 3600);

    // Send email (async)
    this.sendPasswordResetEmail(user.email, resetToken).catch(console.error);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    // Get user ID from token
    const userId = await this.redisService.get(`password_reset:${token}`);
    if (!userId) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await updateUser(userId, { passwordHash });

    // Delete token
    await this.redisService.delete(`password_reset:${token}`);

    // Invalidate all sessions
    await this.sessionService.invalidateAll(userId);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redisService.get(`email_verify:${token}`);
    if (!userId) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await verifyUserEmail(userId);
    await this.redisService.delete(`email_verify:${token}`);
  }

  /**
   * Send phone verification OTP
   */
  async sendPhoneVerificationOtp(userId: string, phone: string): Promise<void> {
    const otp = generateOtp(6);
    
    // Store OTP in Redis (10 minutes)
    await this.redisService.set(`phone_otp:${userId}`, JSON.stringify({ phone, otp }), 600);

    // Send SMS (async)
    this.sendSms(phone, `Your GrandGold verification code is: ${otp}`).catch(console.error);
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(userId: string, otp: string): Promise<void> {
    const data = await this.redisService.get(`phone_otp:${userId}`);
    if (!data) {
      throw new ValidationError('OTP expired. Please request a new one.');
    }

    const { phone, otp: storedOtp } = JSON.parse(data);
    if (otp !== storedOtp) {
      throw new ValidationError('Invalid OTP');
    }

    // Update user phone and verify
    await updateUser(userId, { phone });
    await verifyUserPhone(userId);
    await this.redisService.delete(`phone_otp:${userId}`);
  }

  // Private helper methods

  private async createSessionAndTokens(user: { id: string; email: string; role: string; tenantId?: string; country: Country }, context: LoginContext): Promise<TokenPair> {
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
      country: user.country,
      permissions: this.getUserPermissions(user.role),
    });

    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      deviceId: context.deviceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return tokens;
  }

  private mapUserToAuthenticatedUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
    role: string;
    country: Country;
    tenantId?: string;
    mfaEnabled: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    kycStatus?: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      country: user.country,
      tenantId: user.tenantId,
      permissions: this.getUserPermissions(user.role),
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycStatus: user.kycStatus,
    };
  }

  private getUserPermissions(role: string): string[] {
    const permissionsByRole: Record<string, string[]> = {
      super_admin: ['*'],
      country_admin: ['users:read', 'users:write', 'orders:*', 'products:*', 'sellers:*'],
      manager: ['orders:read', 'orders:write', 'products:read', 'products:write', 'users:read'],
      staff: ['orders:read', 'orders:write', 'products:read'],
      seller: ['products:own', 'orders:own', 'inventory:own'],
      influencer: ['storefront:own', 'analytics:own'],
      consultant: ['consultations:own'],
      customer: ['orders:own', 'profile:own'],
    };

    return permissionsByRole[role] || [];
  }

  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const token = generateToken(32);
    await this.redisService.set(`email_verify:${token}`, userId, 86400); // 24 hours
    
    // TODO: Integrate with Resend API
    console.log(`Verification email sent to ${email} with token: ${token}`);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // TODO: Integrate with Resend API
    console.log(`Password reset email sent to ${email} with token: ${token}`);
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    // TODO: Integrate with Twilio
    console.log(`SMS sent to ${phone}: ${message}`);
  }
}
