// User types

import { Address, Country, Timestamps, SoftDelete } from './common';
import { KycStatus } from './auth';

export type UserRole =
  | 'super_admin'
  | 'country_admin'
  | 'manager'
  | 'staff'
  | 'seller'
  | 'influencer'
  | 'consultant'
  | 'customer';

export interface User extends Timestamps, SoftDelete {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  country: Country;
  tenantId?: string;
  
  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  
  // MFA
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  
  // KYC
  kycStatus: KycStatus;
  kycTier: 0 | 1 | 2;
  kycVerifiedAt?: Date;
  
  // OAuth
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  
  // Preferences
  preferences: UserPreferences;
  
  // Addresses
  addresses: Address[];
  
  // Consent
  marketingConsent: boolean;
  whatsappConsent: boolean;
  
  // Metadata
  lastLoginAt?: Date;
  loginCount: number;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationPreferences {
  email: {
    orders: boolean;
    promotions: boolean;
    priceAlerts: boolean;
    newsletter: boolean;
  };
  whatsapp: {
    orders: boolean;
    promotions: boolean;
  };
  push: {
    orders: boolean;
    promotions: boolean;
    priceAlerts: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  country: Country;
  kycStatus: KycStatus;
  kycTier: 0 | 1 | 2;
  preferences: UserPreferences;
  addresses: Address[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// GDPR compliance
export interface UserDataExport {
  user: Omit<User, 'passwordHash' | 'mfaSecret' | 'mfaBackupCodes'>;
  orders: unknown[];
  reviews: unknown[];
  wishlist: unknown[];
  activities: UserActivity[];
  exportedAt: Date;
}
