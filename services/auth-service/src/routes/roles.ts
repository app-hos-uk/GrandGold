import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '@grandgold/utils';
import {
  listRoles,
  findRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '@grandgold/database';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All role routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

/**
 * GET /api/roles
 * List all roles
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = req.query.country as string | undefined;
    let rolesList: Awaited<ReturnType<typeof listRoles>> = [];
    
    try {
      rolesList = await listRoles({ country });
    } catch (dbError) {
      // If database table doesn't exist or query fails, return default system roles
      console.error('Failed to load roles from database, using defaults:', dbError);
      rolesList = [
        { id: 'super_admin', name: 'Super Admin', description: 'Full system access', scope: 'global', country: null, permissions: ['*'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'country_admin', name: 'Country Admin', description: 'Country-level access', scope: 'country', country: null, permissions: ['manage_country'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'manager', name: 'Manager', description: 'Management access', scope: 'country', country: null, permissions: ['manage_orders', 'manage_products'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'support', name: 'Support Staff', description: 'Customer support access', scope: 'country', country: null, permissions: ['view_orders', 'manage_tickets'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'seller', name: 'Seller', description: 'Seller access', scope: 'country', country: null, permissions: ['manage_own_products'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'customer', name: 'Customer', description: 'Regular customer', scope: 'global', country: null, permissions: [], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
      ];
    }

    res.json({
      success: true,
      data: { roles: rolesList },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roles/:id
 * Get role by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await findRoleById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/roles
 * Create a new role
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, scope, country, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Role name is required');
    }

    if (!scope || !['global', 'country'].includes(scope)) {
      throw new ValidationError('Scope must be "global" or "country"');
    }

    if (scope === 'country' && (!country || !['IN', 'AE', 'UK'].includes(country))) {
      throw new ValidationError('Country is required for country-scoped roles');
    }

    if (!Array.isArray(permissions)) {
      throw new ValidationError('Permissions must be an array');
    }

    const id = name.toLowerCase().replace(/\s+/g, '_') + (scope === 'country' ? `_${country?.toLowerCase()}` : '');

    // Check if role already exists
    const existing = await findRoleById(id);
    if (existing) {
      throw new ValidationError('A role with this name already exists');
    }

    const role = await createRole({
      id,
      name: name.trim(),
      description: description || null,
      scope,
      country: scope === 'country' ? country : null,
      permissions,
      isSystem: false,
      userCount: 0,
    });

    res.status(201).json({
      success: true,
      data: { role },
      message: 'Role created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/roles/:id
 * Update a role
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, scope, country } = req.body;

    const existing = await findRoleById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    if (existing.isSystem) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot modify system roles' },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;
    if (scope) updateData.scope = scope;
    if (country !== undefined) updateData.country = country;

    const role = await updateRole(id, updateData);

    res.json({
      success: true,
      data: { role },
      message: 'Role updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await findRoleById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    if (existing.isSystem) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot delete system roles' },
      });
    }

    await deleteRole(id);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as rolesRouter };
