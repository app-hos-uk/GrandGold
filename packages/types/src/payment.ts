// Payment types

import { Country, Currency, Money, Timestamps } from './common';

export type PaymentGateway = 'stripe' | 'razorpay' | 'paypal';

export type PaymentMethod =
  | 'card'
  | 'upi'
  | 'netbanking'
  | 'wallet'
  | 'emi'
  | 'bnpl'
  | 'bank_transfer';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface Transaction extends Timestamps {
  id: string;
  orderId: string;
  customerId: string;
  
  // Amount
  amount: Money;
  currency: Currency;
  
  // Gateway
  gateway: PaymentGateway;
  gatewayTransactionId: string;
  
  // Method
  method: PaymentMethod;
  methodDetails?: PaymentMethodDetails;
  
  // Status
  status: TransactionStatus;
  statusHistory: TransactionStatusChange[];
  
  // Fees
  gatewayFee?: Money;
  platformFee?: Money;
  
  // Refund
  refundedAmount?: Money;
  refundReason?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  // Country
  country: Country;
}

export interface PaymentMethodDetails {
  // Card
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // UPI
  upiId?: string;
  
  // Bank
  bankName?: string;
  bankCode?: string;
  
  // Wallet
  walletType?: string;
  
  // EMI
  emiTenure?: number;
  emiProvider?: string;
  emiInterestRate?: number;
  
  // BNPL
  bnplProvider?: string;
}

export interface TransactionStatusChange {
  status: TransactionStatus;
  timestamp: Date;
  reason?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: Currency;
  gateway: PaymentGateway;
  method: PaymentMethod;
  methodDetails?: {
    cardToken?: string;
    upiId?: string;
    bankCode?: string;
    emiTenure?: number;
    bnplProvider?: string;
  };
  returnUrl: string;
  country: Country;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: Money;
  currency: Currency;
  gateway: PaymentGateway;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'cancelled';
  expiresAt: Date;
}

// Saved payment methods
export interface SavedPaymentMethod extends Timestamps {
  id: string;
  userId: string;
  gateway: PaymentGateway;
  type: 'card' | 'upi' | 'bank_account';
  
  // Display info
  displayName: string;
  
  // Card
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // UPI
  upiId?: string;
  
  // Bank
  bankName?: string;
  bankAccountLast4?: string;
  
  // Gateway reference
  gatewayCustomerId: string;
  gatewayPaymentMethodId: string;
  
  // Settings
  isDefault: boolean;
  isActive: boolean;
  
  // Country
  country: Country;
}

// EMI options
export interface EmiOption {
  provider: string;
  tenure: number; // months
  interestRate: number; // percentage
  emiAmount: Money;
  totalAmount: Money;
  processingFee?: Money;
}

export interface EmiOptionsResponse {
  orderId: string;
  orderAmount: Money;
  options: EmiOption[];
}

// BNPL options
export interface BnplOption {
  provider: 'klarna' | 'clearpay' | 'simpl' | 'lazypay';
  displayName: string;
  description: string;
  iconUrl: string;
  available: boolean;
  maxAmount?: Money;
  minAmount?: Money;
  terms?: string;
}

export interface BnplOptionsResponse {
  orderId: string;
  orderAmount: Money;
  options: BnplOption[];
}

// Refund
export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  notifyCustomer: boolean;
}

export interface Refund extends Timestamps {
  id: string;
  transactionId: string;
  orderId: string;
  amount: Money;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gatewayRefundId?: string;
  processedAt?: Date;
}

// Gateway-specific types
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

// Country-specific payment methods
export const PAYMENT_METHODS_BY_COUNTRY: Record<Country, PaymentMethod[]> = {
  IN: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'bnpl'],
  AE: ['card', 'bank_transfer'],
  UK: ['card', 'bnpl', 'bank_transfer'],
};

// Gateway by country
export const PREFERRED_GATEWAY_BY_COUNTRY: Record<Country, PaymentGateway> = {
  IN: 'razorpay',
  AE: 'stripe',
  UK: 'stripe',
};
