import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { ValidationError, NotFoundError } from '@grandgold/utils';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const ADMIN_ROLES = ['super_admin', 'country_admin', 'manager'];

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
  productCount: number;
  isActive: boolean;
  order: number;
  level: number;
  path?: string;
  metaTitle?: string;
  metaDescription?: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

// In-memory store for categories (in production, use database)
const categoriesStore: Map<string, Category> = new Map();

// Initialize demo categories
const demoCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Beautiful gold necklaces',
    parentId: null,
    icon: 'necklace',
    productCount: 156,
    isActive: true,
    order: 1,
    level: 0,
    countries: ['IN', 'AE', 'UK'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Rings',
    slug: 'rings',
    description: 'Elegant gold rings',
    parentId: null,
    icon: 'ring',
    productCount: 234,
    isActive: true,
    order: 2,
    level: 0,
    countries: ['IN', 'AE', 'UK'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Earrings',
    slug: 'earrings',
    description: 'Stunning gold earrings',
    parentId: null,
    icon: 'earring',
    productCount: 189,
    isActive: true,
    order: 3,
    level: 0,
    countries: ['IN', 'AE', 'UK'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Exquisite gold bracelets',
    parentId: null,
    icon: 'bracelet',
    productCount: 98,
    isActive: true,
    order: 4,
    level: 0,
    countries: ['IN', 'AE', 'UK'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-1-1',
    name: 'Chokers',
    slug: 'chokers',
    description: 'Stylish choker necklaces',
    parentId: 'cat-1',
    productCount: 45,
    isActive: true,
    order: 1,
    level: 1,
    path: 'cat-1/cat-1-1',
    countries: ['IN', 'AE'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-1-2',
    name: 'Chains',
    slug: 'chains',
    description: 'Gold chains',
    parentId: 'cat-1',
    productCount: 67,
    isActive: true,
    order: 2,
    level: 1,
    path: 'cat-1/cat-1-2',
    countries: ['IN', 'AE', 'UK'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize demo data
demoCategories.forEach((cat) => categoriesStore.set(cat.id, cat));

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  image: z.string().url().optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().optional(),
  countries: z.array(z.string()).optional(),
});

const updateCategorySchema = createCategorySchema.partial();

// Helper: generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper: build category tree
function buildTree(categories: Category[]): (Category & { children: Category[] })[] {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((cat) => {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(cat);
    } else if (!cat.parentId) {
      roots.push(cat);
    }
  });

  return roots;
}

/**
 * GET /api/categories
 * List all categories (public)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, tree, active } = req.query;

    let categories = Array.from(categoriesStore.values());

    // Filter by country
    if (country && typeof country === 'string') {
      categories = categories.filter((c) => c.countries.includes(country));
    }

    // Filter by active status
    if (active === 'true') {
      categories = categories.filter((c) => c.isActive);
    }

    // Sort by order
    categories.sort((a, b) => a.order - b.order);

    // Return as tree or flat list
    if (tree === 'true') {
      const treeData = buildTree(categories);
      res.json({ success: true, data: treeData });
    } else {
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:idOrSlug
 * Get single category by ID or slug (public)
 */
router.get('/:idOrSlug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;

    // Try by ID first
    let category = categoriesStore.get(idOrSlug);

    // Try by slug
    if (!category) {
      category = Array.from(categoriesStore.values()).find((c) => c.slug === idOrSlug);
    }

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories
 * Create a new category (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createCategorySchema.parse(req.body);

      const id = randomUUID();
      const slug = data.slug || generateSlug(data.name);

      // Check slug uniqueness
      const existingSlug = Array.from(categoriesStore.values()).find((c) => c.slug === slug);
      if (existingSlug) {
        throw new ValidationError('Slug already exists');
      }

      // Calculate level and path
      let level = 0;
      let path = id;
      if (data.parentId) {
        const parent = categoriesStore.get(data.parentId);
        if (!parent) {
          throw new NotFoundError('Parent category not found');
        }
        level = parent.level + 1;
        path = parent.path ? `${parent.path}/${id}` : `${parent.id}/${id}`;
      }

      const category: Category = {
        id,
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId || null,
        image: data.image,
        icon: data.icon,
        productCount: 0,
        isActive: data.isActive ?? true,
        order: data.order ?? categoriesStore.size,
        level,
        path,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        countries: data.countries || ['IN', 'AE', 'UK'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      categoriesStore.set(id, category);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
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
 * PATCH /api/categories/:id
 * Update a category (admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);

      const category = categoriesStore.get(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check slug uniqueness if updating
      if (data.slug && data.slug !== category.slug) {
        const existingSlug = Array.from(categoriesStore.values()).find(
          (c) => c.slug === data.slug && c.id !== id
        );
        if (existingSlug) {
          throw new ValidationError('Slug already exists');
        }
      }

      // Update category
      const updated: Category = {
        ...category,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      categoriesStore.set(id, updated);

      res.json({
        success: true,
        data: updated,
        message: 'Category updated successfully',
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
 * DELETE /api/categories/:id
 * Delete a category (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const category = categoriesStore.get(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check for child categories
      const hasChildren = Array.from(categoriesStore.values()).some((c) => c.parentId === id);
      if (hasChildren) {
        throw new ValidationError('Cannot delete category with subcategories');
      }

      // Check for products (simplified check)
      if (category.productCount > 0) {
        throw new ValidationError('Cannot delete category with products');
      }

      categoriesStore.delete(id);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/categories/reorder
 * Reorder categories (admin only)
 */
router.post(
  '/reorder',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items } = req.body as { items: { id: string; order: number }[] };

      if (!Array.isArray(items)) {
        throw new ValidationError('Items must be an array');
      }

      items.forEach(({ id, order }) => {
        const category = categoriesStore.get(id);
        if (category) {
          category.order = order;
          category.updatedAt = new Date().toISOString();
          categoriesStore.set(id, category);
        }
      });

      res.json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as categoryRouter };
