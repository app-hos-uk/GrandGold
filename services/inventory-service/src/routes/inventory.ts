import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import {
  InventoryService,
  InventoryCSVMapper,
  ERPBridge,
  InventoryForecasting,
} from '../services/inventory.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const inventoryService = new InventoryService();
const csvMapper = new InventoryCSVMapper();
const erpBridge = new ERPBridge();
const forecasting = new InventoryForecasting();

const updateStockSchema = z.object({
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  poolType: z.enum(['physical', 'virtual', 'made_to_order']).optional(),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).optional(),
});

const reserveSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  cartId: z.string().min(1),
});

/**
 * GET /api/inventory/product/:productId
 * Get stock for product
 */
router.get(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stock = await inventoryService.getStock(req.params.productId);
      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/inventory/product/:productId/available
 * Get available quantity
 */
router.get(
  '/product/:productId/available',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quantity = await inventoryService.getAvailableQuantity(
        req.params.productId
      );
      res.json({
        success: true,
        data: { available: quantity },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/inventory/product/:productId
 * Update stock (seller only)
 */
router.put(
  '/product/:productId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const data = updateStockSchema.parse(req.body);
      const sellerId = req.user.sub;

      const stock = await inventoryService.updateStock(
        req.params.productId,
        sellerId,
        data
      );

      res.json({
        success: true,
        data: stock,
        message: 'Stock updated',
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
 * POST /api/inventory/reserve
 * Reserve stock for checkout
 */
router.post(
  '/reserve',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, quantity, cartId } = reserveSchema.parse(req.body);
      const userId = req.user?.sub;

      const reservation = await inventoryService.reserveStock(
        productId,
        quantity,
        cartId,
        userId
      );

      res.json({
        success: true,
        data: reservation,
        message: 'Stock reserved for 15 minutes',
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
 * DELETE /api/inventory/reserve/:reservationId
 * Release reservation
 */
router.delete(
  '/reserve/:reservationId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await inventoryService.releaseReservation(req.params.reservationId);
      res.json({
        success: true,
        message: 'Reservation released',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/inventory/alerts
 * Get low stock alerts (seller only)
 */
router.get(
  '/alerts',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('User not authenticated');

      const alerts = await inventoryService.getLowStockAlerts(req.user.sub);
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/inventory/csv/map
 * Auto-detect CSV column mapping
 */
router.post(
  '/csv/map',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { headers } = req.body;
      const mapping = csvMapper.detectMapping(headers || []);
      res.json({ success: true, data: { mapping } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/inventory/erp/sync
 * Sync inventory from ERP
 */
router.post(
  '/erp/sync',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { provider } = req.body;
      const result = await erpBridge.syncFromERP(
        provider || 'tally',
        req.user.sub
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/inventory/product/:productId/forecast
 * Get inventory forecast
 */
router.get(
  '/product/:productId/forecast',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const horizonDays = parseInt(req.query.days as string) || 30;
      const forecast = await forecasting.getForecast(
        req.params.productId,
        horizonDays
      );
      res.json({ success: true, data: forecast });
    } catch (error) {
      next(error);
    }
  }
);

export { router as inventoryRouter };
