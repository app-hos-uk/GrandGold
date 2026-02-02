// Authentication types

import { Country } from './common';
import { UserRole } from './user';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  tenantId?: string;
  country: Country;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  country?: Country;
  deviceId?: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: TokenPair;
  requiresMfa: boolean;
  mfaToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: Country;
  acceptedTerms: boolean;
  marketingConsent?: boolean;
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface OAuthProvider {
  provider: 'google' | 'facebook' | 'apple';
  accessToken: string;
  idToken?: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: 'google' | 'facebook' | 'apple';
  providerAccountId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  country: Country;
  tenantId?: string;
  permissions: string[];
  mfaEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: KycStatus;
}

export type KycStatus = 'none' | 'pending' | 'tier1' | 'tier2' | 'rejected' | 'verified' | 'not_started';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}
