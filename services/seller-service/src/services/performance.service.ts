import { NotFoundError } from '@grandgold/utils';

// In-memory store for demo
const performanceStore = new Map<string, any>();

interface PerformanceMetrics {
  sellerId: string;
  period: string;
  revenue: {
    total: number;
    change: number; // percentage
    trend: 'up' | 'down' | 'stable';
  };
  orders: {
    total: number;
    change: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  ratings: {
    average: number;
    total: number;
    change: number;
  };
  responseRate: number;
  responseTime: number; // hours
  onTimeDeliveryRate: number;
  cancellationRate: number;
  returnRate: number;
  topProducts: { productId: string; name: string; sales: number; revenue: number }[];
  benchmarks: {
    revenue: { percentile: number; rank: string };
    ratings: { percentile: number; rank: string };
    delivery: { percentile: number; rank: string };
  };
  goals: {
    revenue: { target: number; current: number; progress: number };
    orders: { target: number; current: number; progress: number };
    rating: { target: number; current: number; progress: number };
  };
}

export class PerformanceService {
  /**
   * Get seller performance metrics
   */
  async getPerformanceMetrics(
    sellerId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<PerformanceMetrics> {
    // In production, calculate from actual data
    const metrics: PerformanceMetrics = {
      sellerId,
      period,
      revenue: {
        total: 1250000,
        change: 12.5,
        trend: 'up',
      },
      orders: {
        total: 45,
        change: 8.3,
        averageOrderValue: 27778,
        conversionRate: 3.2,
      },
      ratings: {
        average: 4.5,
        total: 28,
        change: 0.2,
      },
      responseRate: 95,
      responseTime: 2.5,
      onTimeDeliveryRate: 98,
      cancellationRate: 0.5,
      returnRate: 1.2,
      topProducts: [
        { productId: 'prd_1', name: '22K Gold Necklace', sales: 12, revenue: 540000 },
        { productId: 'prd_2', name: 'Diamond Ring', sales: 8, revenue: 320000 },
        { productId: 'prd_3', name: 'Gold Earrings', sales: 6, revenue: 180000 },
      ],
      benchmarks: {
        revenue: { percentile: 75, rank: 'Gold' },
        ratings: { percentile: 85, rank: 'Platinum' },
        delivery: { percentile: 90, rank: 'Platinum' },
      },
      goals: {
        revenue: { target: 2000000, current: 1250000, progress: 62.5 },
        orders: { target: 60, current: 45, progress: 75 },
        rating: { target: 4.8, current: 4.5, progress: 93.75 },
      },
    };

    performanceStore.set(`${sellerId}_${period}`, metrics);

    return metrics;
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    sellerId: string,
    metric: 'revenue' | 'orders' | 'ratings',
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{ date: string; value: number }[]> {
    // Generate trend data
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let value: number;
      switch (metric) {
        case 'revenue':
          value = Math.floor(Math.random() * 100000) + 20000;
          break;
        case 'orders':
          value = Math.floor(Math.random() * 5) + 1;
          break;
        case 'ratings':
          value = Math.round((Math.random() * 1 + 4) * 10) / 10;
          break;
      }

      trends.push({
        date: date.toISOString().split('T')[0],
        value,
      });
    }

    return trends;
  }

  /**
   * Get seller tier/rank
   */
  async getSellerTier(sellerId: string): Promise<{
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    rank: number;
    totalSellers: number;
    nextTier: string;
    requirements: Record<string, number>;
  }> {
    // Calculate tier based on performance
    const metrics = await this.getPerformanceMetrics(sellerId, 'month');

    let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    let nextTier = 'silver';
    let requirements: Record<string, number> = {};

    if (metrics.revenue.total >= 5000000 && metrics.ratings.average >= 4.8) {
      tier = 'platinum';
      nextTier = 'platinum';
      requirements = { revenue: 10000000, rating: 4.9 };
    } else if (metrics.revenue.total >= 2000000 && metrics.ratings.average >= 4.5) {
      tier = 'gold';
      nextTier = 'platinum';
      requirements = { revenue: 5000000, rating: 4.8 };
    } else if (metrics.revenue.total >= 500000 && metrics.ratings.average >= 4.0) {
      tier = 'silver';
      nextTier = 'gold';
      requirements = { revenue: 2000000, rating: 4.5 };
    } else {
      tier = 'bronze';
      nextTier = 'silver';
      requirements = { revenue: 500000, rating: 4.0 };
    }

    return {
      tier,
      rank: 125, // In production, calculate from all sellers
      totalSellers: 500,
      nextTier,
      requirements,
    };
  }

  /**
   * Get competitor comparison
   */
  async getCompetitorComparison(sellerId: string): Promise<{
    seller: { metric: string; value: number }[];
    average: { metric: string; value: number }[];
    top10: { metric: string; value: number }[];
  }> {
    const metrics = await this.getPerformanceMetrics(sellerId, 'month');

    return {
      seller: [
        { metric: 'Revenue', value: metrics.revenue.total },
        { metric: 'Orders', value: metrics.orders.total },
        { metric: 'Rating', value: metrics.ratings.average },
        { metric: 'Response Rate', value: metrics.responseRate },
        { metric: 'On-Time Delivery', value: metrics.onTimeDeliveryRate },
      ],
      average: [
        { metric: 'Revenue', value: 800000 },
        { metric: 'Orders', value: 30 },
        { metric: 'Rating', value: 4.2 },
        { metric: 'Response Rate', value: 85 },
        { metric: 'On-Time Delivery', value: 92 },
      ],
      top10: [
        { metric: 'Revenue', value: 5000000 },
        { metric: 'Orders', value: 100 },
        { metric: 'Rating', value: 4.9 },
        { metric: 'Response Rate', value: 98 },
        { metric: 'On-Time Delivery', value: 99 },
      ],
    };
  }
}
