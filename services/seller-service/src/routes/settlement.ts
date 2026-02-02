import { Router, Request, Response, NextFunction } from 'express';
import { SettlementService } from '../services/settlement.service';
import { authenticate, requireSeller, authorize } from '../middleware/auth';

const router = Router();
const settlementService = new SettlementService();

/**
 * GET /api/sellers/settlements
 * Get seller's settlements
 */
router.get('/', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const settlements = await settlementService.getSellerSettlements(req.user.sub, {
      status,
      page,
      limit,
    });
    
    res.json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/settlements/:id
 * Get settlement details
 */
router.get('/:id', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const settlement = await settlementService.getSettlement(req.params.id, req.user.sub);
    
    res.json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/settlements/ledger
 * Get seller's finance ledger
 */
router.get('/ledger', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const ledger = await settlementService.getFinanceLedger(req.user.sub, {
      startDate,
      endDate,
    });
    
    res.json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/settlements/:id/breakdown
 * Get settlement breakdown
 */
router.get('/:id/breakdown', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const breakdown = await settlementService.getSettlementBreakdown(
      req.params.id,
      req.user.sub
    );
    
    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/settlements/:id/orders
 * Get orders included in settlement
 */
router.get('/:id/orders', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const orders = await settlementService.getSettlementOrders(
      req.params.id,
      req.user.sub
    );
    
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/settlements/pending
 * Get pending (unsettled) amount
 */
router.get('/pending', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const pending = await settlementService.getPendingAmount(req.user.sub);
    
    res.json({
      success: true,
      data: pending,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/settlements/:id/invoice
 * Generate settlement invoice
 */
router.post('/:id/invoice', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const invoice = await settlementService.generateInvoice(
      req.params.id,
      req.user.sub
    );
    
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice generated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/settlements/process
 * Process pending settlements (Admin/Cron)
 */
router.post(
  '/process',
  authenticate,
  authorize('super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settlementService.processSettlements();
      
      res.json({
        success: true,
        data: result,
        message: `Processed ${result.count} settlements`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/settlements/:id/pay
 * Mark settlement as paid (Admin)
 */
router.post(
  '/:id/pay',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      
      const { paymentReference, paymentMethod } = req.body;
      
      await settlementService.markAsPaid(
        req.params.id,
        req.user.sub,
        { paymentReference, paymentMethod }
      );
      
      res.json({
        success: true,
        message: 'Settlement marked as paid',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as settlementRouter };
