import { Router, Request, Response, NextFunction } from 'express';
import { EMIService, BNPLService } from '../services/emi-bnpl.service';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const emiService = new EMIService();
const bnplService = new BNPLService();

/**
 * GET /api/payments/emi/options
 * Get available EMI options
 */
router.get('/emi/options', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = parseFloat(req.query.amount as string);
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';

    if (!amount) {
      res.status(400).json({
        success: false,
        error: { message: 'Amount is required' },
      });
      return;
    }

    const options = await emiService.getEMIOptions(amount, country);

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/emi/calculate
 * Calculate EMI breakdown
 */
router.post('/emi/calculate', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { principal, tenure, interestRate } = req.body;

    if (!principal || !tenure || interestRate === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'Principal, tenure, and interestRate are required' },
      });
      return;
    }

    const breakdown = emiService.getEMIBreakdown(principal, tenure, interestRate);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/bnpl/options
 * Get available BNPL options
 */
router.get('/bnpl/options', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = parseFloat(req.query.amount as string);
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';

    if (!amount) {
      res.status(400).json({
        success: false,
        error: { message: 'Amount is required' },
      });
      return;
    }

    const options = await bnplService.getBNPLOptions(amount, country);

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
});

export { router as emiBnplRouter };
