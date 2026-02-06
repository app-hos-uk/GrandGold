/**
 * Internal types used across order-service modules.
 * These replace raw `any` with explicit shapes.
 */
import type { Country, OrderStatus } from '@grandgold/types';

// ── Cart ──────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  image?: string;
  sellerId?: string;
  sellerName?: string;
  sellerContact?: string;
  sellerAddress?: string;
  quantity: number;
  price: number;
  goldWeight?: number;
  purity?: string;
  category?: string;
  hasClickCollect?: boolean;
  [key: string]: unknown;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  country: Country;
  [key: string]: unknown;
}

// ── Checkout ──────────────────────────────────────────────────────────

export interface CheckoutRecord {
  id: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cart: any; // Cart from CartService (may differ from internal Cart shape)
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress | ShippingAddress;
  deliveryOption: string;
  notes?: string;
  giftWrapping: boolean;
  giftMessage?: string;
  insuranceIncluded: boolean;
  scheduledDeliveryDate?: string;
  isExpressCheckout: boolean;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  giftWrappingFee: number;
  insuranceCost: number;
  total: number;
  promoCode: string | null;
  status: string;
  orderId?: string;
  clickCollect?: { storeId: string; collectionDate: string; collectionTime: string };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: Country;
  coordinates?: { lat: number; lng: number };
}

export interface BillingAddress {
  sameAsShipping: boolean;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: Country;
}

// ── Order ─────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sellerId?: string;
  sellerName?: string;
  sellerContact?: string;
  sellerAddress?: string;
  quantity: number;
  price: number;
  goldWeight?: number;
  purity?: string;
  [key: string]: unknown;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  checkoutId?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress | ShippingAddress;
  deliveryOption?: string;
  notes?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  country: Country;
  paymentMethod: string;
  paymentIntentId: string;
  paymentStatus: string;
  status: OrderStatus | 'cancellation_requested' | 'return_requested';
  statusHistory: StatusHistoryEntry[];
  returnRequest?: ReturnRequest;
  cancellationReason?: string;
  cancellationRequestedAt?: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface StatusHistoryEntry {
  from?: string;
  to?: string;
  status?: string;
  timestamp?: Date;
  changedBy?: string;
  changedAt?: Date;
  note?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  items: string[];
  reason: string;
  images?: string[];
  status: string;
  createdAt: Date;
}

// ── Invoice ───────────────────────────────────────────────────────────

export interface InvoiceRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceUrl: string;
  pdfUrl: string;
  customer: {
    name: string;
    email: string;
    address: Record<string, unknown>;
  };
  seller: {
    name: string;
    address: Record<string, unknown>;
    taxId?: string;
  };
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  createdAt: Date;
}

// ── Tax ───────────────────────────────────────────────────────────────

export interface TaxableItem {
  productId: string;
  price: number;
  quantity: number;
  category?: string;
}

// ── Carrier ───────────────────────────────────────────────────────────

export interface CarrierRecord {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  apiSecret?: string;
  [key: string]: unknown;
}
