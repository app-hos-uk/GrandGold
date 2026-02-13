/**
 * Influencer Margin Service
 *
 * Manages influencer/affiliate commission structures for precious metals:
 *
 * **Combined Model**: A single margin % applied to the full order value.
 * **Split Model**: Separate margin %s for metal value, stone value, and making charges.
 *
 * Split model is common in the jewelry industry because:
 *  - Metal margins are thin (1-3%) since gold price is market-driven
 *  - Stone margins can be higher (5-15%) since there's more markup
 *  - MC margins are negotiable (3-8%) since MC varies by craftsmanship
 */

import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

// ── Types ────────────────────────────────────────────────────────────

export type MarginModel = 'combined' | 'split';

export interface InfluencerMarginRecord {
  id: string;
  influencerId: string;
  name: string;
  code?: string; // referral code

  marginModel: MarginModel;

  // Combined
  combinedMarginPercent?: number;

  // Split
  metalMarginPercent?: number;
  stoneMarginPercent?: number;
  mcMarginPercent?: number;

  // Scope
  applicableCategories?: string[];
  applicableMetalTypes?: string[];
  minOrderWeight?: number; // in grams

  // Validity
  countries?: Country[];
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;

  // Performance
  totalOrders: number;
  totalWeightSold: number;
  totalEarnings: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutCalculation {
  influencerMarginId: string;
  orderId: string;
  orderItemId?: string;
  marginModel: MarginModel;

  // Order breakdown
  metalValue: number;
  stoneValue: number;
  mcValue: number;
  orderTotal: number;

  // Payout breakdown
  metalPayout: number;
  stonePayout: number;
  mcPayout: number;
  totalPayout: number;
}

// ── In-memory store ──────────────────────────────────────────────────

const marginStore = new Map<string, InfluencerMarginRecord>();
const payoutStore = new Map<string, PayoutCalculation[]>();

// ── Service ──────────────────────────────────────────────────────────

export class InfluencerMarginService {
  // ─── CRUD ──────────────────────────────────────────────────────

  async createMargin(data: {
    influencerId: string;
    name: string;
    code?: string;
    marginModel: MarginModel;
    combinedMarginPercent?: number;
    metalMarginPercent?: number;
    stoneMarginPercent?: number;
    mcMarginPercent?: number;
    applicableCategories?: string[];
    applicableMetalTypes?: string[];
    minOrderWeight?: number;
    countries?: Country[];
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<InfluencerMarginRecord> {
    // Validate margin model
    if (data.marginModel === 'combined' && !data.combinedMarginPercent) {
      throw new ValidationError('Combined model requires combinedMarginPercent');
    }
    if (data.marginModel === 'split') {
      if (!data.metalMarginPercent && !data.stoneMarginPercent && !data.mcMarginPercent) {
        throw new ValidationError('Split model requires at least one of metalMarginPercent, stoneMarginPercent, or mcMarginPercent');
      }
    }

    // Check code uniqueness
    if (data.code) {
      const existing = Array.from(marginStore.values()).find(
        (m) => m.code === data.code
      );
      if (existing) throw new ValidationError(`Referral code "${data.code}" is already in use`);
    }

    const id = generateId('im');
    const record: InfluencerMarginRecord = {
      id,
      influencerId: data.influencerId,
      name: data.name,
      code: data.code,
      marginModel: data.marginModel,
      combinedMarginPercent: data.combinedMarginPercent,
      metalMarginPercent: data.metalMarginPercent,
      stoneMarginPercent: data.stoneMarginPercent,
      mcMarginPercent: data.mcMarginPercent,
      applicableCategories: data.applicableCategories,
      applicableMetalTypes: data.applicableMetalTypes,
      minOrderWeight: data.minOrderWeight,
      countries: data.countries ?? ['IN', 'AE', 'UK'],
      isActive: true,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      totalOrders: 0,
      totalWeightSold: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    marginStore.set(id, record);
    return record;
  }

  async getMargin(id: string): Promise<InfluencerMarginRecord> {
    const record = marginStore.get(id);
    if (!record) throw new NotFoundError('Influencer margin');
    return record;
  }

  async getMarginByCode(code: string): Promise<InfluencerMarginRecord | null> {
    return Array.from(marginStore.values()).find(
      (m) => m.code === code && m.isActive
    ) || null;
  }

  async listMargins(filters: {
    page: number;
    limit: number;
    isActive?: boolean;
    country?: Country;
    influencerId?: string;
  }): Promise<{ data: InfluencerMarginRecord[]; total: number }> {
    let records = Array.from(marginStore.values());

    if (filters.isActive !== undefined) {
      records = records.filter((r) => r.isActive === filters.isActive);
    }
    if (filters.country) {
      records = records.filter((r) => r.countries?.includes(filters.country!));
    }
    if (filters.influencerId) {
      records = records.filter((r) => r.influencerId === filters.influencerId);
    }

    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = records.length;
    const start = (filters.page - 1) * filters.limit;
    const data = records.slice(start, start + filters.limit);

    return { data, total };
  }

  async updateMargin(
    id: string,
    data: Partial<Omit<InfluencerMarginRecord, 'id' | 'createdAt' | 'totalOrders' | 'totalWeightSold' | 'totalEarnings'>>
  ): Promise<InfluencerMarginRecord> {
    const record = marginStore.get(id);
    if (!record) throw new NotFoundError('Influencer margin');

    Object.assign(record, { ...data, updatedAt: new Date() });
    marginStore.set(id, record);
    return record;
  }

  async deactivateMargin(id: string): Promise<void> {
    const record = marginStore.get(id);
    if (!record) throw new NotFoundError('Influencer margin');
    record.isActive = false;
    record.updatedAt = new Date();
    marginStore.set(id, record);
  }

  // ─── Payout Calculation ────────────────────────────────────────

  /**
   * Calculate the influencer payout for an order item.
   *
   * In combined model: payout = orderTotal * combinedMarginPercent / 100
   * In split model:    payout = (metalValue * metalMargin/100) + (stoneValue * stoneMargin/100) + (mcValue * mcMargin/100)
   */
  calculatePayout(
    margin: InfluencerMarginRecord,
    orderItem: {
      orderId: string;
      orderItemId?: string;
      metalValue: number;
      stoneValue: number;
      mcValue: number;
      orderTotal: number;
      goldWeight?: number;
      metalType?: string;
      category?: string;
    }
  ): PayoutCalculation {
    // Check applicability
    if (margin.minOrderWeight && (orderItem.goldWeight || 0) < margin.minOrderWeight) {
      // Below minimum weight — zero payout
      return {
        influencerMarginId: margin.id,
        orderId: orderItem.orderId,
        orderItemId: orderItem.orderItemId,
        marginModel: margin.marginModel,
        metalValue: orderItem.metalValue,
        stoneValue: orderItem.stoneValue,
        mcValue: orderItem.mcValue,
        orderTotal: orderItem.orderTotal,
        metalPayout: 0,
        stonePayout: 0,
        mcPayout: 0,
        totalPayout: 0,
      };
    }

    let metalPayout = 0;
    let stonePayout = 0;
    let mcPayout = 0;
    let totalPayout = 0;

    if (margin.marginModel === 'combined') {
      totalPayout = Math.round(
        orderItem.orderTotal * (margin.combinedMarginPercent || 0) / 100 * 100
      ) / 100;
    } else {
      metalPayout = Math.round(
        orderItem.metalValue * (margin.metalMarginPercent || 0) / 100 * 100
      ) / 100;
      stonePayout = Math.round(
        orderItem.stoneValue * (margin.stoneMarginPercent || 0) / 100 * 100
      ) / 100;
      mcPayout = Math.round(
        orderItem.mcValue * (margin.mcMarginPercent || 0) / 100 * 100
      ) / 100;
      totalPayout = Math.round((metalPayout + stonePayout + mcPayout) * 100) / 100;
    }

    return {
      influencerMarginId: margin.id,
      orderId: orderItem.orderId,
      orderItemId: orderItem.orderItemId,
      marginModel: margin.marginModel,
      metalValue: orderItem.metalValue,
      stoneValue: orderItem.stoneValue,
      mcValue: orderItem.mcValue,
      orderTotal: orderItem.orderTotal,
      metalPayout,
      stonePayout,
      mcPayout,
      totalPayout,
    };
  }

  /**
   * Record a payout for an order (called after checkout confirmation).
   */
  async recordPayout(
    payout: PayoutCalculation
  ): Promise<void> {
    const existing = payoutStore.get(payout.influencerMarginId) || [];
    existing.push(payout);
    payoutStore.set(payout.influencerMarginId, existing);

    // Update margin performance counters
    const margin = marginStore.get(payout.influencerMarginId);
    if (margin) {
      margin.totalOrders += 1;
      margin.totalEarnings = Math.round((margin.totalEarnings + payout.totalPayout) * 100) / 100;
      margin.updatedAt = new Date();
      marginStore.set(margin.id, margin);
    }
  }

  /**
   * Get payout history for an influencer margin.
   */
  async getPayouts(marginId: string): Promise<PayoutCalculation[]> {
    return payoutStore.get(marginId) || [];
  }
}
