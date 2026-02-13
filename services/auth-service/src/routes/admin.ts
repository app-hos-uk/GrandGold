import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticate, authorize } from '../middleware/auth';
import { ValidationError } from '@grandgold/utils';
import type { UserRole } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager', 'staff'];

// Invite seller schema
const inviteSellerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(5).max(20),
  businessName: z.string().min(1).max(100),
  country: z.enum(['IN', 'AE', 'UK']),
  tempPassword: z.string().optional(),
});

/**
 * GET /api/admin/analytics
 * Get admin dashboard analytics (admin only)
 */
router.get(
  '/analytics',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateRange = (req.query.dateRange as string) || '30days';
      let country = req.query.country as string;

      // Country admins are restricted to their own country
      const isCountryAdmin = req.user?.role === 'country_admin';
      const adminCountry = req.user?.country;
      if (isCountryAdmin && adminCountry) {
        country = adminCountry;
      }

      // In production, these would come from database aggregations
      // filtered by `country` when it's set (country_admin or explicit filter)
      
      // Demo data — scoped to a single country when `country` is set
      const allRevenueByCountry = [
        { country: 'IN', revenue: 2712000 },
        { country: 'AE', revenue: 1130000 },
        { country: 'UK', revenue: 678000 },
      ];
      const allRecentOrders = [
        { id: 'ORD-001', customer: 'Priya Sharma', amount: 85000, status: 'completed', date: '2 min ago', country: 'IN' },
        { id: 'ORD-002', customer: 'Ahmed Khan', amount: 156000, status: 'processing', date: '15 min ago', country: 'AE' },
        { id: 'ORD-003', customer: 'James Wilson', amount: 42000, status: 'shipped', date: '1 hour ago', country: 'UK' },
      ];
      
      const filteredRevenue = country
        ? allRevenueByCountry.filter((r) => r.country === country)
        : allRevenueByCountry;
      const filteredOrders = country
        ? allRecentOrders.filter((o) => o.country === country)
        : allRecentOrders;
      const totalRevenue = filteredRevenue.reduce((sum, r) => sum + r.revenue, 0);

      const analytics = {
        metrics: {
          totalRevenue,
          revenueChange: 12.5,
          ordersChange: 8.2,
        },
        revenue: {
          total: totalRevenue,
          change: 12.5,
        },
        orders: {
          total: country ? Math.round(385 / 3) : 385,
          change: 8.2,
        },
        customers: {
          total: country ? Math.round(1250 / 3) : 1250,
          new: country ? Math.round(87 / 3) : 87,
          change: 15.3,
        },
        avgOrderValue: 11740,
        topProducts: [
          { id: 'p1', name: 'Gold Necklace 22K', sales: 42 },
          { id: 'p2', name: 'Diamond Ring 18K', sales: 35 },
          { id: 'p3', name: 'Pearl Earrings', sales: 28 },
          { id: 'p4', name: 'Gold Bracelet', sales: 24 },
          { id: 'p5', name: 'Silver Chain', sales: 21 },
        ],
        revenueByCountry: filteredRevenue,
        recentOrders: filteredOrders.map(({ country: _c, ...rest }) => rest),
        dateRange,
        country: country || 'all',
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats
 * Get quick stats for admin dashboard
 */
router.get(
  '/stats',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Country admins see only their country's stats
      const isCountryAdmin = req.user?.role === 'country_admin';
      const adminCountry = req.user?.country;
      let country = req.query.country as string | undefined;
      if (isCountryAdmin && adminCountry) {
        country = adminCountry;
      }

      // In production, aggregate from database with country filter
      const stats = country
        ? {
            totalUsers: Math.round(1250 / 3),
            totalOrders: Math.round(385 / 3),
            totalRevenue: Math.round(4520000 / 3),
            pendingOrders: Math.round(24 / 3),
            country,
          }
        : {
            totalUsers: 1250,
            totalOrders: 385,
            totalRevenue: 4520000,
            pendingOrders: 24,
            country: 'all',
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
 * POST /api/admin/invite-seller
 * Invite a new seller (admin only)
 */
router.post(
  '/invite-seller',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = inviteSellerSchema.parse(req.body);

      // Country admins can only invite sellers for their own country
      if (req.user?.role === 'country_admin' && req.user?.country) {
        if (data.country !== req.user.country) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: `You can only invite sellers for ${req.user.country}` },
          });
          return;
        }
      }
      
      // In production, this would:
      // 1. Create the user with seller role in database
      // 2. Send an email invitation with the temp password
      // 3. Create an onboarding entry
      
      // For now, return success with the generated data
      const sellerId = randomUUID();
      
      res.status(201).json({
        success: true,
        data: {
          id: sellerId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
          country: data.country,
          role: 'seller',
          status: 'pending_onboarding',
          onboardingUrl: `/seller/onboarding?token=${randomUUID()}`,
        },
        message: `Invitation sent to ${data.email}. They can complete onboarding at /seller/onboarding`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/admin/invite-influencer
 * Invite a new influencer (admin only)
 */
router.post(
  '/invite-influencer',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, firstName, lastName, country, socialHandles } = req.body;
      
      if (!email || !firstName || !lastName || !country) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email, firstName, lastName, and country are required' },
        });
        return;
      }

      // Country admins can only invite influencers for their own country
      if (req.user?.role === 'country_admin' && req.user?.country) {
        if (country !== req.user.country) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: `You can only invite influencers for ${req.user.country}` },
          });
          return;
        }
      }
      
      // In production, this would create the user and send email
      const influencerId = randomUUID();
      
      res.status(201).json({
        success: true,
        data: {
          id: influencerId,
          email,
          firstName,
          lastName,
          country,
          role: 'influencer',
          socialHandles: socialHandles || {},
          status: 'pending_onboarding',
        },
        message: `Invitation sent to ${email}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as adminRouter };
