import { Router, Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verification.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const verificationService = new VerificationService();

/**
 * POST /api/kyc/verification/email/send
 * Send email verification
 */
router.post('/email/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { email } = req.body;
    
    await verificationService.sendEmailVerification(req.user.sub, email);
    
    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/email/verify
 * Verify email with code
 */
router.post('/email/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { code } = req.body;
    
    const result = await verificationService.verifyEmail(req.user.sub, code);
    
    res.json({
      success: true,
      data: result,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/phone/send
 * Send phone OTP
 */
router.post('/phone/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { phone, countryCode } = req.body;
    
    await verificationService.sendPhoneOtp(req.user.sub, phone, countryCode);
    
    res.json({
      success: true,
      message: 'OTP sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/phone/verify
 * Verify phone with OTP
 */
router.post('/phone/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { otp } = req.body;
    
    const result = await verificationService.verifyPhone(req.user.sub, otp);
    
    res.json({
      success: true,
      data: result,
      message: 'Phone verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/document/ocr
 * Extract data from document using OCR
 */
router.post('/document/ocr', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { documentId, documentType } = req.body;
    
    const result = await verificationService.extractDocumentData(documentId, documentType);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/liveness
 * Perform liveness check
 */
router.post('/liveness', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { selfieImage, challengeResponse } = req.body;
    
    const result = await verificationService.performLivenessCheck(
      req.user.sub,
      selfieImage,
      challengeResponse
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/verification/face-match
 * Match selfie with document photo
 */
router.post('/face-match', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { selfieId, documentId } = req.body;
    
    const result = await verificationService.matchFaces(selfieId, documentId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as verificationRouter };
