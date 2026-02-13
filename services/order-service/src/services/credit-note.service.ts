/**
 * Credit Note Service — Generates tax credit notes for returns and exchanges.
 *
 * A credit note is a legal tax document issued when:
 *  1. Full refund is processed
 *  2. Partial refund (restocking fee deducted)
 *  3. Exchange — credit note for returned item + new invoice for exchange item
 *
 * Supports GST (India), VAT (UAE/UK) credit note formats.
 */

import { generateId } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

// In-memory store for demo
const creditNoteStore = new Map<string, CreditNoteRecord>();

// ── Types ────────────────────────────────────────────────────────────

export interface CreditNoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  taxRate: number;
  taxAmount: number;
  totalValue: number;
  // Weight details for precious metals audit trail
  goldWeight?: number;
  purity?: string;
  metalType?: string;
  makingCharges?: number;
  stoneValue?: number;
}

export interface CreditNoteRecord {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: Date;

  // References
  returnRequestId: string;
  orderId: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;

  // Parties
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

  // Items
  items: CreditNoteItem[];

  // Totals
  subtotal: number;
  taxReversed: number;
  restockingFee: number;
  restockingFeeTax: number;
  shippingRefund: number;
  totalCredited: number;
  currency: string;

  // Tax details
  taxType: string;    // 'GST' | 'VAT'
  country: Country;

  // Exchange reference (if this credit note is part of an exchange)
  exchangeInvoiceNumber?: string;
  exchangeOrderId?: string;

  // Resolution
  resolution: 'refund' | 'exchange' | 'store_credit' | 'gold_credit';
  goldCreditGrams?: number;
  goldRateAtRefund?: number;

  // PDF
  pdfUrl?: string;

  createdAt: Date;
}

interface GenerateCreditNoteInput {
  returnRequestId: string;
  orderId: string;
  orderNumber: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  country: Country;
  currency: string;
  resolution: 'refund' | 'exchange' | 'store_credit' | 'gold_credit';

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

  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    goldWeight?: number;
    purity?: string;
    metalType?: string;
    makingCharges?: number;
    stoneValue?: number;
  }>;

  restockingFee: number;
  restockingFeeTax: number;
  shippingRefund: number;

  // Gold credit specific
  goldCreditGrams?: number;
  goldRateAtRefund?: number;

  // Exchange reference
  exchangeInvoiceNumber?: string;
  exchangeOrderId?: string;
}

// ── Service ──────────────────────────────────────────────────────────

export class CreditNoteService {
  /**
   * Generate a tax credit note for a return/exchange.
   */
  async generateCreditNote(input: GenerateCreditNoteInput): Promise<CreditNoteRecord> {
    const creditNoteId = generateId('cn');
    const creditNoteNumber = this.generateCreditNoteNumber(input.country, input.orderNumber);

    const taxNames: Record<Country, string> = {
      IN: 'GST',
      AE: 'VAT',
      UK: 'VAT',
    };

    // Build line items with tax calculations
    const items: CreditNoteItem[] = input.items.map((item) => {
      const taxableValue = Math.round(item.unitPrice * item.quantity * 100) / 100;
      const taxAmount = Math.round((taxableValue * item.taxRate) / 100 * 100) / 100;
      const totalValue = Math.round((taxableValue + taxAmount) * 100) / 100;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxableValue,
        taxRate: item.taxRate,
        taxAmount,
        totalValue,
        goldWeight: item.goldWeight,
        purity: item.purity,
        metalType: item.metalType,
        makingCharges: item.makingCharges,
        stoneValue: item.stoneValue,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.taxableValue, 0);
    const taxReversed = items.reduce((s, i) => s + i.taxAmount, 0);
    const totalCredited = Math.round(
      (subtotal + taxReversed - input.restockingFee - input.restockingFeeTax + input.shippingRefund) * 100
    ) / 100;

    const creditNote: CreditNoteRecord = {
      id: creditNoteId,
      creditNoteNumber,
      creditNoteDate: new Date(),
      returnRequestId: input.returnRequestId,
      orderId: input.orderId,
      originalInvoiceNumber: input.originalInvoiceNumber,
      originalInvoiceDate: input.originalInvoiceDate,
      customer: input.customer,
      seller: input.seller,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxReversed: Math.round(taxReversed * 100) / 100,
      restockingFee: input.restockingFee,
      restockingFeeTax: input.restockingFeeTax,
      shippingRefund: input.shippingRefund,
      totalCredited,
      currency: input.currency,
      taxType: taxNames[input.country] || 'Tax',
      country: input.country,
      exchangeInvoiceNumber: input.exchangeInvoiceNumber,
      exchangeOrderId: input.exchangeOrderId,
      resolution: input.resolution,
      goldCreditGrams: input.goldCreditGrams,
      goldRateAtRefund: input.goldRateAtRefund,
      createdAt: new Date(),
    };

    // Generate PDF (mock for now)
    creditNote.pdfUrl = `https://storage.googleapis.com/grandgold-credit-notes/${creditNoteId}.pdf`;

    creditNoteStore.set(creditNoteId, creditNote);

    return creditNote;
  }

  /**
   * Get credit note by ID.
   */
  async getCreditNote(creditNoteId: string): Promise<CreditNoteRecord | null> {
    return creditNoteStore.get(creditNoteId) || null;
  }

  /**
   * Get credit notes for a return request.
   */
  async getCreditNotesByReturn(returnRequestId: string): Promise<CreditNoteRecord[]> {
    return Array.from(creditNoteStore.values())
      .filter((cn) => cn.returnRequestId === returnRequestId);
  }

  /**
   * Get credit notes for an order.
   */
  async getCreditNotesByOrder(orderId: string): Promise<CreditNoteRecord[]> {
    return Array.from(creditNoteStore.values())
      .filter((cn) => cn.orderId === orderId);
  }

  // ── Private helpers ────────────────────────────────────────────────

  private generateCreditNoteNumber(country: Country, _orderNumber: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CN-${country}-${dateStr}-${seq}`;
  }
}
