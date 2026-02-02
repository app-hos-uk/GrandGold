import type { Country, KycStatus, KycTier } from '@grandgold/types';

/**
 * Tier 1 KYC Data - Basic verification
 */
export interface Tier1Data {
  email: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
}

/**
 * Tier 2 KYC Data - Enhanced verification
 */
export interface Tier2Data {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: DocumentType;
  documentNumber: string;
  address: KycAddress;
}

/**
 * Address for KYC verification
 */
export interface KycAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: Country;
}

/**
 * Document types supported for KYC
 */
export type DocumentType = 
  | 'passport'
  | 'national_id'
  | 'driving_license'
  | 'residence_permit'
  | 'voter_id'
  | 'aadhaar' // India-specific
  | 'pan_card' // India-specific
  | 'emirates_id'; // UAE-specific

/**
 * Document upload structure
 */
export interface DocumentUpload {
  documentFront?: Express.Multer.File;
  documentBack?: Express.Multer.File;
  selfie?: Express.Multer.File;
  addressProof?: Express.Multer.File;
}

/**
 * Stored document information
 */
export interface StoredDocument {
  id: string;
  filename: string;
  url: string;
  uploadedAt: Date;
}

/**
 * KYC Tier data with verification status
 */
export interface TierVerification<T> {
  data: T;
  verified: boolean;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

/**
 * Full KYC Record stored in database
 */
export interface KycRecord {
  id: string;
  userId: string;
  tier: KycTier;
  status: KycStatus;
  tier1?: TierVerification<Tier1Data>;
  tier2?: TierVerification<Tier2Data>;
  documents?: {
    documentFront?: StoredDocument;
    documentBack?: StoredDocument;
    selfie?: StoredDocument;
    addressProof?: StoredDocument;
  };
  documentExtraction?: DocumentExtractionResult;
  amlCheck?: AmlCheckResult;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

/**
 * Document AI extraction result
 */
export interface DocumentExtractionResult {
  success: boolean;
  extractedData?: ExtractedIdData;
  confidence: number;
  processedAt: Date;
  errors?: string[];
}

/**
 * Extracted data from ID document
 */
export interface ExtractedIdData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  expiryDate?: string;
  nationality?: string;
  gender?: 'M' | 'F' | 'O';
  address?: string;
  mrz?: string;
  photo?: string;
}

/**
 * AML (Anti-Money Laundering) check result
 */
export interface AmlCheckResult {
  checked: boolean;
  status: 'clear' | 'flagged' | 'review_required' | 'blocked';
  riskScore: number;
  matches?: AmlMatch[];
  checkedAt: Date;
  provider?: string;
  referenceId?: string;
}

/**
 * AML Match result
 */
export interface AmlMatch {
  source: string;
  type: 'pep' | 'sanctions' | 'adverse_media' | 'watchlist';
  matchScore: number;
  details: string;
}

/**
 * AML Screening result
 */
export interface AmlScreeningResult {
  id: string;
  userId: string;
  status: 'clear' | 'match' | 'potential_match';
  matches: AmlMatch[];
  riskScore: number;
  screenedAt: Date;
  sanctions: { matched: boolean; lists: string[] };
  pep: { matched: boolean; category: string | null };
  adverseMedia: { matched: boolean; articles: string[] };
}

/**
 * AML Alert
 */
export interface AmlAlert {
  id: string;
  userId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

/**
 * Transaction limits by tier
 */
export interface TransactionLimits {
  daily: number;
  monthly: number;
  perTransaction: number;
}

/**
 * Transaction limit usage
 */
export interface LimitUsage {
  daily: number;
  monthly: number;
}

/**
 * KYC Status Response
 */
export interface KycStatusResponse {
  tier: KycTier;
  status: KycStatus;
  tier1: { submitted: boolean; verified: boolean };
  tier2: { submitted: boolean; verified: boolean; pending: boolean };
  completedAt?: Date;
  expiresAt?: Date;
}

/**
 * Verification service request
 */
export interface VerificationRequest {
  userId: string;
  type: 'phone' | 'email' | 'document' | 'selfie' | 'liveness';
  data: Record<string, unknown>;
}

/**
 * Verification service response
 */
export interface VerificationResponse {
  success: boolean;
  verified: boolean;
  verificationId?: string;
  message?: string;
  errors?: string[];
}

/**
 * Liveness check response
 */
export interface LivenessCheckResponse {
  verified: boolean;
  confidence: number;
  challenges: {
    type: string;
    passed: boolean;
  }[];
}

/**
 * Face match response
 */
export interface FaceMatchResponse {
  match: boolean;
  confidence: number;
  selfieId?: string;
  documentId?: string;
}
