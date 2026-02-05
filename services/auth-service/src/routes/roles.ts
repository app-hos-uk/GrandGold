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

// All role routes require authentication
router.use(authenticate);

/**
 * GET /api/roles
 * List all roles. Super admins see all, country admins see country-scoped roles.
 */
router.get('/', authorize('super_admin', 'country_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const isCountryAdmin = req.user?.role === 'country_admin';
    const adminCountry = req.user?.country;
    
    // Country admins can only see roles for their country
    let country = req.query.country as string | undefined;
    if (isCountryAdmin && !isSuperAdmin) {
      country = adminCountry;
    }
    
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
        { id: 'influencer', name: 'Influencer', description: 'Influencer access', scope: 'country', country: null, permissions: ['manage_rack'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'consultant', name: 'Consultant', description: 'Consultant access', scope: 'country', country: null, permissions: ['view_products'], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'customer', name: 'Customer', description: 'Regular customer', scope: 'global', country: null, permissions: [], isSystem: true, userCount: 0, createdAt: new Date(), updatedAt: new Date() },
      ];
    }
    
    // Filter roles for country admins (only show country-scoped or non-admin system roles)
    if (isCountryAdmin && !isSuperAdmin) {
      rolesList = rolesList.filter((role) => 
        (role.scope === 'country' && (role.country === adminCountry || !role.country)) ||
        ['customer', 'seller', 'influencer', 'consultant', 'support', 'manager'].includes(role.id)
      );
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
router.get('/:id', authorize('super_admin', 'country_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const isCountryAdmin = req.user?.role === 'country_admin';
    const adminCountry = req.user?.country;
    
    const role = await findRoleById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }
    
    // Country admins can only view country-scoped roles for their country
    if (isCountryAdmin && !isSuperAdmin) {
      if (role.scope === 'global' && !['customer', 'seller', 'influencer', 'consultant', 'support', 'manager'].includes(role.id)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have access to this role' },
        });
      }
      if (role.scope === 'country' && role.country && role.country !== adminCountry) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have access to this role' },
        });
      }
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
 * Create a new role. Country admins can only create country-scoped roles for their country.
 */
router.post('/', authorize('super_admin', 'country_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const isCountryAdmin = req.user?.role === 'country_admin';
    const adminCountry = req.user?.country;
    
    const { name, description, scope, country, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Role name is required');
    }

    if (!scope || !['global', 'country'].includes(scope)) {
      throw new ValidationError('Scope must be "global" or "country"');
    }
    
    // Country admins can only create country-scoped roles
    if (isCountryAdmin && !isSuperAdmin) {
      if (scope === 'global') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only create country-scoped roles' },
        });
      }
      if (country !== adminCountry) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only create roles for your country' },
        });
      }
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
 * Update a role. Country admins can only update country-scoped roles for their country.
 */
router.patch('/:id', authorize('super_admin', 'country_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const isCountryAdmin = req.user?.role === 'country_admin';
    const adminCountry = req.user?.country;
    
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
    
    // Country admins can only update country-scoped roles for their country
    if (isCountryAdmin && !isSuperAdmin) {
      if (existing.scope !== 'country' || existing.country !== adminCountry) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only modify roles for your country' },
        });
      }
      // Prevent country admins from changing scope or country
      if (scope && scope !== 'country') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You cannot change the scope of a role' },
        });
      }
      if (country && country !== adminCountry) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You cannot change the country of a role' },
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;
    if (scope && isSuperAdmin) updateData.scope = scope;
    if (country !== undefined && isSuperAdmin) updateData.country = country;

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
 * Delete a role. Country admins can only delete country-scoped roles for their country.
 */
router.delete('/:id', authorize('super_admin', 'country_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const isCountryAdmin = req.user?.role === 'country_admin';
    const adminCountry = req.user?.country;
    
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
    
    // Country admins can only delete country-scoped roles for their country
    if (isCountryAdmin && !isSuperAdmin) {
      if (existing.scope !== 'country' || existing.country !== adminCountry) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only delete roles for your country' },
        });
      }
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
