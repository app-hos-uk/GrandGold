import { NotFoundError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import { PerformanceService } from './performance.service';

// In-memory store for demo (use database in production)
const sellerStore = new Map<string, any>();

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  sales: {
    period: string;
    data: { date: string; revenue: number; orders: number }[];
  };
  recentOrders: any[];
  topProducts: any[];
  alerts: { type: string; message: string }[];
}

interface PerformanceMetrics {
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: number;
  onTimeDeliveryRate: number;
  cancellationRate: number;
  returnRate: number;
  tier: string;
  previousPeriod: {
    revenueChange: number;
    ordersChange: number;
    ratingChange: number;
  };
}

const performanceService = new PerformanceService();

export class SellerService {
  /**
   * Get seller by user ID
   */
  async getSellerByUserId(userId: string): Promise<any> {
    const seller = Array.from(sellerStore.values()).find(
      (s) => s.userId === userId
    );

    if (!seller) {
      throw new NotFoundError('Seller');
    }

    return seller;
  }

  /**
   * Get seller by ID
   */
  async getSellerById(sellerId: string): Promise<any> {
    const seller = sellerStore.get(sellerId);

    if (!seller) {
      throw new NotFoundError('Seller');
    }

    return seller;
  }

  /**
   * Update seller profile
   */
  async updateSeller(userId: string, updates: any): Promise<any> {
    const seller = await this.getSellerByUserId(userId);

    // Update allowed fields
    const allowedFields = [
      'businessName',
      'phone',
      'website',
      'storeName',
      'storeDescription',
      'storeLogo',
      'storeBanner',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        seller[field] = updates[field];
      }
    }

    seller.updatedAt = new Date();
    sellerStore.set(seller.id, seller);

    return seller;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(userId: string, period: string): Promise<DashboardData> {
    const seller = await this.getSellerByUserId(userId);

    // Mock dashboard data
    return {
      overview: {
        totalRevenue: 1250000,
        totalOrders: 45,
        averageOrderValue: 27778,
        conversionRate: 3.2,
      },
      sales: {
        period,
        data: this.generateSalesData(period),
      },
      recentOrders: [
        { id: 'ord_1', total: 45000, status: 'processing', createdAt: new Date() },
        { id: 'ord_2', total: 32000, status: 'shipped', createdAt: new Date() },
      ],
      topProducts: [
        { id: 'prd_1', name: '22K Gold Necklace', sales: 12, revenue: 540000 },
        { id: 'prd_2', name: 'Diamond Ring', sales: 8, revenue: 320000 },
      ],
      alerts: [
        { type: 'warning', message: '3 products are low on stock' },
        { type: 'info', message: 'Settlement of ₹85,000 processed' },
      ],
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId: string, period: string): Promise<any> {
    const seller = await this.getSellerByUserId(userId);
    
    // Use performance service for detailed metrics
    const metrics = await performanceService.getPerformanceMetrics(seller.id, period as any);
    
    return {
      ...metrics,
      tier: seller.tier || 'gold',
      previousPeriod: {
        revenueChange: metrics.revenue.change,
        ordersChange: metrics.orders.change,
        ratingChange: metrics.ratings.change,
      },
    };
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(userId: string, period: string): Promise<any> {
    const seller = await this.getSellerByUserId(userId);
    
    const [metrics, tier, comparison] = await Promise.all([
      performanceService.getPerformanceMetrics(seller.id, period as any),
      performanceService.getSellerTier(seller.id),
      performanceService.getCompetitorComparison(seller.id),
    ]);

    return {
      metrics,
      tier,
      comparison,
      trends: {
        revenue: await performanceService.getPerformanceTrends(seller.id, 'revenue', period as any),
        orders: await performanceService.getPerformanceTrends(seller.id, 'orders', period as any),
        ratings: await performanceService.getPerformanceTrends(seller.id, 'ratings', period as any),
      },
    };
  }

  /**
   * Get seller orders
   */
  async getSellerOrders(
    userId: string,
    options: { status?: string; page: number; limit: number }
  ): Promise<{ data: any[]; total: number }> {
    // Mock orders
    const orders = [
      {
        id: 'ord_1',
        orderNumber: 'GG-IN-20250201-000001',
        total: 45000,
        status: 'processing',
        items: 2,
        createdAt: new Date(),
      },
      {
        id: 'ord_2',
        orderNumber: 'GG-IN-20250201-000002',
        total: 32000,
        status: 'shipped',
        items: 1,
        createdAt: new Date(),
      },
    ];

    let filtered = orders;
    if (options.status) {
      filtered = orders.filter((o) => o.status === options.status);
    }

    return {
      data: filtered,
      total: filtered.length,
    };
  }

  /**
   * Get seller reviews
   */
  async getSellerReviews(
    userId: string,
    options: { page: number; limit: number }
  ): Promise<{ data: any[]; total: number; averageRating: number }> {
    // Mock reviews
    const reviews = [
      {
        id: 'rev_1',
        rating: 5,
        title: 'Excellent quality',
        content: 'Beautiful necklace, exactly as described.',
        customerName: 'A****a',
        createdAt: new Date(),
      },
      {
        id: 'rev_2',
        rating: 4,
        title: 'Good product',
        content: 'Nice ring, delivery was a bit slow.',
        customerName: 'R****j',
        createdAt: new Date(),
      },
    ];

    return {
      data: reviews,
      total: reviews.length,
      averageRating: 4.5,
    };
  }

  /**
   * Update seller settings
   */
  async updateSettings(userId: string, settings: any): Promise<any> {
    const seller = await this.getSellerByUserId(userId);

    seller.settings = {
      ...seller.settings,
      ...settings,
    };
    seller.updatedAt = new Date();

    sellerStore.set(seller.id, seller);

    return seller.settings;
  }

  /**
   * List sellers (Admin)
   */
  async listSellers(options: {
    country?: string;
    status?: string;
    tier?: string;
    page: number;
    limit: number;
    adminCountry: Country;
  }): Promise<{ data: any[]; total: number }> {
    let sellers = Array.from(sellerStore.values());

    if (options.country) {
      sellers = sellers.filter((s) => s.country === options.country);
    }
    if (options.status) {
      sellers = sellers.filter((s) => s.status === options.status);
    }
    if (options.tier) {
      sellers = sellers.filter((s) => s.tier === options.tier);
    }

    const total = sellers.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = sellers.slice(start, start + options.limit);

    return {
      data: paginatedData,
      total,
    };
  }

  /**
   * Suspend seller
   */
  async suspendSeller(sellerId: string, adminUserId: string, reason: string): Promise<void> {
    const seller = await this.getSellerById(sellerId);

    seller.status = 'suspended';
    seller.suspendedBy = adminUserId;
    seller.suspendedAt = new Date();
    seller.suspensionReason = reason;
    seller.updatedAt = new Date();

    sellerStore.set(sellerId, seller);
  }

  /**
   * Activate seller
   */
  async activateSeller(sellerId: string, adminUserId: string): Promise<void> {
    const seller = await this.getSellerById(sellerId);

    seller.status = 'approved';
    seller.activatedBy = adminUserId;
    seller.activatedAt = new Date();
    seller.suspendedBy = null;
    seller.suspendedAt = null;
    seller.suspensionReason = null;
    seller.updatedAt = new Date();

    sellerStore.set(sellerId, seller);
  }

  private generateSalesData(period: string): { date: string; revenue: number; orders: number }[] {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 100000) + 10000,
        orders: Math.floor(Math.random() * 10) + 1,
      });
    }

    return data;
  }
}
