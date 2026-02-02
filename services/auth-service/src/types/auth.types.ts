import type { Country, UserRole } from '@grandgold/types';

/**
 * User entity from database
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: Country;
  role: UserRole;
  kycTier: 'none' | 'tier1' | 'tier2' | 'tier3';
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * Authenticated user response (excludes sensitive data)
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: Country;
  role: UserRole;
  kycTier: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
}

/**
 * Login context
 */
export interface LoginContext {
  ip: string;
  userAgent: string;
  country?: Country;
}

/**
 * Token pair response
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Auth response with user
 */
export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: TokenPair;
}

/**
 * Address entity
 */
export interface Address {
  id: string;
  userId: string;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: Country;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuth profile from providers
 */
export interface OAuthProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  picture?: string;
  provider: 'google' | 'facebook' | 'apple';
}

/**
 * Session entity
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  ip: string;
  userAgent: string;
  country?: Country;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * User preferences
 */
export interface UserPreferences {
  userId: string;
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  marketing: boolean;
}

/**
 * Register input
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: Country;
  acceptedTerms: boolean;
  marketingConsent?: boolean;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
}

/**
 * Update profile input
 */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
