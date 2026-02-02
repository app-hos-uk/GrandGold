// Order types

import { Address, Country, Currency, Money, Timestamps } from './common';
import { Product, PriceCalculation } from './product';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface Order extends Timestamps {
  id: string;
  orderNumber: string;
  
  // Customer
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Seller (hidden until payment - Veil Logic)
  sellerId: string;
  sellerRevealed: boolean;
  
  // Tenant
  tenantId: string;
  
  // Country
  country: Country;
  currency: Currency;
  
  // Items
  items: OrderItem[];
  
  // Addresses
  shippingAddress: Address;
  billingAddress: Address;
  
  // Pricing
  subtotal: Money;
  shippingCost: Money;
  taxAmount: Money;
  taxRate: number;
  discount: Money;
  total: Money;
  
  // Price lock
  priceLockId?: string;
  priceLockExpiresAt?: Date;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Payment
  paymentMethod?: string;
  paymentGateway?: string;
  paymentTransactionId?: string;
  paidAt?: Date;
  
  // Shipping
  shippingMethod?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  // Gift
  isGift: boolean;
  giftMessage?: string;
  giftWrapping: boolean;
  
  // Insurance
  insuranceIncluded: boolean;
  insuranceAmount?: Money;
  
  // Timestamps
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  
  // Product snapshot (at time of order)
  productSnapshot: {
    name: string;
    sku: string;
    image: string;
    category: string;
  };
  
  // Quantity
  quantity: number;
  
  // Pricing
  unitPrice: Money;
  priceCalculation?: PriceCalculation; // For dynamic pricing
  subtotal: Money;
  tax: Money;
  total: Money;
  
  // Status
  status: OrderItemStatus;
  
  // Fulfillment
  fulfilledQuantity: number;
  returnedQuantity: number;
}

export type OrderItemStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface CreateOrderRequest {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  shippingAddress: Omit<Address, 'id' | 'isDefault'>;
  billingAddress?: Omit<Address, 'id' | 'isDefault'>;
  useSameAddress: boolean;
  customerNotes?: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrapping?: boolean;
  insuranceIncluded?: boolean;
  priceLockId?: string;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: Money;
  itemCount: number;
  createdAt: Date;
  estimatedDelivery?: Date;
}

export interface OrderDetail extends Order {
  // Extended with seller info (after reveal)
  seller?: {
    id: string;
    name: string;
    rating: number;
    phone?: string;
    email?: string;
  };
  
  // Timeline
  timeline: OrderTimelineEvent[];
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  event: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Price Lock for checkout
export interface PriceLock {
  id: string;
  userId: string;
  
  // Items with locked prices
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    lockedPrice: Money;
    priceCalculation: PriceCalculation;
  }[];
  
  // Lock details
  goldPriceAtLock: number;
  currency: Currency;
  
  // Timing
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  
  // Status
  status: 'active' | 'used' | 'expired';
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  country: Country;
  currency: Currency;
  subtotal: Money;
  estimatedTax: Money;
  estimatedTotal: Money;
  itemCount: number;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

// Return/Refund
export interface ReturnRequest extends Timestamps {
  id: string;
  orderId: string;
  orderItemId: string;
  customerId: string;
  
  // Reason
  reason: ReturnReason;
  reasonDetails?: string;
  
  // Items
  quantity: number;
  
  // Status
  status: ReturnStatus;
  
  // Refund
  refundAmount?: Money;
  refundedAt?: Date;
  refundTransactionId?: string;
  
  // Shipping
  returnLabel?: string;
  returnTrackingNumber?: string;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
}

export type ReturnReason =
  | 'defective'
  | 'not_as_described'
  | 'wrong_item'
  | 'changed_mind'
  | 'size_issue'
  | 'other';

export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'received'
  | 'refunded';
