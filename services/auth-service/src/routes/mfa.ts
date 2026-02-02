import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '@grandgold/utils';
import { MfaService } from '../services/mfa.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const mfaService = new MfaService();

// All MFA routes require authentication
router.use(authenticate);

/**
 * GET /api/mfa/status
 * Get MFA status for current user
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const status = await mfaService.getMfaStatus(req.user.sub);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mfa/setup
 * Start MFA setup process
 */
router.post('/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const setup = await mfaService.initMfaSetup(req.user.sub, req.user.email);
    
    res.json({
      success: true,
      data: setup,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA setup with TOTP code
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { code, secret } = req.body;
    
    if (!code || !secret) {
      throw new ValidationError('Code and secret are required');
    }
    
    const backupCodes = await mfaService.completeMfaSetup(req.user.sub, secret, code);
    
    res.json({
      success: true,
      data: { backupCodes },
      message: 'MFA enabled successfully. Save your backup codes securely.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA
 */
router.post('/disable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { code, password } = req.body;
    
    if (!code || !password) {
      throw new ValidationError('TOTP code and password are required');
    }
    
    await mfaService.disableMfa(req.user.sub, code, password);
    
    res.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mfa/backup/verify
 * Verify using backup code
 */
router.post('/backup/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { backupCode } = req.body;
    
    if (!backupCode) {
      throw new ValidationError('Backup code is required');
    }
    
    const remainingCodes = await mfaService.useBackupCode(req.user.sub, backupCode);
    
    res.json({
      success: true,
      data: { remainingBackupCodes: remainingCodes },
      message: 'Backup code verified',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mfa/backup/regenerate
 * Regenerate backup codes
 */
router.post('/backup/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const { code, password } = req.body;
    
    if (!code || !password) {
      throw new ValidationError('TOTP code and password are required');
    }
    
    const newBackupCodes = await mfaService.regenerateBackupCodes(req.user.sub, code, password);
    
    res.json({
      success: true,
      data: { backupCodes: newBackupCodes },
      message: 'Backup codes regenerated. Save them securely.',
    });
  } catch (error) {
    next(error);
  }
});

export { router as mfaRouter };
