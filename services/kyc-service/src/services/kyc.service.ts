import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country, KycTier } from '@grandgold/types';
import type {
  Tier1Data,
  Tier2Data,
  DocumentUpload,
  KycRecord,
  KycStatusResponse,
  ExtractedIdData,
  PaginatedResult,
} from '../types/kyc.types';

// In-memory store for demo - In production, use database
const kycStore = new Map<string, KycRecord>();

// Transaction limits by tier (in respective currency)
const transactionLimits: Record<KycTier, Record<Country, { daily: number; monthly: number; perTransaction: number }>> = {
  none: {
    IN: { daily: 0, monthly: 0, perTransaction: 0 },
    AE: { daily: 0, monthly: 0, perTransaction: 0 },
    UK: { daily: 0, monthly: 0, perTransaction: 0 },
  },
  tier1: {
    IN: { daily: 50000, monthly: 200000, perTransaction: 25000 },
    AE: { daily: 2000, monthly: 10000, perTransaction: 1000 },
    UK: { daily: 500, monthly: 2500, perTransaction: 250 },
  },
  tier2: {
    IN: { daily: 500000, monthly: 2000000, perTransaction: 250000 },
    AE: { daily: 20000, monthly: 100000, perTransaction: 10000 },
    UK: { daily: 5000, monthly: 25000, perTransaction: 2500 },
  },
  tier3: {
    IN: { daily: 5000000, monthly: 20000000, perTransaction: 2500000 },
    AE: { daily: 200000, monthly: 1000000, perTransaction: 100000 },
    UK: { daily: 50000, monthly: 250000, perTransaction: 25000 },
  },
};

export class KycService {
  /**
   * Get user's KYC status
   */
  async getKycStatus(userId: string): Promise<KycStatusResponse> {
    const kyc = kycStore.get(userId);
    
    if (!kyc) {
      return {
        tier: 'none',
        status: 'not_started',
        tier1: { submitted: false, verified: false },
        tier2: { submitted: false, verified: false, pending: false },
      };
    }
    
    return {
      tier: kyc.tier,
      status: kyc.status,
      tier1: {
        submitted: !!kyc.tier1,
        verified: kyc.tier1?.verified || false,
      },
      tier2: {
        submitted: !!kyc.tier2,
        verified: kyc.tier2?.verified || false,
        pending: kyc.tier2?.status === 'pending',
      },
      completedAt: kyc.completedAt,
      expiresAt: kyc.expiresAt,
    };
  }

  /**
   * Submit Tier 1 KYC
   */
  async submitTier1(userId: string, data: Tier1Data): Promise<{ status: string }> {
    if (!data.emailVerified || !data.phoneVerified) {
      throw new ValidationError('Email and phone must be verified');
    }
    
    let kyc = kycStore.get(userId);
    
    if (!kyc) {
      kyc = {
        id: generateId('kyc'),
        userId,
        tier: 'none',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    kyc.tier1 = {
      data,
      verified: true, // Auto-verify for tier1 if email/phone verified
      status: 'verified',
      submittedAt: new Date(),
      verifiedAt: new Date(),
    };
    
    kyc.tier = 'tier1';
    kyc.status = 'verified';
    kyc.updatedAt = new Date();
    
    kycStore.set(userId, kyc);
    
    return { status: 'verified' };
  }

  /**
   * Submit Tier 2 KYC
   */
  async submitTier2(userId: string, data: Tier2Data): Promise<{ status: string }> {
    let kyc = kycStore.get(userId);
    
    if (!kyc || kyc.tier === 'none') {
      throw new ValidationError('Please complete Tier 1 KYC first');
    }
    
    kyc.tier2 = {
      data,
      status: 'pending',
      verified: false,
      submittedAt: new Date(),
    };
    
    kyc.status = 'pending';
    kyc.updatedAt = new Date();
    
    kycStore.set(userId, kyc);
    
    return { status: 'pending' };
  }

  /**
   * Upload KYC documents (with Document AI processing for ID documents)
   */
  async uploadDocuments(userId: string, documents: DocumentUpload): Promise<{ uploaded: string[]; extractedData?: ExtractedIdData }> {
    const kyc = kycStore.get(userId);
    
    if (!kyc) {
      throw new NotFoundError('KYC record');
    }
    
    const uploaded: string[] = [];
    let extractedData: ExtractedIdData | undefined;
    
    kyc.documents = kyc.documents || {};
    
    // Process ID document with Document AI when documentFront is uploaded
    const idDocument = documents.documentFront || documents.documentBack;
    const documentType = kyc.tier2?.data?.documentType;
    if (idDocument && documentType && kyc.tier2?.data) {
      try {
        const { DocumentAIService } = await import('./document-ai.service');
        const docAIService = new DocumentAIService();
        const result = await docAIService.processDocumentWithOCR(
          idDocument.buffer,
          documentType as any
        );
        if (result.success) {
          extractedData = result.extractedData;
          kyc.documentExtraction = { ...result, processedAt: new Date() };
        }
      } catch (err) {
        console.warn('Document AI processing failed, continuing with upload:', err);
      }
    }
    
    if (documents.documentFront) {
      kyc.documents.documentFront = {
        id: generateId('doc'),
        filename: documents.documentFront.originalname,
        url: `https://storage.googleapis.com/grandgold-kyc/${userId}/${generateId('file')}.jpg`,
        uploadedAt: new Date(),
      };
      uploaded.push('documentFront');
    }
    
    if (documents.documentBack) {
      kyc.documents.documentBack = {
        id: generateId('doc'),
        filename: documents.documentBack.originalname,
        url: `https://storage.googleapis.com/grandgold-kyc/${userId}/${generateId('file')}.jpg`,
        uploadedAt: new Date(),
      };
      uploaded.push('documentBack');
    }
    
    if (documents.selfie) {
      kyc.documents.selfie = {
        id: generateId('doc'),
        filename: documents.selfie.originalname,
        url: `https://storage.googleapis.com/grandgold-kyc/${userId}/${generateId('file')}.jpg`,
        uploadedAt: new Date(),
      };
      uploaded.push('selfie');
    }
    
    if (documents.addressProof) {
      kyc.documents.addressProof = {
        id: generateId('doc'),
        filename: documents.addressProof.originalname,
        url: `https://storage.googleapis.com/grandgold-kyc/${userId}/${generateId('file')}.pdf`,
        uploadedAt: new Date(),
      };
      uploaded.push('addressProof');
    }
    
    kyc.updatedAt = new Date();
    kycStore.set(userId, kyc);
    
    return { uploaded, ...(extractedData && { extractedData }) };
  }

  /**
   * Get transaction limits based on KYC tier
   */
  async getTransactionLimits(userId: string): Promise<{
    tier: KycTier;
    limits: { daily: number; monthly: number; perTransaction: number };
    used: { daily: number; monthly: number };
    currency: string;
  }> {
    const kyc = kycStore.get(userId);
    const tier: KycTier = kyc?.tier || 'none';
    const country: Country = kyc?.tier2?.data?.address?.country || 'IN';
    
    const currencies: Record<Country, string> = { IN: 'INR', AE: 'AED', UK: 'GBP' };
    
    return {
      tier,
      limits: transactionLimits[tier][country],
      used: {
        daily: 0, // Would be calculated from transactions
        monthly: 0,
      },
      currency: currencies[country],
    };
  }

  /**
   * Get KYC requirements for a country
   */
  async getCountryRequirements(country: Country): Promise<{
    tier1: { required: string[]; optional: string[] };
    tier2: { required: string[]; optional: string[]; documents: string[] };
  }> {
    const requirements: Record<Country, any> = {
      IN: {
        tier1: {
          required: ['email', 'phone'],
          optional: [],
        },
        tier2: {
          required: ['fullName', 'dateOfBirth', 'pan', 'address'],
          optional: ['aadhaar'],
          documents: ['PAN Card', 'Aadhaar Card (optional)', 'Address Proof', 'Selfie'],
        },
      },
      AE: {
        tier1: {
          required: ['email', 'phone'],
          optional: [],
        },
        tier2: {
          required: ['fullName', 'dateOfBirth', 'emirates_id', 'address'],
          optional: ['passport'],
          documents: ['Emirates ID', 'Passport (optional)', 'Address Proof', 'Selfie'],
        },
      },
      UK: {
        tier1: {
          required: ['email', 'phone'],
          optional: [],
        },
        tier2: {
          required: ['fullName', 'dateOfBirth', 'passport', 'address'],
          optional: ['drivers_license'],
          documents: ['Passport', 'Driving License (optional)', 'Address Proof', 'Selfie'],
        },
      },
    };
    
    return requirements[country];
  }

  /**
   * Get pending KYC applications (Admin)
   */
  async getPendingApplications(options: {
    country?: string;
    tier?: string;
    page: number;
    limit: number;
    adminCountry: Country;
  }): Promise<PaginatedResult<KycRecord>> {
    let applications = Array.from(kycStore.values()).filter(
      (kyc) => kyc.status === 'pending'
    );
    
    if (options.country) {
      applications = applications.filter(
        (kyc) => kyc.tier2?.data?.address?.country === options.country
      );
    }
    
    if (options.tier) {
      applications = applications.filter(
        (kyc) => kyc.tier === options.tier || kyc.tier2?.status === 'pending'
      );
    }
    
    const total = applications.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = applications.slice(start, start + options.limit);
    
    return { data: paginatedData, total };
  }

  /**
   * Get user's KYC details (Admin)
   */
  async getUserKyc(userId: string): Promise<any> {
    const kyc = kycStore.get(userId);
    
    if (!kyc) {
      throw new NotFoundError('KYC record');
    }
    
    return kyc;
  }

  /**
   * Approve KYC (Admin)
   */
  async approveKyc(
    userId: string,
    tier: KycTier,
    adminUserId: string,
    notes?: string
  ): Promise<{ status: string }> {
    const kyc = kycStore.get(userId);
    
    if (!kyc) {
      throw new NotFoundError('KYC record');
    }
    
    if (tier === 'tier2' && kyc.tier2) {
      kyc.tier2.verified = true;
      kyc.tier2.verifiedAt = new Date();
      kyc.tier2.verifiedBy = adminUserId;
      kyc.tier2.status = 'verified';
      kyc.tier = 'tier2';
    }
    
    kyc.status = 'verified';
    kyc.approvedBy = adminUserId;
    kyc.approvedAt = new Date();
    kyc.notes = notes;
    kyc.completedAt = new Date();
    kyc.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    kyc.updatedAt = new Date();
    
    kycStore.set(userId, kyc);
    
    return { status: 'verified' };
  }

  /**
   * Reject KYC (Admin)
   */
  async rejectKyc(
    userId: string,
    tier: KycTier,
    adminUserId: string,
    reason: string
  ): Promise<{ status: string }> {
    const kyc = kycStore.get(userId);
    
    if (!kyc) {
      throw new NotFoundError('KYC record');
    }
    
    if (tier === 'tier2' && kyc.tier2) {
      kyc.tier2.status = 'rejected';
      kyc.tier2.rejectedAt = new Date();
      kyc.tier2.rejectedBy = adminUserId;
      kyc.tier2.rejectionReason = reason;
    }
    
    kyc.status = 'rejected';
    kyc.rejectedBy = adminUserId;
    kyc.rejectedAt = new Date();
    kyc.rejectionReason = reason;
    kyc.updatedAt = new Date();
    
    kycStore.set(userId, kyc);
    
    return { status: 'rejected' };
  }
}
