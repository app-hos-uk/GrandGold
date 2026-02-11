import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@grandgold/utils';
import {
  InventoryService,
  InventoryCSVMapper,
  ERPBridge,
  InventoryForecasting,
  type InventoryAdminItem,
} from '../services/inventory.service';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:4007';

const router = Router();
const inventoryService = new InventoryService();
const ADMIN_ROLES = ['super_admin', 'country_admin', 'manager'];
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
 * Fetch products from product-service and map to inventory items.
 * Used when Redis has no stock records so admin still sees all products with catalog stock.
 */
async function getInventoryFromProducts(
  authHeader: string | undefined,
  params: { page: number; limit: number; status?: string; country?: string; search?: string }
): Promise<{ items: InventoryAdminItem[]; total: number }> {
  if (!authHeader) return { items: [], total: 0 };
  try {
    const url = `${PRODUCT_SERVICE_URL}/api/search/admin?limit=${params.limit}&page=${params.page}`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], total: 0 };
    const json = await res.json();
    const productList = json?.data?.data ?? json?.data ?? [];
    const products = Array.isArray(productList) ? productList : [];

    const reorderPoint = 5;
    const items: InventoryAdminItem[] = products.map((p: { id: string; name?: string; category?: string; sku?: string; stock?: number; countries?: string[]; updatedAt?: string }) => {
      const quantity = typeof p.stock === 'number' ? p.stock : 0;
      const available = quantity;
      let status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved' = 'in_stock';
      if (quantity === 0) status = 'out_of_stock';
      else if (available <= reorderPoint) status = 'low_stock';
      const country = (p.countries && p.countries[0]) || 'IN';
      const location = country === 'IN' ? 'Mumbai Warehouse' : country === 'AE' ? 'Dubai Warehouse' : country === 'UK' ? 'London Warehouse' : 'Main Warehouse';
      return {
        id: p.id,
        productId: p.id,
        sku: p.sku || p.id,
        productName: p.name || `Product ${p.id}`,
        category: p.category || 'Jewelry',
        location,
        quantity,
        reserved: 0,
        available,
        reorderPoint,
        status,
        lastUpdated: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt).toISOString()) : new Date().toISOString(),
        country,
      };
    });

    let filtered = items;
    if (params.country) {
      filtered = filtered.filter((i) => i.country === params.country);
    }
    if (params.status) {
      filtered = filtered.filter((i) => i.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    const totalFromApi = typeof json?.data?.total === 'number' ? json.data.total : products.length;
    return { items: filtered, total: totalFromApi };
  } catch {
    return { items: [], total: 0 };
  }
}

/**
 * GET /api/inventory/admin
 * List all inventory items (admin only).
 * When Redis has no stock records, derives list from product-service so admin sees all products.
 */
router.get(
  '/admin',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const country = req.query.country as string;
      const search = req.query.search as string;

      let result = await inventoryService.listAllInventory({
        page,
        limit,
        status,
        country,
        search,
      });

      if (result.total === 0) {
        const authHeader = req.headers.authorization;
        result = await getInventoryFromProducts(authHeader, {
          page,
          limit,
          status,
          country,
          search,
        });
      }

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
