import { Router, Request, Response, NextFunction } from 'express';
import { AmlService } from '../services/aml.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const amlService = new AmlService();

/**
 * POST /api/kyc/aml/check
 * Perform AML screening
 */
router.post(
  '/check',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, fullName, dateOfBirth, nationality } = req.body;
      
      const result = await amlService.performScreening({
        userId,
        fullName,
        dateOfBirth,
        nationality,
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

/**
 * GET /api/kyc/aml/status/:userId
 * Get AML status for user
 */
router.get(
  '/status/:userId',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await amlService.getAmlStatus(req.params.userId);
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/kyc/aml/transaction-check
 * Check transaction against AML rules
 */
router.post(
  '/transaction-check',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { amount, currency, transactionType, destinationCountry } = req.body;
      
      const result = await amlService.checkTransaction({
        userId: req.user.sub,
        amount,
        currency,
        transactionType,
        destinationCountry,
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

/**
 * GET /api/kyc/aml/alerts
 * Get AML alerts (Admin)
 */
router.get(
  '/alerts',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const severity = req.query.severity as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const alerts = await amlService.getAlerts({ status, severity, page, limit });
      
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/kyc/aml/alerts/:alertId/resolve
 * Resolve an AML alert (Admin)
 */
router.post(
  '/alerts/:alertId/resolve',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { resolution, notes } = req.body;
      
      const result = await amlService.resolveAlert(
        req.params.alertId,
        req.user.sub,
        resolution,
        notes
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Alert resolved',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as amlRouter };
