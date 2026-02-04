import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import type { UserRole } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager'];

/**
 * GET /api/payments/admin/stats
 * Get finance dashboard statistics
 */
router.get(
  '/stats',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateRange = (req.query.dateRange as string) || '30days';
      const country = req.query.country as string;

      // In production, these would come from database aggregations
      // For now, return realistic placeholder data
      const stats = {
        totalRevenue: 45200000,
        revenueChange: 12.5,
        totalTransactions: 3847,
        transactionsChange: 8.2,
        pendingPayouts: 2850000,
        pendingPayoutsCount: 24,
        totalCommission: 4520000,
        commissionChange: 15.3,
        avgTransactionValue: 11750,
        refundsProcessed: 156,
        refundAmount: 1820000,
        platformBalance: 8750000,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/admin/transactions
 * Get transaction history for admin
 */
router.get(
  '/transactions',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const type = req.query.type as string;
      const status = req.query.status as string;
      const country = req.query.country as string;

      // In production, query from database
      const transactions = [
        { id: 'TXN001', type: 'payment', amount: 85000, status: 'completed', description: 'Order #ORD-2024-1234', date: new Date().toISOString(), country: 'IN', orderId: 'ORD-2024-1234' },
        { id: 'TXN002', type: 'commission', amount: 8500, status: 'completed', description: 'Commission from Royal Jewellers', date: new Date(Date.now() - 900000).toISOString(), country: 'IN', sellerId: 'seller-001' },
        { id: 'TXN003', type: 'payout', amount: 125000, status: 'pending', description: 'Payout to Diamond Palace', date: new Date(Date.now() - 3600000).toISOString(), country: 'IN', sellerId: 'seller-002' },
        { id: 'TXN004', type: 'refund', amount: 42000, status: 'completed', description: 'Refund for Order #ORD-2024-1198', date: new Date(Date.now() - 7200000).toISOString(), country: 'AE', orderId: 'ORD-2024-1198' },
        { id: 'TXN005', type: 'payment', amount: 156000, status: 'completed', description: 'Order #ORD-2024-1233', date: new Date(Date.now() - 10800000).toISOString(), country: 'UK', orderId: 'ORD-2024-1233' },
      ];

      let filtered = transactions;
      if (type) {
        filtered = filtered.filter((t) => t.type === type);
      }
      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }
      if (country) {
        filtered = filtered.filter((t) => t.country === country);
      }

      res.json({
        success: true,
        data: filtered,
        total: filtered.length,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/admin/settlements
 * Get pending and completed settlements
 */
router.get(
  '/settlements',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const status = req.query.status as string;

      // In production, query from database
      const settlements = [
        { id: 'SET001', sellerName: 'Royal Jewellers', sellerId: 'seller-001', amount: 485000, ordersCount: 42, periodStart: '2024-01-28', periodEnd: '2024-02-03', status: 'ready' },
        { id: 'SET002', sellerName: 'Diamond Palace', sellerId: 'seller-002', amount: 325000, ordersCount: 28, periodStart: '2024-01-28', periodEnd: '2024-02-03', status: 'ready' },
        { id: 'SET003', sellerName: 'Gold Craft India', sellerId: 'seller-003', amount: 198000, ordersCount: 15, periodStart: '2024-01-28', periodEnd: '2024-02-03', status: 'processing' },
        { id: 'SET004', sellerName: 'Heritage Jewels', sellerId: 'seller-004', amount: 156000, ordersCount: 12, periodStart: '2024-01-21', periodEnd: '2024-01-27', status: 'on_hold' },
        { id: 'SET005', sellerName: 'Modern Gold', sellerId: 'seller-005', amount: 245000, ordersCount: 18, periodStart: '2024-01-21', periodEnd: '2024-01-27', status: 'completed' },
      ];

      let filtered = settlements;
      if (status) {
        filtered = filtered.filter((s) => s.status === status);
      }

      res.json({
        success: true,
        data: filtered,
        total: filtered.length,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/admin/settlements/:id/process
 * Process a settlement (initiate payout)
 */
router.post(
  '/settlements/:id/process',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // In production:
      // 1. Verify settlement exists and is in 'ready' status
      // 2. Call payment gateway to initiate bank transfer
      // 3. Update settlement status to 'processing'
      // 4. Create audit log

      res.json({
        success: true,
        message: `Settlement ${id} is being processed`,
        data: { status: 'processing' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/admin/commissions
 * Get commission breakdown
 */
router.get(
  '/commissions',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateRange = (req.query.dateRange as string) || '30days';

      const commissions = {
        total: 4520000,
        byCategory: [
          { category: 'Necklaces', amount: 1356000, percentage: 30 },
          { category: 'Rings', amount: 904000, percentage: 20 },
          { category: 'Earrings', amount: 678000, percentage: 15 },
          { category: 'Bangles', amount: 565000, percentage: 12.5 },
          { category: 'Other', amount: 1017000, percentage: 22.5 },
        ],
        bySeller: [
          { sellerId: 'seller-001', sellerName: 'Royal Jewellers', amount: 452000, ordersCount: 42 },
          { sellerId: 'seller-002', sellerName: 'Diamond Palace', amount: 384200, ordersCount: 35 },
          { sellerId: 'seller-003', sellerName: 'Gold Craft India', amount: 316400, ordersCount: 28 },
        ],
      };

      res.json({
        success: true,
        data: commissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as adminFinanceRouter };
