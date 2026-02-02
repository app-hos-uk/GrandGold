import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ProductService } from '../services/product.service';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Product schema
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  category: z.enum([
    'necklaces', 'earrings', 'rings', 'bracelets', 
    'bangles', 'pendants', 'mens_jewelry', 'gold_bars', 'gold_coins'
  ]),
  subcategory: z.string().optional(),
  pricingModel: z.enum(['fixed', 'dynamic']),
  basePrice: z.number().positive(),
  goldWeight: z.number().positive().optional(),
  purity: z.enum(['24K', '22K', '21K', '18K', '14K', '10K']).optional(),
  metalType: z.enum(['gold', 'silver', 'platinum', 'palladium']).optional(),
  laborCost: z.number().optional(),
  makingCharges: z.number().optional(),
  stones: z.array(z.object({
    type: z.string(),
    count: z.number(),
    caratWeight: z.number().optional(),
    value: z.number(),
  })).optional(),
  specifications: z.object({
    weight: z.number(),
    dimensions: z.object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.string(),
    }).optional(),
    hallmarkNumber: z.string().optional(),
    certifications: z.array(z.string()).optional(),
  }),
  stockQuantity: z.number().int().min(0),
  arEnabled: z.boolean().optional(),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])),
});

/**
 * POST /api/sellers/products
 * Create a new product
 */
router.post('/', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = productSchema.parse(req.body);
    
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const product = await productService.createProduct(req.user.sub, data);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
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
 * GET /api/sellers/products
 * Get seller's products
 */
router.get('/', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const category = req.query.category as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const products = await productService.getSellerProducts(req.user.sub, {
      category,
      status,
      page,
      limit,
    });
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/products/:id
 * Get product details
 */
router.get('/:id', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const product = await productService.getProduct(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/sellers/products/:id
 * Update product
 */
router.patch('/:id', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const product = await productService.updateProduct(req.params.id, req.user.sub, req.body);
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sellers/products/:id
 * Delete product
 */
router.delete('/:id', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await productService.deleteProduct(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/products/:id/images
 * Upload product images
 */
router.post(
  '/:id/images',
  authenticate,
  requireSeller,
  upload.array('images', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const files = req.files as Express.Multer.File[];
      
      const images = await productService.uploadImages(
        req.params.id,
        req.user.sub,
        files
      );
      
      res.json({
        success: true,
        data: images,
        message: 'Images uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/sellers/products/:id/images/:imageId
 * Delete product image
 */
router.delete('/:id/images/:imageId', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await productService.deleteImage(req.params.id, req.params.imageId, req.user.sub);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/products/:id/ar-model
 * Upload AR model (GLB)
 */
router.post(
  '/:id/ar-model',
  authenticate,
  requireSeller,
  upload.single('model'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const file = req.file;
      
      if (!file) {
        throw new ValidationError('AR model file is required');
      }
      
      const arModel = await productService.uploadArModel(
        req.params.id,
        req.user.sub,
        file
      );
      
      res.json({
        success: true,
        data: arModel,
        message: 'AR model uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/sellers/products/:id/stock
 * Update product stock
 */
router.patch('/:id/stock', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { quantity, operation } = req.body;
    
    const product = await productService.updateStock(
      req.params.id,
      req.user.sub,
      quantity,
      operation // 'set', 'add', 'subtract'
    );
    
    res.json({
      success: true,
      data: product,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/products/bulk
 * Bulk import products (CSV/Excel)
 */
router.post('/bulk', authenticate, requireSeller, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const file = req.file;
    
    if (!file) {
      throw new ValidationError('CSV/Excel file is required');
    }
    
    const result = await productService.bulkImport(req.user.sub, file);
    
    res.json({
      success: true,
      data: result,
      message: `Imported ${result.imported} products, ${result.failed} failed`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/products/:id/ai-description
 * Generate AI description for product
 */
router.post('/:id/ai-description', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const description = await productService.generateAiDescription(
      req.params.id,
      req.user.sub
    );
    
    res.json({
      success: true,
      data: { description },
      message: 'AI description generated',
    });
  } catch (error) {
    next(error);
  }
});

export { router as productRouter };
