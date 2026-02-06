import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError, passwordSchema } from '@grandgold/utils';
import { UserService } from '../services/user.service';
import { authenticate, authorize } from '../middleware/auth';
import { listUsers, findUserById, updateUser } from '@grandgold/database';
import type { UserRole, Country } from '@grandgold/types';

const router = Router();
const userService = new UserService();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/user/admin/list
 * List users (Admin only)
 */
router.get(
  '/admin/list',
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      let country = req.query.country as string | undefined;
      const role = req.query.role as string;
      const search = req.query.search as string;
      const idsParam = req.query.ids as string | undefined;
      const ids = idsParam ? idsParam.split(',').map((id) => id.trim()).filter(Boolean) : undefined;

      // Country admin can only see users in their country
      if (req.user?.role === 'country_admin' && req.user?.country) {
        country = req.user.country;
      }

      const { users: userList, total } = await listUsers({ page, limit, country, role, search, ids });

      const data = userList.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        country: u.country,
        role: u.role,
        kycStatus: u.kycStatus,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      }));

      res.json({
        success: true,
        data: { users: data, total },
      });
    } catch (error) {
      next(error);
    }
  }
);

const ALLOWED_ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager', 'staff', 'seller', 'customer'];
const COUNTRY_VALUES: Country[] = ['IN', 'AE', 'UK'];

/**
 * PATCH /api/user/admin/:userId
 * Update user details (Admin only). Country admins can only update users in their country.
 */
router.patch(
  '/admin/:userId',
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, phone } = req.body as {
        firstName?: string;
        lastName?: string;
        phone?: string;
      };

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      // Country admins can only update users in their country
      if (req.user?.role === 'country_admin') {
        if (user.country !== req.user.country) {
          return res.status(403).json({ 
            success: false, 
            error: { code: 'FORBIDDEN', message: 'You can only update users in your assigned country' } 
          });
        }
        // Country admins cannot modify super_admin or other country_admin users
        if (user.role === 'super_admin' || user.role === 'country_admin') {
          return res.status(403).json({ 
            success: false, 
            error: { code: 'FORBIDDEN', message: 'You cannot modify admin users' } 
          });
        }
      }

      const updateData: { firstName?: string; lastName?: string; phone?: string } = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone) updateData.phone = phone;

      const updated = await updateUser(userId, updateData);
      if (!updated) {
        return res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update user' } });
      }

      res.json({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          country: updated.country,
          role: updated.role,
        },
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Roles that country admins can assign (non-admin roles only)
const COUNTRY_ADMIN_ASSIGNABLE_ROLES: UserRole[] = ['customer', 'seller', 'influencer', 'consultant', 'staff', 'manager'];

/**
 * PATCH /api/user/admin/:userId/role
 * Set user role (and country for country_admin).
 * Super admins can assign any role. Country admins can only assign non-admin roles to users in their country.
 */
router.patch(
  '/admin/:userId/role',
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { role, country } = req.body as { role?: UserRole; country?: Country };
      
      const isSuperAdmin = req.user?.role === 'super_admin';
      const isCountryAdmin = req.user?.role === 'country_admin';
      const adminCountry = req.user?.country;

      if (!role || !ALLOWED_ADMIN_ROLES.includes(role)) {
        throw new ValidationError('Valid role is required');
      }
      
      // Country admins can only assign specific non-admin roles
      if (isCountryAdmin && !isSuperAdmin) {
        if (!COUNTRY_ADMIN_ASSIGNABLE_ROLES.includes(role)) {
          return res.status(403).json({ 
            success: false, 
            error: { code: 'FORBIDDEN', message: 'You can only assign non-admin roles' } 
          });
        }
      }
      
      const updateData: { role: UserRole; country?: Country } = { role };
      if (role === 'country_admin') {
        if (!country || !COUNTRY_VALUES.includes(country)) {
          throw new ValidationError('country_admin requires country: IN, AE, or UK');
        }
        updateData.country = country;
      }
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }
      
      // Country admins can only modify users in their country
      if (isCountryAdmin && !isSuperAdmin) {
        if (user.country !== adminCountry) {
          return res.status(403).json({ 
            success: false, 
            error: { code: 'FORBIDDEN', message: 'You can only modify users in your country' } 
          });
        }
        // Country admins cannot modify super_admin or other country_admin users
        if (user.role === 'super_admin' || user.role === 'country_admin') {
          return res.status(403).json({ 
            success: false, 
            error: { code: 'FORBIDDEN', message: 'You cannot modify admin users' } 
          });
        }
      }
      
      const updated = await updateUser(userId, updateData);
      if (!updated) {
        return res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update user' } });
      }
      res.json({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          country: updated.country,
        },
        message: 'User role updated',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/user/admin/:userId
 * Delete a user (Admin only). Super admins can delete any user except themselves.
 * Country admins can only delete users in their country (except admins).
 */
router.delete(
  '/admin/:userId',
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      // Cannot delete yourself
      if (userId === req.user?.sub) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You cannot delete your own account' },
        });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      // Country admins can only delete users in their country
      if (req.user?.role === 'country_admin') {
        if (user.country !== req.user.country) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You can only delete users in your assigned country' },
          });
        }
        // Country admins cannot delete super_admin or other country_admin users
        if (user.role === 'super_admin' || user.role === 'country_admin') {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You cannot delete admin users' },
          });
        }
      }

      // Soft delete: mark user as deleted
      const deleted = await updateUser(userId, { isDeleted: true });
      if (!deleted) {
        return res.status(500).json({ success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete user' } });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/user/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const profile = await userService.getProfile(req.user.sub);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/user/me
 * Update current user profile
 */
router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const profile = await userService.updateProfile(req.user.sub, req.body);
    
    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/user/password
 * Change password
 */
router.post('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError('All password fields are required');
    }
    
    if (newPassword !== confirmPassword) {
      throw new ValidationError('New passwords do not match');
    }
    
    // Validate new password strength
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      throw new ValidationError('New password does not meet requirements', {
        errors: passwordResult.error.errors,
      });
    }
    
    await userService.changePassword(req.user.sub, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/addresses
 * Get user addresses
 */
router.get('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const addresses = await userService.getAddresses(req.user.sub);
    
    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/user/addresses
 * Add new address
 */
router.post('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const address = await userService.addAddress(req.user.sub, req.body);
    
    res.status(201).json({
      success: true,
      data: address,
      message: 'Address added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/user/addresses/:id
 * Update address
 */
router.patch('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const address = await userService.updateAddress(req.user.sub, req.params.id, req.body);
    
    res.json({
      success: true,
      data: address,
      message: 'Address updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/user/addresses/:id
 * Delete address
 */
router.delete('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    await userService.deleteAddress(req.user.sub, req.params.id);
    
    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/preferences
 * Get user preferences
 */
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const preferences = await userService.getPreferences(req.user.sub);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/user/preferences
 * Update user preferences
 */
router.patch('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const preferences = await userService.updatePreferences(req.user.sub, req.body);
    
    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/user/consent/whatsapp
 * Update WhatsApp consent
 */
router.post('/consent/whatsapp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { consent } = req.body;
    
    await userService.updateWhatsAppConsent(req.user.sub, consent === true);
    
    res.json({
      success: true,
      message: consent ? 'WhatsApp notifications enabled' : 'WhatsApp notifications disabled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/data/export
 * Request data export (GDPR)
 */
router.get('/data/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const data = await userService.exportUserData(req.user.sub);
    
    res.json({
      success: true,
      data,
      message: 'Your data export is ready',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/user/account
 * Delete account (GDPR - Right to be forgotten)
 */
router.delete('/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { password, confirmation } = req.body;
    
    if (confirmation !== 'DELETE MY ACCOUNT') {
      throw new ValidationError('Please type "DELETE MY ACCOUNT" to confirm');
    }
    
    await userService.deleteAccount(req.user.sub, password);
    
    res.json({
      success: true,
      message: 'Your account has been scheduled for deletion',
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
