// Seller types

import { Address, Country, FileUpload, Timestamps, SoftDelete } from './common';

export type SellerStatus = 
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type OnboardingType = 'automated' | 'manual';

export type SellerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Seller extends Timestamps, SoftDelete {
  id: string;
  tenantId: string;
  userId: string;
  
  // Business Info
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  registrationNumber?: string;
  taxId?: string; // GST (India), TRN (UAE), VAT (UK)
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Address
  businessAddress: Address;
  warehouseAddresses: Address[];
  
  // Documents
  tradeLicense?: FileUpload;
  vatCertificate?: FileUpload;
  goldDealerPermit?: FileUpload;
  bankDetails?: BankDetails;
  
  // Onboarding
  onboardingType: OnboardingType;
  onboardingStatus: SellerStatus;
  onboardingCompletedAt?: Date;
  
  // Agreement
  agreementSignedAt?: Date;
  agreementDocuSignId?: string;
  
  // Verification
  backgroundCheckStatus: 'pending' | 'passed' | 'failed';
  backgroundCheckResult?: Record<string, unknown>;
  
  // Settings
  settings: SellerSettings;
  
  // Performance
  tier: SellerTier;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalOrders: number;
  
  // Commission
  commissionRate: number; // percentage
  
  // Countries
  operatingCountries: Country[];
  
  // Store
  storeName?: string;
  storeSlug?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription?: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchCode?: string;
  swiftCode?: string;
  iban?: string;
  country: Country;
  isVerified: boolean;
}

export interface SellerSettings {
  autoAcceptOrders: boolean;
  lowStockAlertThreshold: number;
  notificationPreferences: {
    newOrder: boolean;
    lowStock: boolean;
    review: boolean;
    settlement: boolean;
  };
  shippingSettings: {
    processingTime: number; // days
    domesticShipping: boolean;
    internationalShipping: boolean;
    freeShippingThreshold?: number;
  };
  visibility: {
    showInSearch: boolean;
    showRating: boolean;
    showResponseTime: boolean;
  };
}

export interface SellerOnboardingRequest {
  // Step 1: Business Info
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  registrationNumber?: string;
  taxId?: string;
  
  // Step 2: Address
  businessAddress: Omit<Address, 'id' | 'isDefault'>;
  
  // Step 3: Documents
  tradeLicense?: File;
  vatCertificate?: File;
  goldDealerPermit?: File;
  
  // Step 4: Bank Details
  bankDetails: Omit<BankDetails, 'isVerified'>;
  
  // Step 5: Agreement
  acceptTerms: boolean;
  acceptCommissionStructure: boolean;
  
  // Onboarding type
  onboardingType: OnboardingType;
  country: Country;
}

export interface SellerOnboardingStatus {
  sellerId: string;
  currentStep: number;
  totalSteps: number;
  status: SellerStatus;
  completedSteps: string[];
  pendingSteps: string[];
  rejectionReasons?: string[];
  estimatedApprovalTime?: string;
}

export interface SellerPerformance {
  sellerId: string;
  period: 'day' | 'week' | 'month' | 'year';
  
  // Sales
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  
  // Products
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  
  // Customer satisfaction
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: number; // hours
  
  // Fulfillment
  onTimeDeliveryRate: number;
  cancellationRate: number;
  returnRate: number;
  
  // Comparison
  previousPeriod?: {
    revenueChange: number;
    ordersChange: number;
    ratingChange: number;
  };
}

export interface SellerSettlement extends Timestamps {
  id: string;
  sellerId: string;
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  
  // Amounts
  grossAmount: number;
  commission: number;
  gatewayFees: number;
  taxes: number;
  otherDeductions: number;
  netAmount: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Payment
  paymentMethod: 'bank_transfer' | 'manual';
  paymentReference?: string;
  paidAt?: Date;
  
  // Orders
  orderCount: number;
  orderIds: string[];
  
  // Currency
  currency: string;
}

// Country-specific requirements
export const SELLER_TAX_FIELDS: Record<Country, { field: string; label: string; pattern: RegExp }> = {
  IN: {
    field: 'gst',
    label: 'GST Number',
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  },
  AE: {
    field: 'trn',
    label: 'Tax Registration Number',
    pattern: /^[0-9]{15}$/,
  },
  UK: {
    field: 'vat',
    label: 'VAT Number',
    pattern: /^GB[0-9]{9}$/,
  },
};
