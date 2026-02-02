import { Router, Request, Response, NextFunction } from 'express';
import { RazorpayService } from '../services/razorpay.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const razorpayService = new RazorpayService();

/**
 * POST /api/payments/razorpay/create-order
 * Create Razorpay order
 */
router.post('/create-order', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { amount, currency, receipt, notes } = req.body;
    
    const order = await razorpayService.createOrder({
      amount,
      currency: currency || 'INR',
      receipt,
      notes,
    });
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/razorpay/verify
 * Verify Razorpay payment
 */
router.post('/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { orderId, paymentId, signature } = req.body;
    
    const isValid = razorpayService.verifyPayment({
      orderId,
      paymentId,
      signature,
    });
    
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: { message: 'Payment verification failed' },
      });
      return;
    }
    
    res.json({
      success: true,
      data: { verified: true, paymentId },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/razorpay/payment/:paymentId
 * Get Razorpay payment details
 */
router.get('/payment/:paymentId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await razorpayService.getPayment(req.params.paymentId);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/razorpay/upi/create
 * Create UPI payment
 */
router.post('/upi/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { amount, receipt, vpa } = req.body;
    
    const upiPayment = await razorpayService.createUpiPayment({
      amount,
      receipt,
      vpa,
      customerId: req.user.sub,
    });
    
    res.json({
      success: true,
      data: upiPayment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/razorpay/upi/check/:paymentId
 * Check UPI payment status
 */
router.get('/upi/check/:paymentId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await razorpayService.checkUpiStatus(req.params.paymentId);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/razorpay/netbanking/create
 * Create netbanking payment
 */
router.post('/netbanking/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const { amount, receipt, bankCode } = req.body;
    
    const payment = await razorpayService.createNetbankingPayment({
      amount,
      receipt,
      bankCode,
      customerId: req.user.sub,
    });
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/razorpay/banks
 * Get list of supported banks
 */
router.get('/banks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banks = razorpayService.getSupportedBanks();
    
    res.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    next(error);
  }
});

export { router as razorpayRouter };
