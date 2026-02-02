import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { PriceAlertService } from '../services/price-alert.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const priceAlertService = new PriceAlertService();

// Price alert schema
const createAlertSchema = z.object({
  targetPrice: z.number().positive(),
  direction: z.enum(['above', 'below']),
  purity: z.enum(['24K', '22K', '21K', '18K', '14K', '10K']),
  country: z.enum(['IN', 'AE', 'UK']),
  notificationChannels: z.array(z.enum(['email', 'push', 'whatsapp'])).min(1),
});

/**
 * POST /api/alerts
 * Create a price alert
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAlertSchema.parse(req.body);
    
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const alert = await priceAlertService.createAlert({
      userId: req.user.sub,
      ...data,
    });
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Price alert created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/alerts
 * Get user's price alerts
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const alerts = await priceAlertService.getUserAlerts(req.user.sub);
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/:id
 * Get alert details
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const alert = await priceAlertService.getAlert(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/alerts/:id
 * Update a price alert
 */
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const alert = await priceAlertService.updateAlert(req.params.id, req.user.sub, req.body);
    
    res.json({
      success: true,
      data: alert,
      message: 'Price alert updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete a price alert
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await priceAlertService.deleteAlert(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Price alert deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/:id/enable
 * Enable a price alert
 */
router.post('/:id/enable', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await priceAlertService.enableAlert(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Price alert enabled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/:id/disable
 * Disable a price alert
 */
router.post('/:id/disable', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await priceAlertService.disableAlert(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Price alert disabled',
    });
  } catch (error) {
    next(error);
  }
});

export { router as alertRouter };
