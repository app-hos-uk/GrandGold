// KYC (Know Your Customer) types

import { Country, FileUpload, Timestamps } from './common';

export type KycTier = 'none' | 'tier1' | 'tier2' | 'tier3';

export type KycDocumentType =
  | 'passport'
  | 'national_id'
  | 'drivers_license'
  | 'emirates_id'
  | 'aadhaar'
  | 'pan_card'
  | 'utility_bill'
  | 'bank_statement';

export type KycVerificationStatus = 
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface KycDocument extends Timestamps {
  id: string;
  userId: string;
  type: KycDocumentType;
  file: FileUpload;
  status: KycVerificationStatus;
  
  // OCR extracted data
  extractedData?: KycExtractedData;
  
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  
  // Expiry
  expiresAt?: Date;
  
  // Country specific
  country: Country;
}

export interface KycExtractedData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  expiryDate?: string;
  nationality?: string;
  address?: string;
  confidence: number; // 0-100
  rawData?: Record<string, unknown>;
}

export interface KycVerification extends Timestamps {
  id: string;
  userId: string;
  tier: KycTier;
  status: KycVerificationStatus;
  
  // Tier 1: Email/Phone
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Tier 2: Document
  documents: KycDocument[];
  
  // Verification details
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  
  // AML/Background check
  amlCheckStatus?: 'pending' | 'passed' | 'failed';
  amlCheckResult?: Record<string, unknown>;
  
  // Country
  country: Country;
}

export interface KycSubmissionRequest {
  tier: KycTier;
  documentType?: KycDocumentType;
  documentFront?: File;
  documentBack?: File;
  selfie?: File;
}

export interface KycStatusResponse {
  userId: string;
  tier: KycTier;
  status: KycVerificationStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentsSubmitted: number;
  documentsApproved: number;
  nextSteps?: string[];
  restrictions?: KycRestriction[];
}

export interface KycRestriction {
  type: 'purchase_limit' | 'feature_disabled' | 'withdrawal_limit';
  description: string;
  limit?: number;
  currency?: string;
}

// Country-specific document requirements
export const KYC_DOCUMENT_REQUIREMENTS: Record<Country, KycDocumentType[]> = {
  IN: ['aadhaar', 'pan_card', 'passport', 'drivers_license'],
  AE: ['emirates_id', 'passport'],
  UK: ['passport', 'national_id', 'drivers_license'],
};

// Tier thresholds (in USD equivalent)
export const KYC_TIER_THRESHOLDS = {
  TIER_0_MAX: 500,    // Basic browsing, no purchase
  TIER_1_MAX: 5000,   // Email/Phone verified
  TIER_2_MAX: Infinity, // Government ID verified
};
