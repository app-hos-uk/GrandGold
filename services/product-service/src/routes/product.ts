import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ProductService } from '../services/product.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

// ── Stone detail validation (jewelry-standard fields) ──────────────────────
const stoneDetailSchema = z.object({
  type: z.string().min(1),                           // diamond, ruby, emerald, sapphire, pearl …
  cut: z.string().optional(),                         // round, princess, oval, marquise …
  clarity: z.string().optional(),                     // IF, VVS1, VVS2, VS1, SI1 …
  color: z.string().optional(),                       // D-Z (diamonds) or descriptive
  caratWeight: z.number().nonnegative().optional(),   // per stone
  count: z.number().int().positive(),
  // Accept both "weight" (legacy) and "caratWeight" for backward compat
  weight: z.number().nonnegative().optional(),
  ratePerCarat: z.number().nonnegative().optional(),  // price per carat
  totalValue: z.number().nonnegative().optional(),    // pre-calculated stone value
  certification: z.string().optional(),               // GIA, IGI, HRD …
  certificationNumber: z.string().optional(),
});

// ── Specifications validation ──────────────────────────────────────────────
const specificationsSchema = z.object({
  grossWeight: z.number().nonnegative().optional(),   // total piece weight (g)
  netWeight: z.number().nonnegative().optional(),     // metal-only weight (g)
  dimensions: z.object({
    length: z.number().nonnegative().optional(),
    width: z.number().nonnegative().optional(),
    height: z.number().nonnegative().optional(),
    unit: z.enum(['mm', 'cm', 'inch']).optional().default('mm'),
  }).optional(),
  size: z.string().optional(),                        // ring size, bangle size …
  hallmarkNumber: z.string().optional(),              // BIS hallmark (India)
  certifications: z.array(z.string()).optional(),
  customAttributes: z.record(z.string()).optional(),  // any extra key-value
}).optional();

// ── Create product schema ──────────────────────────────────────────────────
// Accepts both frontend field names (basePrice, stockQuantity, etc.) and
// canonical backend names (price, stock) so the admin form and seller form both work.
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]),

  // ── Pricing ────────────────────────────────────────────────────────────
  // Accept both "price" and "basePrice" (allow 0 for draft/free listings)
  price: z.number().nonnegative().optional(),
  basePrice: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  // Accept 'fixed' | 'dynamic' | 'live_rate'
  pricingModel: z.enum(['fixed', 'dynamic', 'live_rate']).optional().default('fixed'),

  // ── Metal details ──────────────────────────────────────────────────────
  metalType: z.string().optional(),
  purity: z.enum(['24K', '22K', '21K', '18K', '14K', '10K']).optional(),
  goldWeight: z.number().nonnegative().optional(),        // net metal weight (g)
  wastagePercent: z.number().nonnegative().optional(),    // % metal wastage in manufacturing

  // ── Making & labour charges ────────────────────────────────────────────
  makingCharges: z.number().nonnegative().optional(),     // MC value
  makingChargeType: z.enum(['per_gram', 'percentage', 'flat']).optional().default('per_gram'),
  laborCost: z.number().nonnegative().optional(),         // flat labour / other cost
  wastageCharges: z.number().nonnegative().optional(),    // calculated or flat wastage cost
  otherCharges: z.number().nonnegative().optional(),      // hallmarking, packaging, cert …
  otherChargesNote: z.string().optional(),                // description for other charges

  // ── Stone details (array – each stone set) ─────────────────────────────
  stones: z.array(stoneDetailSchema).optional(),

  // ── Specifications ─────────────────────────────────────────────────────
  specifications: specificationsSchema,

  // ── Product metadata ───────────────────────────────────────────────────
  occasion: z.string().optional(),                        // wedding, daily, festive …
  gender: z.enum(['men', 'women', 'unisex', 'kids']).optional(),
  style: z.string().optional(),                           // traditional, modern, fusion …

  // ── Inventory ──────────────────────────────────────────────────────────
  sku: z.string().optional().default(''),
  slug: z.string().optional(),
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
    const price = raw.price ?? raw.basePrice ?? 0;
    const stock = raw.stock ?? raw.stockQuantity ?? 0;
    const pricingModel = raw.pricingModel === 'live_rate' ? 'dynamic' as const : (raw.pricingModel ?? 'fixed' as const);
    const sku = (raw.sku && String(raw.sku).trim()) ? String(raw.sku).trim() : (raw.slug && String(raw.slug).trim()) ? String(raw.slug).trim() : `${raw.category}-${Date.now()}`;

    // Normalise stone details — merge legacy "weight" field into "caratWeight"
    const normalisedStones = (raw.stones || []).map((s) => ({
      type: s.type,
      cut: s.cut,
      clarity: s.clarity,
      color: s.color,
      caratWeight: s.caratWeight ?? s.weight ?? 0,
      count: s.count,
      ratePerCarat: s.ratePerCarat,
      totalValue: s.totalValue,
      certification: s.certification,
      certificationNumber: s.certificationNumber,
    }));

    const product = await productService.createProduct({
      sellerId,
      name: raw.name,
      description: raw.description || '',
      category: raw.category,
      subcategory: raw.subcategory,
      images: raw.images || [],
      price,
      currency: raw.currency,
      pricingModel,
      metalType: raw.metalType,
      goldWeight: raw.goldWeight,
      purity: raw.purity,
      wastagePercent: raw.wastagePercent,
      makingCharges: raw.makingCharges,
      makingChargeType: raw.makingChargeType,
      laborCost: raw.laborCost,
      wastageCharges: raw.wastageCharges,
      otherCharges: raw.otherCharges,
      otherChargesNote: raw.otherChargesNote,
      stones: normalisedStones,
      specifications: raw.specifications,
      occasion: raw.occasion,
      gender: raw.gender,
      style: raw.style,
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
