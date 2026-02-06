import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticate, authorize } from '../middleware/auth';
import { ValidationError } from '@grandgold/utils';
import type { UserRole } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager'];

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
      const country = req.query.country as string;

      // In production, these would come from database aggregations
      // For now, return demo data that the dashboard can display
      const analytics = {
        metrics: {
          totalRevenue: 4520000,
          revenueChange: 12.5,
          ordersChange: 8.2,
        },
        revenue: {
          total: 4520000,
          change: 12.5,
        },
        orders: {
          total: 385,
          change: 8.2,
        },
        customers: {
          total: 1250,
          new: 87,
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
        revenueByCountry: [
          { country: 'IN', revenue: 2712000 },
          { country: 'AE', revenue: 1130000 },
          { country: 'UK', revenue: 678000 },
        ],
        recentOrders: [
          { id: 'ORD-001', customer: 'Priya Sharma', amount: 85000, status: 'completed', date: '2 min ago' },
          { id: 'ORD-002', customer: 'Ahmed Khan', amount: 156000, status: 'processing', date: '15 min ago' },
          { id: 'ORD-003', customer: 'James Wilson', amount: 42000, status: 'shipped', date: '1 hour ago' },
        ],
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
      // In production, aggregate from database
      const stats = {
        totalUsers: 1250,
        totalOrders: 385,
        totalRevenue: 4520000,
        pendingOrders: 24,
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
      
      // Generate a temporary password if not provided
      // Password generated for email invitation in production
      // const tempPassword = data.tempPassword || `Seller${randomUUID().slice(0, 8)}!`;
      
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
      
      // Generate a temporary password if not provided
      // Password generated for email invitation in production
      // const password = tempPassword || `Influencer${randomUUID().slice(0, 8)}!`;
      
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
