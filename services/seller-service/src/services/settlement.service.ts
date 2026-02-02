import { generateId, NotFoundError } from '@grandgold/utils';
import {
  createSettlement,
  getSettlementById,
  getSettlementsBySeller,
  getAllSettlementOrderIds,
  updateSettlementStatus,
  getSellerIdByUserId,
} from '@grandgold/database';
import {
  getOrdersEligibleForSettlement,
  type DeliveredOrderForSettlement,
} from '@grandgold/database';

const COMMISSION_RATE = 0.1; // 10%
const GATEWAY_FEE_RATE = 0.02; // 2%
const TAX_RATE = 0.03; // 3% GST approximation

export class SettlementService {
  /**
   * Get seller's settlements (userId = logged-in user, maps to sellerId)
   */
  async getSellerSettlements(
    userId: string,
    options: { status?: string; page: number; limit: number }
  ): Promise<{ data: unknown[]; total: number }> {
    const sellerId = await getSellerIdByUserId(userId);
    if (!sellerId) {
      return { data: [], total: 0 };
    }

    const offset = (options.page - 1) * options.limit;
    return getSettlementsBySeller(sellerId, {
      status: options.status,
      limit: options.limit,
      offset,
    });
  }

  /**
   * Get settlement by ID (verify seller ownership via userId)
   */
  async getSettlement(settlementId: string, userId: string): Promise<unknown> {
    const sellerId = await getSellerIdByUserId(userId);
    if (!sellerId) throw new NotFoundError('Settlement');

    const settlement = await getSettlementById(settlementId);
    if (!settlement || settlement.sellerId !== sellerId) {
      throw new NotFoundError('Settlement');
    }
    return settlement;
  }

  /**
   * Get finance ledger
   */
  async getFinanceLedger(
    userId: string,
    _options: { startDate?: string; endDate?: string }
  ): Promise<{
    entries: unknown[];
    summary: { totalCredits: number; totalDebits: number; balance: number };
  }> {
    const sellerId = await getSellerIdByUserId(userId);
    if (!sellerId) {
      return { entries: [], summary: { totalCredits: 0, totalDebits: 0, balance: 0 } };
    }

    const { data: settlements } = await getSettlementsBySeller(sellerId, {
      limit: 50,
      offset: 0,
    });

    const entries: unknown[] = [];
    let totalCredits = 0;
    let totalDebits = 0;

    for (const s of settlements) {
      const gross = Number(s.grossAmount);
      const net = Number(s.netAmount);
      totalCredits += gross;
      totalDebits += gross - net;
      entries.push({
        id: s.id,
        date: s.createdAt,
        type: 'credit',
        description: 'Settlement batch',
        orderIds: s.orderIds,
        amount: gross,
      });
      entries.push({
        id: `${s.id}_debit`,
        date: s.paidAt ?? s.updatedAt,
        type: 'debit',
        description: 'Settlement payout',
        settlementId: s.id,
        amount: -(gross - net),
      });
    }

    return {
      entries,
      summary: {
        totalCredits,
        totalDebits,
        balance: totalCredits - totalDebits,
      },
    };
  }

  /**
   * Get settlement breakdown
   */
  async getSettlementBreakdown(
    settlementId: string,
    userId: string
  ): Promise<{
    grossAmount: number;
    deductions: { name: string; amount: number; percentage?: number }[];
    netAmount: number;
  }> {
    const settlement = (await this.getSettlement(settlementId, userId)) as {
      grossAmount: string;
      commission: string;
      gatewayFees: string;
      taxes: string;
      otherDeductions: string;
      netAmount: string;
    };

    const grossAmount = Number(settlement.grossAmount);
    const commission = Number(settlement.commission);
    const gatewayFees = Number(settlement.gatewayFees);
    const taxes = Number(settlement.taxes);
    const otherDeductions = Number(settlement.otherDeductions);
    const netAmount = Number(settlement.netAmount);

    return {
      grossAmount,
      deductions: [
        { name: 'Platform Commission', amount: commission, percentage: COMMISSION_RATE * 100 },
        { name: 'Payment Gateway Fees', amount: gatewayFees, percentage: GATEWAY_FEE_RATE * 100 },
        { name: 'Taxes', amount: taxes },
        { name: 'Other Deductions', amount: otherDeductions },
      ],
      netAmount,
    };
  }

  /**
   * Get orders in settlement
   */
  async getSettlementOrders(settlementId: string, userId: string): Promise<unknown[]> {
    const settlement = (await this.getSettlement(settlementId, userId)) as {
      orderIds: string[];
      grossAmount: string;
      commission: string;
      gatewayFees: string;
      netAmount: string;
      orderCount: number;
    };

    const orderIds = (settlement.orderIds as string[]) || [];
    const gross = Number(settlement.grossAmount);
    const commission = Number(settlement.commission);
    const gatewayFees = Number(settlement.gatewayFees);
    const net = Number(settlement.netAmount);

    const perOrder = orderIds.length > 0 ? gross / orderIds.length : 0;
    const commissionPerOrder = orderIds.length > 0 ? commission / orderIds.length : 0;
    const gatewayPerOrder = orderIds.length > 0 ? gatewayFees / orderIds.length : 0;
    const netPerOrder = orderIds.length > 0 ? net / orderIds.length : 0;

    return orderIds.map((id) => ({
      id,
      amount: Math.round(perOrder * 100) / 100,
      commission: Math.round(commissionPerOrder * 100) / 100,
      gatewayFee: Math.round(gatewayPerOrder * 100) / 100,
      netAmount: Math.round(netPerOrder * 100) / 100,
    }));
  }

  /**
   * Get pending (unsettled) amount
   */
  async getPendingAmount(userId: string): Promise<{
    pendingAmount: number;
    ordersCount: number;
    nextSettlementDate: Date;
  }> {
    const sellerId = await getSellerIdByUserId(userId);
    if (!sellerId) {
      return { pendingAmount: 0, ordersCount: 0, nextSettlementDate: new Date() };
    }

    const excludedIds = await getAllSettlementOrderIds();
    const eligible = await getOrdersEligibleForSettlement(excludedIds);
    const forSeller = eligible.filter((o) => o.sellerId === sellerId);

    const gross = forSeller.reduce((sum, o) => sum + Number(o.total), 0);
    const commission = gross * COMMISSION_RATE;
    const gatewayFees = gross * GATEWAY_FEE_RATE;
    const taxes = gross * TAX_RATE;
    const pendingAmount = Math.round((gross - commission - gatewayFees - taxes) * 100) / 100;

    const nextSettlement = new Date();
    nextSettlement.setDate(nextSettlement.getDate() + 7);

    return {
      pendingAmount,
      ordersCount: forSeller.length,
      nextSettlementDate: nextSettlement,
    };
  }

  /**
   * Generate settlement invoice
   */
  async generateInvoice(settlementId: string, userId: string): Promise<{
    invoiceNumber: string;
    invoiceUrl: string;
  }> {
    await this.getSettlement(settlementId, userId);

    const invoiceNumber = `INV-${settlementId.slice(-8).toUpperCase()}`;
    const invoiceUrl = `https://storage.googleapis.com/grandgold-invoices/${settlementId}.pdf`;

    return { invoiceNumber, invoiceUrl };
  }

  /**
   * Process pending settlements (Admin/Cron job).
   * Finds delivered orders not yet settled, groups by seller, creates settlement records.
   */
  async processSettlements(): Promise<{ count: number; totalAmount: number }> {
    const excludedOrderIds = await getAllSettlementOrderIds();
    const eligible = await getOrdersEligibleForSettlement(excludedOrderIds);

    if (eligible.length === 0) {
      return { count: 0, totalAmount: 0 };
    }

    const bySeller = new Map<string, DeliveredOrderForSettlement[]>();
    for (const o of eligible) {
      const list = bySeller.get(o.sellerId) ?? [];
      list.push(o);
      bySeller.set(o.sellerId, list);
    }

    let totalAmount = 0;
    const now = new Date();
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 7);

    for (const [sellerId, orders] of bySeller) {
      const orderIds = orders.map((o) => o.id);
      const gross = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const commission = Math.round(gross * COMMISSION_RATE * 100) / 100;
      const gatewayFees = Math.round(gross * GATEWAY_FEE_RATE * 100) / 100;
      const taxes = Math.round(gross * TAX_RATE * 100) / 100;
      const netAmount = Math.round((gross - commission - gatewayFees - taxes) * 100) / 100;

      await createSettlement({
        id: generateId('set'),
        sellerId,
        periodStart,
        periodEnd,
        grossAmount: String(gross),
        commission: String(commission),
        gatewayFees: String(gatewayFees),
        taxes: String(taxes),
        otherDeductions: '0',
        netAmount: String(netAmount),
        status: 'pending',
        orderCount: orders.length,
        orderIds,
        currency: orders[0]?.currency ?? 'INR',
      });

      totalAmount += netAmount;
    }

    return { count: bySeller.size, totalAmount };
  }

  /**
   * Mark settlement as paid (Admin)
   */
  async markAsPaid(
    settlementId: string,
    _adminUserId: string,
    details: { paymentReference: string; paymentMethod: string }
  ): Promise<void> {
    const settlement = await getSettlementById(settlementId);
    if (!settlement) throw new NotFoundError('Settlement');

    await updateSettlementStatus(settlementId, 'completed', {
      paymentReference: details.paymentReference,
      paymentMethod: details.paymentMethod,
      paidAt: new Date(),
    });
  }
}
