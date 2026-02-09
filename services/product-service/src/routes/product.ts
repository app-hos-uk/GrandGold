import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ProductService } from '../services/product.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

// Create product schema
// Accepts both frontend field names (basePrice, stockQuantity, etc.) and
// canonical backend names (price, stock) so the admin form and seller form both work.
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]),
  // Accept both "price" and "basePrice"
  price: z.number().positive().optional(),
  basePrice: z.number().positive().optional(),
  currency: z.string().optional(),
  // Accept 'fixed' | 'dynamic' | 'live_rate'
  pricingModel: z.enum(['fixed', 'dynamic', 'live_rate']).optional().default('fixed'),
  goldWeight: z.number().positive().optional(),
  purity: z.enum(['24K', '22K', '21K', '18K', '14K', '10K']).optional(),
  metalType: z.string().optional(),
  stones: z.array(z.object({
    type: z.string(),
    weight: z.number().positive(),
    count: z.number().int().positive(),
  })).optional(),
  laborCost: z.number().positive().optional(),
  sku: z.string().optional().default(''),
  slug: z.string().optional(),
  // Accept both "stock" and "stockQuantity"
  stock: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).min(1),
  arEnabled: z.boolean().optional().default(false),
  video360: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/products
 * Create product
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const raw = createProductSchema.parse(req.body);

    // Normalise frontend field names → canonical backend names
    const sellerId = req.user.sub;
    const price = raw.price ?? raw.basePrice;
    const stock = raw.stock ?? raw.stockQuantity ?? 0;
    const pricingModel = raw.pricingModel === 'live_rate' ? 'dynamic' as const : (raw.pricingModel ?? 'fixed' as const);
    const sku = raw.sku || raw.slug || `${raw.category}-${Date.now()}`;

    const product = await productService.createProduct({
      sellerId,
      name: raw.name,
      description: raw.description || '',
      category: raw.category,
      subcategory: raw.subcategory,
      images: raw.images || [],
      price,
      pricingModel,
      goldWeight: raw.goldWeight,
      purity: raw.purity,
      stones: raw.stones,
      laborCost: raw.laborCost,
      sku,
      stock,
      countries: raw.countries,
      arEnabled: raw.arEnabled ?? false,
      video360: raw.video360,
      tags: raw.tags,
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created',
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
 * GET /api/products/category/:category
 * Get products by category (must be before /:id)
 */
router.get('/category/:category', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const products = await productService.getProductsByCategory(
      req.params.category,
      country,
      { page, limit }
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get product
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const product = await productService.getProduct(req.params.id, country);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/products/:id
 * Update product
 */
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const updates = req.body;

    const product = await productService.updateProduct(req.params.id, sellerId, updates);

    res.json({
      success: true,
      data: product,
      message: 'Product updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    await productService.deleteProduct(req.params.id, sellerId);

    res.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    next(error);
  }
});

export { router as productRouter };
