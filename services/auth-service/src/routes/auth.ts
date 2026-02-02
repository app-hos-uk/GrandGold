import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerSchema, loginSchema, mfaVerifySchema, ValidationError } from '@grandgold/utils';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful. Please verify your email.',
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
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data, {
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
    
    // If MFA is required, return partial response
    if (result.requiresMfa) {
      res.json({
        success: true,
        data: {
          requiresMfa: true,
          mfaToken: result.mfaToken,
        },
        message: 'MFA verification required',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      message: 'Login successful',
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
 * POST /api/auth/login/mfa
 * Verify MFA code to complete login
 */
router.post('/login/mfa', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = mfaVerifySchema.parse(req.body);
    const result = await authService.verifyMfaLogin(data, {
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
    
    res.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      message: 'Login successful',
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
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    
    const tokens = await authService.refreshTokens(refreshToken);
    
    res.json({
      success: true,
      data: { tokens },
      message: 'Tokens refreshed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token && req.user) {
      await authService.logout(req.user.sub, token);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout/all
 * Logout from all devices
 */
router.post('/logout/all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await authService.logoutAll(req.user.sub);
    }
    
    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/password/reset
 * Request password reset
 */
router.post('/password/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ValidationError('Email is required');
    }
    
    await authService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/password/reset/confirm
 * Confirm password reset with token
 */
router.post('/password/reset/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (!token || !password || !confirmPassword) {
      throw new ValidationError('Token, password, and confirmPassword are required');
    }
    
    if (password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }
    
    await authService.confirmPasswordReset(token, password);
    
    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify/email
 * Verify email with token
 */
router.post('/verify/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw new ValidationError('Verification token is required');
    }
    
    await authService.verifyEmail(token);
    
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify/phone/send
 * Send phone verification OTP
 */
router.post('/verify/phone/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      throw new ValidationError('Phone number is required');
    }
    
    if (req.user) {
      await authService.sendPhoneVerificationOtp(req.user.sub, phone);
    }
    
    res.json({
      success: true,
      message: 'OTP sent to your phone',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify/phone/confirm
 * Verify phone with OTP
 */
router.post('/verify/phone/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      throw new ValidationError('OTP is required');
    }
    
    if (req.user) {
      await authService.verifyPhoneOtp(req.user.sub, otp);
    }
    
    res.json({
      success: true,
      message: 'Phone verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
