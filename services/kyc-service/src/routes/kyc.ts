import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { KycService } from '../services/kyc.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const kycService = new KycService();

// Configure multer for document uploads
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

// Tier 1 KYC schema (basic)
const tier1Schema = z.object({
  email: z.string().email(),
  phone: z.string().min(9),
  phoneVerified: z.boolean(),
  emailVerified: z.boolean(),
});

// Tier 2 KYC schema (advanced)
const tier2Schema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string(),
  nationality: z.string(),
  documentType: z.enum(['passport', 'national_id', 'drivers_license', 'emirates_id', 'aadhaar', 'pan']),
  documentNumber: z.string().min(1),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.enum(['IN', 'AE', 'UK']),
  }),
});

/**
 * GET /api/kyc/status
 * Get user's KYC status
 */
router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const status = await kycService.getKycStatus(req.user.sub);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kyc/tier1/submit
 * Submit Tier 1 KYC (basic verification)
 */
router.post('/tier1/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const data = tier1Schema.parse(req.body);
    
    const result = await kycService.submitTier1(req.user.sub, data);
    
    res.json({
      success: true,
      data: result,
      message: 'Tier 1 KYC submitted successfully',
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
 * POST /api/kyc/tier2/submit
 * Submit Tier 2 KYC (advanced verification)
 */
router.post('/tier2/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const data = tier2Schema.parse(req.body);
    
    const result = await kycService.submitTier2(req.user.sub, data);
    
    res.json({
      success: true,
      data: result,
      message: 'Tier 2 KYC submitted successfully',
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
 * POST /api/kyc/documents
 * Upload KYC documents
 */
router.post(
  '/documents',
  authenticate,
  upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const result = await kycService.uploadDocuments(req.user.sub, {
        documentFront: files.documentFront?.[0],
        documentBack: files.documentBack?.[0],
        selfie: files.selfie?.[0],
        addressProof: files.addressProof?.[0],
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
 * GET /api/kyc/limits
 * Get user's transaction limits based on KYC tier
 */
router.get('/limits', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const limits = await kycService.getTransactionLimits(req.user.sub);
    
    res.json({
      success: true,
      data: limits,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kyc/requirements/:country
 * Get KYC requirements for a country
 */
router.get('/requirements/:country', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirements = await kycService.getCountryRequirements(req.params.country as any);
    
    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes

/**
 * GET /api/kyc/pending
 * Get pending KYC applications (Admin)
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
      const tier = req.query.tier as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const applications = await kycService.getPendingApplications({
        country,
        tier,
        page,
        limit,
        adminCountry: req.user.country,
      });
      
      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/kyc/:userId
 * Get user's KYC details (Admin)
 */
router.get(
  '/:userId',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kyc = await kycService.getUserKyc(req.params.userId);
      
      res.json({
        success: true,
        data: kyc,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/kyc/:userId/approve
 * Approve KYC application (Admin)
 */
router.post(
  '/:userId/approve',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { tier, notes } = req.body;
      
      const result = await kycService.approveKyc(
        req.params.userId,
        tier,
        req.user.sub,
        notes
      );
      
      res.json({
        success: true,
        data: result,
        message: 'KYC approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/kyc/:userId/reject
 * Reject KYC application (Admin)
 */
router.post(
  '/:userId/reject',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { tier, reason } = req.body;
      
      const result = await kycService.rejectKyc(
        req.params.userId,
        tier,
        req.user.sub,
        reason
      );
      
      res.json({
        success: true,
        data: result,
        message: 'KYC rejected',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as kycRouter };
