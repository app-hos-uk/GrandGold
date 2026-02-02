import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { ValidationError } from '@grandgold/utils';
import { OnboardingService } from '../services/onboarding.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const onboardingService = new OnboardingService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
  },
});

// Onboarding schema
const onboardingSchema = z.object({
  businessName: z.string().min(1).max(100),
  businessType: z.enum(['individual', 'company', 'partnership']),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(9),
  businessAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.enum(['IN', 'AE', 'UK']),
  }),
  onboardingType: z.enum(['automated', 'manual']),
  country: z.enum(['IN', 'AE', 'UK']),
  acceptTerms: z.literal(true),
  acceptCommissionStructure: z.literal(true),
});

/**
 * POST /api/sellers/onboarding/start
 * Start seller onboarding process
 */
router.post('/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = onboardingSchema.parse(req.body);
    
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await onboardingService.startOnboarding({
      userId: req.user.sub,
      ...data,
    });
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Onboarding started successfully',
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
 * GET /api/sellers/onboarding/status
 * Get current onboarding status
 */
router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const status = await onboardingService.getOnboardingStatus(req.user.sub);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/onboarding/documents
 * Upload onboarding documents
 */
router.post(
  '/documents',
  authenticate,
  upload.fields([
    { name: 'tradeLicense', maxCount: 1 },
    { name: 'vatCertificate', maxCount: 1 },
    { name: 'goldDealerPermit', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const result = await onboardingService.uploadDocuments(req.user.sub, {
        tradeLicense: files.tradeLicense?.[0],
        vatCertificate: files.vatCertificate?.[0],
        goldDealerPermit: files.goldDealerPermit?.[0],
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Documents uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/onboarding/bank-details
 * Submit bank details
 */
router.post('/bank-details', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { accountName, accountNumber, bankName, branchCode, swiftCode, iban } = req.body;
    
    const result = await onboardingService.submitBankDetails(req.user.sub, {
      accountName,
      accountNumber,
      bankName,
      branchCode,
      swiftCode,
      iban,
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Bank details submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/onboarding/agreement/sign
 * Sign the seller agreement (DocuSign)
 */
router.post('/agreement/sign', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await onboardingService.initiateAgreementSigning(req.user.sub);
    
    res.json({
      success: true,
      data: result,
      message: 'Agreement signing initiated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/onboarding/agreement/callback
 * DocuSign callback webhook
 */
router.post('/agreement/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { envelopeId, status, recipientEmail } = req.body;
    
    await onboardingService.handleDocuSignCallback({
      envelopeId,
      status,
      recipientEmail,
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/onboarding/submit
 * Submit onboarding for review
 */
router.post('/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const result = await onboardingService.submitForReview(req.user.sub);
    
    res.json({
      success: true,
      data: result,
      message: 'Onboarding submitted for review',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/onboarding/:id/approve
 * Approve seller onboarding (Admin only)
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const result = await onboardingService.approveOnboarding(
        req.params.id,
        req.user.sub
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Seller approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/onboarding/:id/reject
 * Reject seller onboarding (Admin only)
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { reason } = req.body;
      
      const result = await onboardingService.rejectOnboarding(
        req.params.id,
        req.user.sub,
        reason
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Seller onboarding rejected',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sellers/onboarding/pending
 * Get pending onboarding requests (Admin only)
 */
router.get(
  '/pending',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const country = req.query.country as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await onboardingService.getPendingOnboardings({
        country,
        page,
        limit,
        adminUserId: req.user.sub,
        adminCountry: req.user.country,
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as onboardingRouter };
