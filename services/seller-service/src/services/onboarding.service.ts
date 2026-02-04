import axios from 'axios';
import { generateId, NotFoundError, ValidationError, ConflictError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

interface OnboardingStartInput {
  userId: string;
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  registrationNumber?: string;
  taxId?: string;
  email: string;
  phone: string;
  businessAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: Country;
  };
  onboardingType: 'automated' | 'manual';
  country: Country;
}

interface OnboardingStatus {
  id: string;
  userId: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  pendingSteps: string[];
  documentsUploaded: boolean;
  bankDetailsSubmitted: boolean;
  agreementSigned: boolean;
  backgroundCheckPassed?: boolean;
  rejectionReasons?: string[];
  estimatedApprovalTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentUpload {
  tradeLicense?: Express.Multer.File;
  vatCertificate?: Express.Multer.File;
  goldDealerPermit?: Express.Multer.File;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchCode?: string;
  swiftCode?: string;
  iban?: string;
}

// In-memory store for demo (use database in production)
const onboardingStore = new Map<string, any>();

export class OnboardingService {
  /**
   * Start seller onboarding process
   */
  async startOnboarding(input: OnboardingStartInput): Promise<{ sellerId: string; onboardingId: string }> {
    // Check if user already has an onboarding in progress
    const existing = Array.from(onboardingStore.values()).find(
      (o) => o.userId === input.userId && o.status !== 'rejected'
    );
    
    if (existing) {
      throw new ConflictError('You already have an onboarding in progress');
    }

    const onboardingId = generateId('onb');
    const sellerId = generateId('sel');

    const onboarding = {
      id: onboardingId,
      sellerId,
      userId: input.userId,
      businessName: input.businessName,
      businessType: input.businessType,
      registrationNumber: input.registrationNumber,
      taxId: input.taxId,
      email: input.email,
      phone: input.phone,
      businessAddress: input.businessAddress,
      onboardingType: input.onboardingType,
      country: input.country,
      status: 'pending',
      currentStep: 1,
      totalSteps: input.onboardingType === 'automated' ? 4 : 5,
      completedSteps: ['business_info'],
      pendingSteps: ['documents', 'bank_details', 'agreement'],
      documentsUploaded: false,
      bankDetailsSubmitted: false,
      agreementSigned: false,
      documents: {},
      bankDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onboardingStore.set(onboardingId, onboarding);

    return { sellerId, onboardingId };
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.userId === userId && o.status !== 'rejected'
    );

    if (!onboarding) {
      return null;
    }

    return {
      id: onboarding.id,
      userId: onboarding.userId,
      status: onboarding.status,
      currentStep: onboarding.currentStep,
      totalSteps: onboarding.totalSteps,
      completedSteps: onboarding.completedSteps,
      pendingSteps: onboarding.pendingSteps,
      documentsUploaded: onboarding.documentsUploaded,
      bankDetailsSubmitted: onboarding.bankDetailsSubmitted,
      agreementSigned: onboarding.agreementSigned,
      backgroundCheckPassed: onboarding.backgroundCheckPassed,
      rejectionReasons: onboarding.rejectionReasons,
      estimatedApprovalTime: onboarding.onboardingType === 'automated' ? '24-48 hours' : '3-5 business days',
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    };
  }

  /**
   * Upload onboarding documents
   */
  async uploadDocuments(userId: string, documents: DocumentUpload): Promise<{ uploaded: string[] }> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.userId === userId && o.status === 'pending'
    );

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    const uploaded: string[] = [];

    // Upload to cloud storage (mock)
    if (documents.tradeLicense) {
      onboarding.documents.tradeLicense = {
        id: generateId('doc'),
        filename: documents.tradeLicense.originalname,
        url: `https://storage.googleapis.com/grandgold-documents/${generateId('file')}.pdf`,
        uploadedAt: new Date(),
      };
      uploaded.push('tradeLicense');
    }

    if (documents.vatCertificate) {
      onboarding.documents.vatCertificate = {
        id: generateId('doc'),
        filename: documents.vatCertificate.originalname,
        url: `https://storage.googleapis.com/grandgold-documents/${generateId('file')}.pdf`,
        uploadedAt: new Date(),
      };
      uploaded.push('vatCertificate');
    }

    if (documents.goldDealerPermit) {
      onboarding.documents.goldDealerPermit = {
        id: generateId('doc'),
        filename: documents.goldDealerPermit.originalname,
        url: `https://storage.googleapis.com/grandgold-documents/${generateId('file')}.pdf`,
        uploadedAt: new Date(),
      };
      uploaded.push('goldDealerPermit');
    }

    // Update status
    onboarding.documentsUploaded = true;
    onboarding.currentStep = 2;
    onboarding.completedSteps.push('documents');
    onboarding.pendingSteps = onboarding.pendingSteps.filter((s: string) => s !== 'documents');
    onboarding.updatedAt = new Date();

    return { uploaded };
  }

  /**
   * Submit bank details
   */
  async submitBankDetails(userId: string, bankDetails: BankDetails): Promise<{ verified: boolean }> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.userId === userId && o.status === 'pending'
    );

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    // Verify bank details (mock - in production, use banking API)
    const verified = true;

    onboarding.bankDetails = {
      ...bankDetails,
      isVerified: verified,
      verifiedAt: new Date(),
    };

    onboarding.bankDetailsSubmitted = true;
    onboarding.currentStep = 3;
    onboarding.completedSteps.push('bank_details');
    onboarding.pendingSteps = onboarding.pendingSteps.filter((s: string) => s !== 'bank_details');
    onboarding.updatedAt = new Date();

    return { verified };
  }

  /**
   * Initiate DocuSign agreement signing
   */
  async initiateAgreementSigning(userId: string): Promise<{ signingUrl: string; envelopeId: string }> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.userId === userId && o.status === 'pending'
    );

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    // Create DocuSign envelope (mock)
    const envelopeId = generateId('env');
    const signingUrl = `https://docusign.com/sign/${envelopeId}`;

    onboarding.docuSignEnvelopeId = envelopeId;
    onboarding.updatedAt = new Date();

    return { signingUrl, envelopeId };
  }

  /**
   * Handle DocuSign callback
   */
  async handleDocuSignCallback(data: {
    envelopeId: string;
    status: string;
    recipientEmail: string;
  }): Promise<void> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.docuSignEnvelopeId === data.envelopeId
    );

    if (!onboarding) {
      return;
    }

    if (data.status === 'completed') {
      onboarding.agreementSigned = true;
      onboarding.agreementSignedAt = new Date();
      onboarding.currentStep = 4;
      onboarding.completedSteps.push('agreement');
      onboarding.pendingSteps = onboarding.pendingSteps.filter((s: string) => s !== 'agreement');
      onboarding.updatedAt = new Date();
    }
  }

  /**
   * Submit for review
   */
  async submitForReview(userId: string): Promise<{ status: string }> {
    const onboarding = Array.from(onboardingStore.values()).find(
      (o) => o.userId === userId && o.status === 'pending'
    );

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    // Validate all required steps are completed
    if (!onboarding.documentsUploaded) {
      throw new ValidationError('Please upload all required documents');
    }
    if (!onboarding.bankDetailsSubmitted) {
      throw new ValidationError('Please submit bank details');
    }
    if (!onboarding.agreementSigned) {
      throw new ValidationError('Please sign the seller agreement');
    }

    // For automated onboarding, run background check
    if (onboarding.onboardingType === 'automated') {
      // Mock background check
      onboarding.backgroundCheckPassed = true;
      onboarding.backgroundCheckCompletedAt = new Date();
    }

    onboarding.status = 'in_review';
    onboarding.submittedAt = new Date();
    onboarding.updatedAt = new Date();

    return { status: 'in_review' };
  }

  /**
   * Approve onboarding (Admin)
   */
  async approveOnboarding(onboardingId: string, adminUserId: string): Promise<{ sellerId: string }> {
    const onboarding = onboardingStore.get(onboardingId);

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    if (onboarding.status !== 'in_review') {
      throw new ValidationError('Onboarding is not in review status');
    }

    onboarding.status = 'approved';
    onboarding.approvedBy = adminUserId;
    onboarding.approvedAt = new Date();
    onboarding.updatedAt = new Date();

    // Create actual seller record (would be in database)
    // This is where tenant creation would happen

    return { sellerId: onboarding.sellerId };
  }

  /**
   * Reject onboarding (Admin)
   */
  async rejectOnboarding(
    onboardingId: string,
    adminUserId: string,
    reason: string
  ): Promise<{ status: string }> {
    const onboarding = onboardingStore.get(onboardingId);

    if (!onboarding) {
      throw new NotFoundError('Onboarding');
    }

    onboarding.status = 'rejected';
    onboarding.rejectedBy = adminUserId;
    onboarding.rejectionReasons = [reason];
    onboarding.rejectedAt = new Date();
    onboarding.updatedAt = new Date();

    return { status: 'rejected' };
  }

  /**
   * Get pending onboardings (Admin)
   */
  async getPendingOnboardings(options: {
    country?: string;
    page: number;
    limit: number;
    adminUserId: string;
    adminCountry?: Country; // Undefined for super_admin (global access)
  }): Promise<{ data: any[]; total: number }> {
    let onboardings = Array.from(onboardingStore.values()).filter(
      (o) => o.status === 'in_review'
    );

    // Filter by country if admin is country-specific (super_admin has undefined country)
    if (options.adminCountry) {
      onboardings = onboardings.filter((o) => o.country === options.adminCountry);
    }

    if (options.country) {
      onboardings = onboardings.filter((o) => o.country === options.country);
    }

    const total = onboardings.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = onboardings.slice(start, start + options.limit);

    return {
      data: paginatedData,
      total,
    };
  }
}
