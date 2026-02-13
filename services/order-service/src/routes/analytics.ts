/**
 * Analytics routes — Weight-based metrics & MC (Making Charges) reports.
 *
 * All endpoints require admin authentication.
 * Country admins see only their country's data; super_admin sees global data.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate, authorize } from '../middleware/auth';
import type { Country } from '@grandgold/types';
import type { AnalyticsFilters } from '../services/analytics.service';

const router = Router();
const analyticsService = new AnalyticsService();

function buildFilters(req: Request): AnalyticsFilters {
  return {
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    country: req.query.country as Country | undefined,
    adminCountry: req.user?.role === 'super_admin' ? undefined : req.user?.country,
    sellerId: req.query.sellerId as string | undefined,
    purity: req.query.purity as string | undefined,
    metalType: req.query.metalType as string | undefined,
    category: req.query.category as string | undefined,
  };
}

/**
 * GET /api/analytics/dashboard
 * Quick dashboard stat cards (totalWeightSold, avgMC, avgWeightPerOrder)
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = buildFilters(req);
      const metrics = analyticsService.getDashboardMetrics(filters);
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/analytics/weight-summary
 * Detailed weight sold breakdown by purity, metal, category, seller
 */
router.get(
  '/weight-summary',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = buildFilters(req);
      const summary = analyticsService.getWeightSummary(filters);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/analytics/mc-summary
 * Making charges summary — avg MC/gram, breakdown by type/purity/category, daily trend
 */
router.get(
  '/mc-summary',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = buildFilters(req);
      const summary = analyticsService.getMCSummary(filters);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/analytics/weight-trend
 * Daily weight & revenue trend for charts
 */
router.get(
  '/weight-trend',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = buildFilters(req);
      const trend = analyticsService.getWeightTrend(filters);
      res.json({ success: true, data: trend });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/analytics/weight-report/csv
 * Download weight report as CSV
 */
router.get(
  '/weight-report/csv',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = buildFilters(req);
      const summary = analyticsService.getWeightSummary(filters);

      // Build CSV
      const rows: string[] = [];
      rows.push('Category,Purity,Metal Type,Weight (g),Items,Revenue');

      // Flatten purity breakdown
      for (const [purity, data] of Object.entries(summary.byPurity)) {
        rows.push(`All,${purity},All,${data.weightGrams.toFixed(3)},${data.items},${data.revenue.toFixed(2)}`);
      }

      // Flatten category breakdown
      for (const [cat, data] of Object.entries(summary.byCategory)) {
        rows.push(`${cat},All,All,${data.weightGrams.toFixed(3)},${data.items},${data.revenue.toFixed(2)}`);
      }

      // Flatten metal type breakdown
      for (const [metal, data] of Object.entries(summary.byMetal)) {
        rows.push(`All,All,${metal},${data.weightGrams.toFixed(3)},${data.items},${data.revenue.toFixed(2)}`);
      }

      const csv = rows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="weight-report-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

export const analyticsRouter = router;
