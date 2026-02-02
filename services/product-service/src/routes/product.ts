import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ProductService } from '../services/product.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

// Create product schema
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  images: z.array(z.string().url()).min(1),
  price: z.number().positive().optional(),
  pricingModel: z.enum(['fixed', 'dynamic']),
  goldWeight: z.number().positive().optional(),
  purity: z.enum(['24K', '22K', '21K', '18K', '14K', '10K']).optional(),
  stones: z.array(z.object({
    type: z.string(),
    weight: z.number().positive(),
    count: z.number().int().positive(),
  })).optional(),
  laborCost: z.number().positive().optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).min(1),
  arEnabled: z.boolean(),
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

    const data = createProductSchema.parse(req.body);
    const sellerId = req.user.sub; // In production, get actual seller ID

    const product = await productService.createProduct({
      sellerId,
      ...data,
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
