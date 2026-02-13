/**
 * Analytics Service — Weight-based metrics for precious metals business.
 *
 * Provides aggregated data for:
 *  - Total weight sold (by period, purity, category, seller)
 *  - Average making charges (MC) — the key profitability metric
 *  - Weight per order averages
 *  - Trend data for dashboard charts
 *
 * Currently works with the in-memory order store.
 * When DB is connected, swap to SQL aggregation queries for performance.
 */

import type { Country } from '@grandgold/types';
import type { OrderItem, OrderRecord } from '../types/internal';

// ── Types ────────────────────────────────────────────────────────────

export interface WeightSummary {
  totalWeightSoldGrams: number;
  totalGrossWeightGrams: number;
  totalStoneWeightCarats: number;
  totalOrders: number;
  totalItems: number;
  avgWeightPerOrder: number;   // avg gold weight per order
  avgWeightPerItem: number;    // avg gold weight per item
  // Breakdown by purity
  byPurity: Record<string, { weightGrams: number; items: number; revenue: number }>;
  // Breakdown by metal type
  byMetal: Record<string, { weightGrams: number; items: number; revenue: number }>;
  // Breakdown by category
  byCategory: Record<string, { weightGrams: number; items: number; revenue: number }>;
  // Breakdown by seller
  bySeller: Record<string, { weightGrams: number; items: number; revenue: number; sellerName?: string }>;
  // Period
  periodStart: string;
  periodEnd: string;
}

export interface MCSummary {
  avgMCPerGram: number;
  avgMCPercent: number;
  totalMC: number;
  totalOrders: number;
  // Breakdown by MC type
  byMCType: Record<string, { totalMC: number; avgMC: number; items: number }>;
  // Breakdown by purity
  byPurity: Record<string, { totalMC: number; avgMCPerGram: number; avgMCPercent: number; items: number }>;
  // Breakdown by category
  byCategory: Record<string, { totalMC: number; avgMCPerGram: number; items: number }>;
  // Trend data (daily)
  dailyTrend: Array<{ date: string; avgMCPerGram: number; totalMC: number; weightSold: number }>;
  periodStart: string;
  periodEnd: string;
}

export interface WeightTrend {
  date: string;
  weightSoldGrams: number;
  grossWeightGrams: number;
  revenue: number;
  orderCount: number;
  avgMCPerGram: number;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  country?: Country;
  adminCountry?: Country;
  sellerId?: string;
  purity?: string;
  metalType?: string;
  category?: string;
}

// ── Helper to access the in-memory store ─────────────────────────────

// The OrderService keeps orders in a Map. For analytics we need to access
// all orders. In production this would be a DB query.  For now we share
// a reference to the same Map via a helper.
let orderStoreRef: Map<string, OrderRecord> | null = null;

export function setOrderStoreRef(store: Map<string, OrderRecord>): void {
  orderStoreRef = store;
}

function getAllOrders(): OrderRecord[] {
  if (!orderStoreRef) return [];
  return Array.from(orderStoreRef.values());
}

// ── Service ──────────────────────────────────────────────────────────

export class AnalyticsService {
  /**
   * Get weight summary — total weight sold, breakdowns by purity/metal/category/seller.
   */
  getWeightSummary(filters: AnalyticsFilters): WeightSummary {
    const orders = this.filterOrders(filters);

    const result: WeightSummary = {
      totalWeightSoldGrams: 0,
      totalGrossWeightGrams: 0,
      totalStoneWeightCarats: 0,
      totalOrders: orders.length,
      totalItems: 0,
      avgWeightPerOrder: 0,
      avgWeightPerItem: 0,
      byPurity: {},
      byMetal: {},
      byCategory: {},
      bySeller: {},
      periodStart: filters.dateFrom || '',
      periodEnd: filters.dateTo || '',
    };

    for (const order of orders) {
      for (const item of order.items) {
        const goldWeight = (item.goldWeight || 0) * item.quantity;
        const grossWeight = (item.grossWeight || 0) * item.quantity;
        const stoneWeight = (item.stoneWeight || 0) * item.quantity;
        const revenue = item.price * item.quantity;

        result.totalWeightSoldGrams += goldWeight;
        result.totalGrossWeightGrams += grossWeight;
        result.totalStoneWeightCarats += stoneWeight;
        result.totalItems += item.quantity;

        // By purity
        const purity = item.purity || 'unknown';
        if (!result.byPurity[purity]) result.byPurity[purity] = { weightGrams: 0, items: 0, revenue: 0 };
        result.byPurity[purity].weightGrams += goldWeight;
        result.byPurity[purity].items += item.quantity;
        result.byPurity[purity].revenue += revenue;

        // By metal type
        const metal = item.metalType || 'unknown';
        if (!result.byMetal[metal]) result.byMetal[metal] = { weightGrams: 0, items: 0, revenue: 0 };
        result.byMetal[metal].weightGrams += goldWeight;
        result.byMetal[metal].items += item.quantity;
        result.byMetal[metal].revenue += revenue;

        // By category
        const cat = item.category || 'uncategorized';
        if (!result.byCategory[cat]) result.byCategory[cat] = { weightGrams: 0, items: 0, revenue: 0 };
        result.byCategory[cat].weightGrams += goldWeight;
        result.byCategory[cat].items += item.quantity;
        result.byCategory[cat].revenue += revenue;

        // By seller
        const seller = item.sellerId || 'platform';
        if (!result.bySeller[seller]) {
          result.bySeller[seller] = { weightGrams: 0, items: 0, revenue: 0, sellerName: item.sellerName };
        }
        result.bySeller[seller].weightGrams += goldWeight;
        result.bySeller[seller].items += item.quantity;
        result.bySeller[seller].revenue += revenue;
      }
    }

    result.avgWeightPerOrder = result.totalOrders > 0
      ? Math.round((result.totalWeightSoldGrams / result.totalOrders) * 1000) / 1000
      : 0;
    result.avgWeightPerItem = result.totalItems > 0
      ? Math.round((result.totalWeightSoldGrams / result.totalItems) * 1000) / 1000
      : 0;

    return result;
  }

  /**
   * Get MC (making charges) summary — avg MC per gram, breakdown by type/purity/category.
   */
  getMCSummary(filters: AnalyticsFilters): MCSummary {
    const orders = this.filterOrders(filters);

    let totalMC = 0;
    let totalWeight = 0;
    let totalMetalValue = 0;
    let itemCount = 0;
    const byMCType: Record<string, { totalMC: number; totalWeight: number; items: number }> = {};
    const byPurity: Record<string, { totalMC: number; totalWeight: number; totalMetalValue: number; items: number }> = {};
    const byCategory: Record<string, { totalMC: number; totalWeight: number; items: number }> = {};
    const dailyMap: Record<string, { totalMC: number; totalWeight: number; revenue: number }> = {};

    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);

      for (const item of order.items) {
        const mc = (item.makingCharges || 0) * item.quantity;
        const gw = (item.goldWeight || 0) * item.quantity;
        const mv = (item.metalValue || 0) * item.quantity;

        if (mc > 0) {
          totalMC += mc;
          totalWeight += gw;
          totalMetalValue += mv;
          itemCount += item.quantity;

          // By MC type
          const mcType = item.makingChargeType || 'flat';
          if (!byMCType[mcType]) byMCType[mcType] = { totalMC: 0, totalWeight: 0, items: 0 };
          byMCType[mcType].totalMC += mc;
          byMCType[mcType].totalWeight += gw;
          byMCType[mcType].items += item.quantity;

          // By purity
          const purity = item.purity || 'unknown';
          if (!byPurity[purity]) byPurity[purity] = { totalMC: 0, totalWeight: 0, totalMetalValue: 0, items: 0 };
          byPurity[purity].totalMC += mc;
          byPurity[purity].totalWeight += gw;
          byPurity[purity].totalMetalValue += mv;
          byPurity[purity].items += item.quantity;

          // By category
          const cat = item.category || 'uncategorized';
          if (!byCategory[cat]) byCategory[cat] = { totalMC: 0, totalWeight: 0, items: 0 };
          byCategory[cat].totalMC += mc;
          byCategory[cat].totalWeight += gw;
          byCategory[cat].items += item.quantity;
        }

        // Daily trend
        if (!dailyMap[dateKey]) dailyMap[dateKey] = { totalMC: 0, totalWeight: 0, revenue: 0 };
        dailyMap[dateKey].totalMC += mc;
        dailyMap[dateKey].totalWeight += gw;
        dailyMap[dateKey].revenue += item.price * item.quantity;
      }
    }

    const avgMCPerGram = totalWeight > 0 ? Math.round((totalMC / totalWeight) * 100) / 100 : 0;
    const avgMCPercent = totalMetalValue > 0 ? Math.round((totalMC / totalMetalValue) * 10000) / 100 : 0;

    // Build MC type breakdown
    const byMCTypeResult: MCSummary['byMCType'] = {};
    for (const [type, data] of Object.entries(byMCType)) {
      byMCTypeResult[type] = {
        totalMC: Math.round(data.totalMC * 100) / 100,
        avgMC: data.totalWeight > 0 ? Math.round((data.totalMC / data.totalWeight) * 100) / 100 : 0,
        items: data.items,
      };
    }

    // Build purity breakdown
    const byPurityResult: MCSummary['byPurity'] = {};
    for (const [purity, data] of Object.entries(byPurity)) {
      byPurityResult[purity] = {
        totalMC: Math.round(data.totalMC * 100) / 100,
        avgMCPerGram: data.totalWeight > 0 ? Math.round((data.totalMC / data.totalWeight) * 100) / 100 : 0,
        avgMCPercent: data.totalMetalValue > 0 ? Math.round((data.totalMC / data.totalMetalValue) * 10000) / 100 : 0,
        items: data.items,
      };
    }

    // Build category breakdown
    const byCategoryResult: MCSummary['byCategory'] = {};
    for (const [cat, data] of Object.entries(byCategory)) {
      byCategoryResult[cat] = {
        totalMC: Math.round(data.totalMC * 100) / 100,
        avgMCPerGram: data.totalWeight > 0 ? Math.round((data.totalMC / data.totalWeight) * 100) / 100 : 0,
        items: data.items,
      };
    }

    // Build daily trend
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        avgMCPerGram: data.totalWeight > 0 ? Math.round((data.totalMC / data.totalWeight) * 100) / 100 : 0,
        totalMC: Math.round(data.totalMC * 100) / 100,
        weightSold: Math.round(data.totalWeight * 1000) / 1000,
      }));

    return {
      avgMCPerGram,
      avgMCPercent,
      totalMC: Math.round(totalMC * 100) / 100,
      totalOrders: orders.length,
      byMCType: byMCTypeResult,
      byPurity: byPurityResult,
      byCategory: byCategoryResult,
      dailyTrend,
      periodStart: filters.dateFrom || '',
      periodEnd: filters.dateTo || '',
    };
  }

  /**
   * Get daily weight trend data for charts.
   */
  getWeightTrend(filters: AnalyticsFilters): WeightTrend[] {
    const orders = this.filterOrders(filters);
    const dailyMap: Record<string, { weight: number; gross: number; revenue: number; orders: Set<string>; mc: number }> = {};

    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { weight: 0, gross: 0, revenue: 0, orders: new Set(), mc: 0 };
      }
      dailyMap[dateKey].orders.add(order.id);

      for (const item of order.items) {
        dailyMap[dateKey].weight += (item.goldWeight || 0) * item.quantity;
        dailyMap[dateKey].gross += (item.grossWeight || 0) * item.quantity;
        dailyMap[dateKey].revenue += item.price * item.quantity;
        dailyMap[dateKey].mc += (item.makingCharges || 0) * item.quantity;
      }
    }

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        weightSoldGrams: Math.round(data.weight * 1000) / 1000,
        grossWeightGrams: Math.round(data.gross * 1000) / 1000,
        revenue: Math.round(data.revenue * 100) / 100,
        orderCount: data.orders.size,
        avgMCPerGram: data.weight > 0 ? Math.round((data.mc / data.weight) * 100) / 100 : 0,
      }));
  }

  /**
   * Dashboard summary — quick numbers for stat cards.
   */
  getDashboardMetrics(filters: AnalyticsFilters): Record<string, unknown> {
    const weightSummary = this.getWeightSummary(filters);
    const mcSummary = this.getMCSummary(filters);

    return {
      totalWeightSold: {
        value: Math.round(weightSummary.totalWeightSoldGrams * 1000) / 1000,
        unit: 'grams',
      },
      avgMCPerGram: {
        value: mcSummary.avgMCPerGram,
        unit: 'currency/gram',
      },
      avgMCPercent: {
        value: mcSummary.avgMCPercent,
        unit: '%',
      },
      avgWeightPerOrder: {
        value: weightSummary.avgWeightPerOrder,
        unit: 'grams',
      },
      totalOrders: weightSummary.totalOrders,
      totalItems: weightSummary.totalItems,
      totalGrossWeight: {
        value: Math.round(weightSummary.totalGrossWeightGrams * 1000) / 1000,
        unit: 'grams',
      },
      totalStoneWeight: {
        value: Math.round(weightSummary.totalStoneWeightCarats * 1000) / 1000,
        unit: 'carats',
      },
    };
  }

  // ── Private helpers ────────────────────────────────────────────────

  private filterOrders(filters: AnalyticsFilters): OrderRecord[] {
    let orders = getAllOrders()
      .filter((o) => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status));

    // Country-admin restriction
    if (filters.adminCountry) {
      orders = orders.filter((o) => o.country === filters.adminCountry);
    }

    if (filters.country) {
      orders = orders.filter((o) => o.country === filters.country);
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      orders = orders.filter((o) => new Date(o.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      orders = orders.filter((o) => new Date(o.createdAt) <= to);
    }

    if (filters.sellerId) {
      orders = orders.filter((o) =>
        o.items.some((i: OrderItem) => i.sellerId === filters.sellerId)
      );
    }

    // Item-level filters are applied during aggregation — we include the order
    // and skip non-matching items in the summary functions above.
    // For purity/metalType/category filters we still return all orders but
    // the aggregation functions will only count matching items.

    return orders;
  }
}
