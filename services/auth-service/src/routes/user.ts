import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError, passwordSchema } from '@grandgold/utils';
import { UserService } from '../services/user.service';
import { authenticate, authorize } from '../middleware/auth';
import { listUsers } from '@grandgold/database';

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
      const country = req.query.country as string;
      const role = req.query.role as string;
      const search = req.query.search as string;

      const { users: userList, total } = await listUsers({ page, limit, country, role, search });

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
