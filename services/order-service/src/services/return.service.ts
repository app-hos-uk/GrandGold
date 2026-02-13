import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import { TaxService } from './tax.service';
import { CreditNoteService } from './credit-note.service';

// ── Types ────────────────────────────────────────────────────────────

interface ReturnRecord {
  id: string; orderId: string; userId: string; items: string[];
  reason: string; reasonDetails?: string; images: string[];
  preferredResolution: string; status: string;
  requestedAt: Date; approvedAt: Date | null; rejectedAt: Date | null;
  rejectionReason: string | null; returnLabelUrl: string | null;
  trackingNumber: string | null; refundAmount: number | null; refundedAt: Date | null;
  // Expanded fields
  resolution?: string;
  qcInspection?: QCInspectionResult;
  refundBreakdown?: RefundBreakdown;
  taxCreditNote?: TaxCreditNoteRef;
  exchangeProductId?: string;
  exchangeOrderId?: string;
  priceDifference?: number;
  goldCreditGrams?: number;
  goldRateAtRefund?: number;
  restockingFeePercent?: number;
  receivedAt?: Date;
  country?: Country;
  currency?: string;
  [key: string]: unknown;
}

export interface QCInspectionResult {
  // Weight verification
  originalWeightGrams: number;
  returnedWeightGrams: number;
  weightVarianceGrams: number;
  weightToleranceGrams: number;
  weightVerdict: 'pass' | 'fail';
  // Purity test
  originalPurity: string;
  testedPurity: string;
  purityVerdict: 'pass' | 'fail' | 'skipped';
  purityTestMethod?: 'xrf' | 'touchstone' | 'acid_test' | 'fire_assay';
  // Stones
  stonesIntact: boolean;
  stonesCount: number;
  stonesVerdict: 'pass' | 'fail' | 'na';
  // Hallmark
  hallmarkVerified: boolean;
  hallmarkNumber?: string;
  // Condition
  itemCondition: 'as_new' | 'minor_wear' | 'damaged' | 'tampered';
  conditionNotes?: string;
  // Inspector
  inspectedBy: string;
  inspectedAt: string;
  qcPhotos?: string[];
}

export interface RefundBreakdown {
  metalValue: number;
  makingCharges: number;
  stoneValue: number;
  subtotal: number;
  taxReversed: number;
  shippingRefund: number;
  restockingFee: number;
  restockingFeeTax: number;
  returnShippingDeducted: number;
  netRefund: number;
  goldCreditGrams?: number;
  goldRateAtRefund?: number;
}

interface TaxCreditNoteRef {
  creditNoteNumber: string;
  creditNoteId: string;
}

// In-memory store for demo
const returnStore = new Map<string, ReturnRecord>();

// Gold credit wallet (in-memory)
const goldCreditStore = new Map<string, { balanceGrams: number; transactions: GoldCreditTx[] }>();

interface GoldCreditTx {
  id: string;
  type: 'credit' | 'debit';
  grams: number;
  goldRate: number;
  amount: number;
  returnRequestId?: string;
  orderId?: string;
  createdAt: Date;
}

type ReturnReason = 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind'
  | 'size_issue' | 'purity_mismatch' | 'weight_discrepancy' | 'stone_missing'
  | 'stone_damaged' | 'hallmark_issue' | 'certificate_mismatch' | 'other';

interface CreateReturnInput {
  orderId: string;
  userId: string;
  items: string[]; // Product IDs or order item IDs
  reason: ReturnReason;
  reasonDetails?: string;
  images?: string[];
  preferredResolution: 'refund' | 'exchange' | 'store_credit' | 'gold_credit';
}

// Restocking fee schedule (by reason)
const RESTOCKING_FEES: Record<string, number> = {
  defective: 0,
  wrong_item: 0,
  not_as_described: 0,
  purity_mismatch: 0,
  weight_discrepancy: 0,
  stone_missing: 0,
  stone_damaged: 0,
  hallmark_issue: 0,
  certificate_mismatch: 0,
  changed_mind: 10,    // 10% restocking fee for buyer's remorse
  size_issue: 5,       // 5% restocking fee
  other: 10,           // 10% default
};

// QC weight tolerance: ±0.1 gram
const QC_WEIGHT_TOLERANCE_GRAMS = 0.1;

// ── Return shipping cost policy rules ────────────────────────────────
type ReturnShippingPolicy = 'seller_fault' | 'customer_choice' | 'platform_goodwill' | 'free_return';

const SELLER_FAULT_REASONS = new Set(['defective', 'wrong_item', 'not_as_described']);

// Flat return shipping rates by country (in local currency)
const RETURN_SHIPPING_RATES: Record<string, number> = {
  IN: 350,   // INR
  AE: 50,    // AED
  UK: 15,    // GBP
};

function determineReturnShippingPolicy(
  reason: string,
  _orderTotal?: number
): { policy: ReturnShippingPolicy; paidBy: 'customer' | 'seller' | 'platform'; cost: number | null } {
  if (SELLER_FAULT_REASONS.has(reason)) {
    return { policy: 'seller_fault', paidBy: 'seller', cost: null }; // Seller pays — cost determined on label generation
  }
  return { policy: 'customer_choice', paidBy: 'customer', cost: null }; // Customer pays flat rate
}

const taxService = new TaxService();
const creditNoteService = new CreditNoteService();

export class ReturnService {
  // ─── Step 1: Initiate return request ─────────────────────────────

  async initiateReturn(input: CreateReturnInput): Promise<ReturnRecord> {
    const order = {
      id: input.orderId,
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      country: 'IN' as Country,
      currency: 'INR',
    }; // Mock

    if (order.status !== 'delivered') {
      throw new ValidationError('Returns can only be requested for delivered orders');
    }

    // Check return window (7 days for precious metals; industry standard)
    const deliveryDate = new Date(order.deliveredAt);
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      throw new ValidationError('Return window has expired (7 days)');
    }

    const existing = Array.from(returnStore.values()).find(
      (r) => r.orderId === input.orderId && !['closed', 'cancelled', 'rejected'].includes(r.status)
    );
    if (existing) {
      throw new ValidationError('Active return request already exists for this order');
    }

    const returnId = generateId('ret');
    const shippingPolicy = determineReturnShippingPolicy(input.reason);
    const returnShippingCost = shippingPolicy.paidBy === 'customer'
      ? (RETURN_SHIPPING_RATES[order.country] ?? 350)
      : 0;

    const restockingFeePercent = RESTOCKING_FEES[input.reason] ?? 10;

    const returnRequest: ReturnRecord = {
      id: returnId,
      orderId: input.orderId,
      userId: input.userId,
      items: input.items,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      images: input.images || [],
      preferredResolution: input.preferredResolution,
      status: 'requested',
      country: order.country,
      currency: order.currency,
      restockingFeePercent,
      returnShippingPolicy: shippingPolicy.policy,
      returnShippingPaidBy: shippingPolicy.paidBy,
      returnShippingCost,
      requestedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      returnLabelUrl: null,
      trackingNumber: null,
      refundAmount: null,
      refundedAt: null,
    };

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 2: Approve return ─────────────────────────────────────

  async approveReturn(
    returnId: string,
    approverId: string,
    refundAmount: number
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (returnRequest.status !== 'requested') {
      throw new ValidationError('Return is not in requested state');
    }

    returnRequest.status = 'approved';
    returnRequest.approvedAt = new Date();
    returnRequest.approvedBy = approverId;
    returnRequest.refundAmount = refundAmount;

    // Generate insured return label (precious metals require insurance)
    returnRequest.returnLabelUrl = `https://storage.googleapis.com/grandgold-returns/${returnId}.pdf`;
    returnRequest.trackingNumber = `RET${returnId.slice(-8).toUpperCase()}`;

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 3: Mark item received ─────────────────────────────────

  async receiveReturn(returnId: string, adminId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (!['approved', 'in_transit'].includes(returnRequest.status)) {
      throw new ValidationError('Return must be approved or in transit');
    }

    returnRequest.status = 'received';
    returnRequest.receivedAt = new Date();
    returnRequest.processedBy = adminId;

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 4: QC Inspection ──────────────────────────────────────

  async submitQCInspection(
    returnId: string,
    inspectorId: string,
    qcData: QCInspectionResult
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (returnRequest.status !== 'received') {
      throw new ValidationError('Item must be received before QC inspection');
    }

    // Validate weight tolerance
    qcData.weightVarianceGrams = Math.abs(qcData.returnedWeightGrams - qcData.originalWeightGrams);
    qcData.weightToleranceGrams = QC_WEIGHT_TOLERANCE_GRAMS;
    qcData.weightVerdict = qcData.weightVarianceGrams <= QC_WEIGHT_TOLERANCE_GRAMS ? 'pass' : 'fail';

    // Set inspector details
    qcData.inspectedBy = inspectorId;
    qcData.inspectedAt = new Date().toISOString();

    returnRequest.qcInspection = qcData;

    // Determine QC outcome
    const allPass = qcData.weightVerdict === 'pass'
      && (qcData.purityVerdict === 'pass' || qcData.purityVerdict === 'skipped')
      && (qcData.stonesVerdict === 'pass' || qcData.stonesVerdict === 'na')
      && qcData.itemCondition !== 'tampered';

    if (allPass) {
      returnRequest.status = 'qc_passed';
    } else {
      returnRequest.status = 'qc_failed';
    }

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 5: Resolve — Refund / Exchange / Store Credit / Gold Credit ──

  async resolveReturn(
    returnId: string,
    adminId: string,
    resolution: 'refund' | 'exchange' | 'store_credit' | 'gold_credit',
    options: {
      exchangeProductId?: string;
      currentGoldRate?: number; // per gram, for gold credit calculation
      // For manual override of refund breakdown
      manualRefundAmount?: number;
    } = {}
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');

    // Allow resolution from qc_passed, or qc_failed with admin override
    if (!['qc_passed', 'qc_failed'].includes(returnRequest.status)) {
      throw new ValidationError('QC inspection must be completed before resolution');
    }

    returnRequest.resolution = resolution;
    returnRequest.processedBy = adminId;
    returnRequest.processedAt = new Date();

    // ── Calculate refund breakdown ──────────────────────────────────
    // In production, look up the order item's actual prices from DB.
    // For demo, we use the refundAmount set during approval or mock values.

    const originalPrice = returnRequest.refundAmount || 50000; // mock fallback
    const restockingPercent = returnRequest.restockingFeePercent || 0;
    const restockingFee = Math.round(originalPrice * restockingPercent / 100 * 100) / 100;

    const category = 'gold_jewelry';
    const country = returnRequest.country || 'IN';
    const currency = returnRequest.currency || 'INR';

    const taxCalc = taxService.calculateRefundTax(
      originalPrice - restockingFee,
      restockingFee,
      category,
      country
    );

    const returnShippingDeducted = returnRequest.returnShippingPaidBy === 'customer'
      ? (returnRequest.returnShippingCost as number || 0)
      : 0;

    // Shipping refund: only for seller-fault returns
    const shippingRefund = SELLER_FAULT_REASONS.has(returnRequest.reason) ? 0 : 0;

    const breakdown: RefundBreakdown = {
      metalValue: options.manualRefundAmount ?? originalPrice * 0.7,
      makingCharges: originalPrice * 0.15,
      stoneValue: originalPrice * 0.15,
      subtotal: originalPrice,
      taxReversed: taxCalc.taxReversed,
      shippingRefund,
      restockingFee,
      restockingFeeTax: taxCalc.restockingFeeTax,
      returnShippingDeducted,
      netRefund: taxCalc.netRefundAfterTax - returnShippingDeducted + shippingRefund,
    };

    returnRequest.refundBreakdown = breakdown;

    // ── Resolution-specific logic ───────────────────────────────────

    switch (resolution) {
      case 'refund':
        returnRequest.status = 'refund_processing';
        returnRequest.refundAmount = breakdown.netRefund;
        break;

      case 'exchange':
        if (!options.exchangeProductId) {
          throw new ValidationError('Exchange requires exchangeProductId');
        }
        returnRequest.status = 'exchange_in_progress';
        returnRequest.exchangeProductId = options.exchangeProductId;
        break;

      case 'store_credit':
        returnRequest.status = 'credit_issued';
        returnRequest.refundAmount = breakdown.netRefund;
        break;

      case 'gold_credit': {
        const goldRate = options.currentGoldRate || 6500; // mock: ₹6500/gram
        const creditGrams = Math.round((breakdown.netRefund / goldRate) * 10000) / 10000;
        returnRequest.goldCreditGrams = creditGrams;
        returnRequest.goldRateAtRefund = goldRate;
        breakdown.goldCreditGrams = creditGrams;
        breakdown.goldRateAtRefund = goldRate;

        // Credit the customer's gold wallet
        this.creditGoldWallet(returnRequest.userId, {
          grams: creditGrams,
          goldRate,
          returnRequestId: returnId,
        });

        returnRequest.status = 'credit_issued';
        break;
      }
    }

    // ── Generate tax credit note ────────────────────────────────────

    const creditNote = await creditNoteService.generateCreditNote({
      returnRequestId: returnId,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.orderId, // in prod: look up actual order number
      originalInvoiceNumber: `INV-${returnRequest.orderId}`,
      originalInvoiceDate: returnRequest.requestedAt.toISOString().slice(0, 10),
      country,
      currency,
      resolution,
      customer: { name: 'Customer', email: '', address: {} },
      seller: { name: 'GrandGold Partner', address: {} },
      items: [{
        description: 'Return item',
        quantity: 1,
        unitPrice: breakdown.subtotal,
        taxRate: taxCalc.taxRate,
        goldWeight: returnRequest.qcInspection?.originalWeightGrams,
        purity: returnRequest.qcInspection?.originalPurity,
      }],
      restockingFee: breakdown.restockingFee,
      restockingFeeTax: breakdown.restockingFeeTax,
      shippingRefund: breakdown.shippingRefund,
      goldCreditGrams: breakdown.goldCreditGrams,
      goldRateAtRefund: breakdown.goldRateAtRefund,
      exchangeOrderId: returnRequest.exchangeOrderId,
    });

    returnRequest.taxCreditNote = {
      creditNoteNumber: creditNote.creditNoteNumber,
      creditNoteId: creditNote.id,
    };

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 6: Complete refund ────────────────────────────────────

  async completeRefund(
    returnId: string,
    transactionId: string
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (returnRequest.status !== 'refund_processing') {
      throw new ValidationError('Return is not in refund_processing state');
    }

    returnRequest.status = 'refunded';
    returnRequest.refundedAt = new Date();
    returnRequest.refundTransactionId = transactionId;

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Step 7: Complete exchange ──────────────────────────────────

  async completeExchange(
    returnId: string,
    exchangeOrderId: string,
    priceDifference: number
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (returnRequest.status !== 'exchange_in_progress') {
      throw new ValidationError('Return is not in exchange state');
    }

    returnRequest.status = 'exchanged';
    returnRequest.exchangeOrderId = exchangeOrderId;
    returnRequest.priceDifference = priceDifference;

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Close return ───────────────────────────────────────────────

  async closeReturn(returnId: string, adminId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');

    const closableStatuses = ['refunded', 'exchanged', 'credit_issued'];
    if (!closableStatuses.includes(returnRequest.status)) {
      throw new ValidationError('Return cannot be closed in current state');
    }

    returnRequest.status = 'closed';
    returnRequest.processedBy = adminId;
    returnRequest.processedAt = new Date();

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  // ─── Standard CRUD ─────────────────────────────────────────────

  async getReturn(returnId: string, userId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest || returnRequest.userId !== userId) {
      throw new NotFoundError('Return request');
    }
    return returnRequest;
  }

  /** Admin variant — no userId check */
  async getReturnAdmin(returnId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    return returnRequest;
  }

  async getUserReturns(
    userId: string,
    options: { status?: string; page: number; limit: number }
  ): Promise<{ data: ReturnRecord[]; total: number }> {
    let returns = Array.from(returnStore.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    if (options.status) {
      returns = returns.filter((r) => r.status === options.status);
    }

    const total = returns.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = returns.slice(start, start + options.limit);
    return { data: paginatedData, total };
  }

  async rejectReturn(
    returnId: string,
    approverId: string,
    reason: string
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);
    if (!returnRequest) throw new NotFoundError('Return request');
    if (returnRequest.status !== 'requested') {
      throw new ValidationError('Return is not in requested state');
    }

    returnRequest.status = 'rejected';
    returnRequest.rejectedAt = new Date();
    returnRequest.rejectedBy = approverId;
    returnRequest.rejectionReason = reason;

    returnStore.set(returnId, returnRequest);
    return returnRequest;
  }

  async cancelReturn(returnId: string, userId: string): Promise<void> {
    const returnRequest = await this.getReturn(returnId, userId);
    if (!['requested', 'approved'].includes(returnRequest.status)) {
      throw new ValidationError('Return cannot be cancelled at this stage');
    }
    returnRequest.status = 'cancelled' as string;
    returnRequest.cancelledAt = new Date();
    returnStore.set(returnId, returnRequest);
  }

  // ─── Gold Credit Wallet ────────────────────────────────────────

  private creditGoldWallet(
    userId: string,
    data: { grams: number; goldRate: number; returnRequestId: string }
  ): void {
    let wallet = goldCreditStore.get(userId);
    if (!wallet) {
      wallet = { balanceGrams: 0, transactions: [] };
    }

    wallet.balanceGrams = Math.round((wallet.balanceGrams + data.grams) * 10000) / 10000;
    wallet.transactions.push({
      id: generateId('gctx'),
      type: 'credit',
      grams: data.grams,
      goldRate: data.goldRate,
      amount: Math.round(data.grams * data.goldRate * 100) / 100,
      returnRequestId: data.returnRequestId,
      createdAt: new Date(),
    });

    goldCreditStore.set(userId, wallet);
  }

  /**
   * Get customer's gold credit balance.
   */
  getGoldCreditBalance(userId: string): { balanceGrams: number; transactions: GoldCreditTx[] } {
    return goldCreditStore.get(userId) || { balanceGrams: 0, transactions: [] };
  }
}
