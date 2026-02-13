/**
 * Influencer Margin Routes
 *
 * Admin CRUD for managing influencer margin structures (combined & split models).
 * Also exposes payout history.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { InfluencerMarginService } from '../services/influencer-margin.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const marginService = new InfluencerMarginService();

// ── Schemas ──────────────────────────────────────────────────────────

const createMarginSchema = z.object({
  influencerId: z.string().min(1),
  name: z.string().min(1).max(100),
  code: z.string().max(30).optional(),
  marginModel: z.enum(['combined', 'split']),
  combinedMarginPercent: z.number().min(0).max(100).optional(),
  metalMarginPercent: z.number().min(0).max(100).optional(),
  stoneMarginPercent: z.number().min(0).max(100).optional(),
  mcMarginPercent: z.number().min(0).max(100).optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableMetalTypes: z.array(z.string()).optional(),
  minOrderWeight: z.number().min(0).optional(),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const updateMarginSchema = createMarginSchema.partial().omit({ influencerId: true });

// ── Routes ───────────────────────────────────────────────────────────

/**
 * POST /api/influencer-margins
 * Create a new influencer margin structure (Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createMarginSchema.parse(req.body);
      const margin = await marginService.createMargin({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      });

      res.status(201).json({
        success: true,
        data: margin,
        message: 'Influencer margin created',
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
 * GET /api/influencer-margins
 * List all influencer margins (Admin)
 */
router.get(
  '/',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const result = await marginService.listMargins({
        page,
        limit,
        isActive,
        country: req.query.country as 'IN' | 'AE' | 'UK' | undefined,
        influencerId: req.query.influencerId as string | undefined,
      });

      res.json({ success: true, data: result.data, total: result.total });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-margins/:id
 * Get margin details (Admin)
 */
router.get(
  '/:id',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const margin = await marginService.getMargin(req.params.id);
      res.json({ success: true, data: margin });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/influencer-margins/:id
 * Update margin (Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateMarginSchema.parse(req.body);
      const margin = await marginService.updateMargin(req.params.id, {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      });

      res.json({ success: true, data: margin, message: 'Margin updated' });
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
 * DELETE /api/influencer-margins/:id
 * Deactivate margin (soft delete) (Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await marginService.deactivateMargin(req.params.id);
      res.json({ success: true, message: 'Margin deactivated' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-margins/:id/payouts
 * Get payout history for an influencer margin (Admin)
 */
router.get(
  '/:id/payouts',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payouts = await marginService.getPayouts(req.params.id);
      res.json({ success: true, data: payouts });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-margins/simulate
 * Simulate payout calculation for testing (Admin)
 */
router.post(
  '/simulate',
  authenticate,
  authorize('super_admin', 'country_admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { marginId, metalValue, stoneValue, mcValue, orderTotal, goldWeight } = req.body;

      const margin = await marginService.getMargin(marginId);
      const payout = marginService.calculatePayout(margin, {
        orderId: 'simulation',
        metalValue: metalValue || 0,
        stoneValue: stoneValue || 0,
        mcValue: mcValue || 0,
        orderTotal: orderTotal || 0,
        goldWeight: goldWeight || 0,
      });

      res.json({ success: true, data: payout });
    } catch (error) {
      next(error);
    }
  }
);

export const influencerMarginRouter = router;
