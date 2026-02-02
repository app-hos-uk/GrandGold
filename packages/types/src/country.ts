// Country configuration types

import { Country, Currency } from './common';

export interface CountryConfig {
  code: Country;
  name: string;
  currency: Currency;
  currencySymbol: string;
  locale: string;
  timezone: string;
  
  // Tax
  taxRate: number;
  taxName: string; // VAT, GST, etc.
  taxId: string; // Field name for tax ID
  
  // Phone
  phoneCode: string;
  phonePattern: RegExp;
  
  // Address
  addressFormat: AddressFormat;
  
  // Shipping
  defaultShippingCost: number;
  freeShippingThreshold?: number;
  
  // Payment
  defaultPaymentGateway: string;
  availablePaymentMethods: string[];
  
  // KYC
  requiredKycDocuments: string[];
  purchaseLimitWithoutKyc: number;
  
  // Business
  requiredBusinessDocuments: string[];
  
  // Legal
  legalEntity: string;
  termsUrl: string;
  privacyUrl: string;
  
  // Feature flags
  features: CountryFeatures;
}

export interface AddressFormat {
  fields: AddressField[];
  postalCodePattern: RegExp;
  postalCodeLabel: string;
  stateLabel: string;
  states?: { code: string; name: string }[];
}

export interface AddressField {
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'select' | 'postal';
  maxLength?: number;
}

export interface CountryFeatures {
  emiAvailable: boolean;
  bnplAvailable: boolean;
  upiAvailable: boolean;
  codAvailable: boolean;
  clickAndCollect: boolean;
  videoConsultation: boolean;
  arTryOn: boolean;
  internationalShipping: boolean;
}

// Country configurations
export const COUNTRY_CONFIGS: Record<Country, CountryConfig> = {
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    taxRate: 3,
    taxName: 'GST',
    taxId: 'gst',
    phoneCode: '+91',
    phonePattern: /^[6-9]\d{9}$/,
    addressFormat: {
      fields: [
        { name: 'line1', label: 'Address Line 1', required: true, type: 'text', maxLength: 100 },
        { name: 'line2', label: 'Address Line 2', required: false, type: 'text', maxLength: 100 },
        { name: 'city', label: 'City', required: true, type: 'text', maxLength: 50 },
        { name: 'state', label: 'State', required: true, type: 'select' },
        { name: 'postalCode', label: 'PIN Code', required: true, type: 'postal', maxLength: 6 },
      ],
      postalCodePattern: /^[1-9][0-9]{5}$/,
      postalCodeLabel: 'PIN Code',
      stateLabel: 'State',
      states: [
        { code: 'DL', name: 'Delhi' },
        { code: 'MH', name: 'Maharashtra' },
        { code: 'KA', name: 'Karnataka' },
        { code: 'TN', name: 'Tamil Nadu' },
        { code: 'GJ', name: 'Gujarat' },
        { code: 'RJ', name: 'Rajasthan' },
        { code: 'WB', name: 'West Bengal' },
        { code: 'KL', name: 'Kerala' },
        // Add more states as needed
      ],
    },
    defaultShippingCost: 500,
    freeShippingThreshold: 50000,
    defaultPaymentGateway: 'razorpay',
    availablePaymentMethods: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'bnpl'],
    requiredKycDocuments: ['aadhaar', 'pan_card'],
    purchaseLimitWithoutKyc: 50000,
    requiredBusinessDocuments: ['gst_certificate', 'pan_card', 'trade_license'],
    legalEntity: 'GrandGold India Pvt. Ltd.',
    termsUrl: '/in/terms',
    privacyUrl: '/in/privacy',
    features: {
      emiAvailable: true,
      bnplAvailable: true,
      upiAvailable: true,
      codAvailable: false,
      clickAndCollect: true,
      videoConsultation: true,
      arTryOn: true,
      internationalShipping: true,
    },
  },
  
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    timezone: 'Asia/Dubai',
    taxRate: 5,
    taxName: 'VAT',
    taxId: 'trn',
    phoneCode: '+971',
    phonePattern: /^5[0-9]{8}$/,
    addressFormat: {
      fields: [
        { name: 'line1', label: 'Address Line 1', required: true, type: 'text', maxLength: 100 },
        { name: 'line2', label: 'Address Line 2', required: false, type: 'text', maxLength: 100 },
        { name: 'city', label: 'City', required: true, type: 'select' },
        { name: 'postalCode', label: 'P.O. Box', required: false, type: 'postal', maxLength: 10 },
      ],
      postalCodePattern: /^[0-9]{5,10}$/,
      postalCodeLabel: 'P.O. Box',
      stateLabel: 'Emirate',
      states: [
        { code: 'DXB', name: 'Dubai' },
        { code: 'AUH', name: 'Abu Dhabi' },
        { code: 'SHJ', name: 'Sharjah' },
        { code: 'AJM', name: 'Ajman' },
        { code: 'RAK', name: 'Ras Al Khaimah' },
        { code: 'FUJ', name: 'Fujairah' },
        { code: 'UAQ', name: 'Umm Al Quwain' },
      ],
    },
    defaultShippingCost: 50,
    freeShippingThreshold: 1000,
    defaultPaymentGateway: 'stripe',
    availablePaymentMethods: ['card', 'bank_transfer'],
    requiredKycDocuments: ['emirates_id', 'passport'],
    purchaseLimitWithoutKyc: 5000,
    requiredBusinessDocuments: ['trade_license', 'trn_certificate'],
    legalEntity: 'GrandGold DMCC',
    termsUrl: '/ae/terms',
    privacyUrl: '/ae/privacy',
    features: {
      emiAvailable: false,
      bnplAvailable: false,
      upiAvailable: false,
      codAvailable: false,
      clickAndCollect: true,
      videoConsultation: true,
      arTryOn: true,
      internationalShipping: true,
    },
  },
  
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    timezone: 'Europe/London',
    taxRate: 20,
    taxName: 'VAT',
    taxId: 'vat',
    phoneCode: '+44',
    phonePattern: /^7[0-9]{9}$/,
    addressFormat: {
      fields: [
        { name: 'line1', label: 'Address Line 1', required: true, type: 'text', maxLength: 100 },
        { name: 'line2', label: 'Address Line 2', required: false, type: 'text', maxLength: 100 },
        { name: 'city', label: 'Town/City', required: true, type: 'text', maxLength: 50 },
        { name: 'state', label: 'County', required: false, type: 'text', maxLength: 50 },
        { name: 'postalCode', label: 'Postcode', required: true, type: 'postal', maxLength: 10 },
      ],
      postalCodePattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
      postalCodeLabel: 'Postcode',
      stateLabel: 'County',
    },
    defaultShippingCost: 15,
    freeShippingThreshold: 500,
    defaultPaymentGateway: 'stripe',
    availablePaymentMethods: ['card', 'bnpl', 'bank_transfer'],
    requiredKycDocuments: ['passport', 'drivers_license'],
    purchaseLimitWithoutKyc: 5000,
    requiredBusinessDocuments: ['vat_certificate', 'company_registration'],
    legalEntity: 'GrandGold UK Ltd.',
    termsUrl: '/uk/terms',
    privacyUrl: '/uk/privacy',
    features: {
      emiAvailable: false,
      bnplAvailable: true,
      upiAvailable: false,
      codAvailable: false,
      clickAndCollect: true,
      videoConsultation: true,
      arTryOn: true,
      internationalShipping: true,
    },
  },
};

// Helper functions
export function getCountryConfig(country: Country): CountryConfig {
  return COUNTRY_CONFIGS[country];
}

export function getCurrencySymbol(country: Country): string {
  return COUNTRY_CONFIGS[country].currencySymbol;
}

export function formatCurrency(amount: number, country: Country): string {
  const config = COUNTRY_CONFIGS[country];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

export function getTaxRate(country: Country): number {
  return COUNTRY_CONFIGS[country].taxRate;
}

export function calculateTax(amount: number, country: Country): number {
  const taxRate = getTaxRate(country);
  return (amount * taxRate) / 100;
}
