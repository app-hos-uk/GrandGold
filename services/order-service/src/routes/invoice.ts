import { Router, Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const invoiceService = new InvoiceService();

/**
 * POST /api/orders/:orderId/invoice/generate
 * Generate invoice for order
 */
router.post('/:orderId/invoice/generate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    // In production, fetch order data
    const orderData = {
      orderNumber: `GG-IN-${Date.now()}`,
      customerName: 'Customer Name',
      customerEmail: 'customer@example.com',
      shippingAddress: {},
      items: [],
      subtotal: 0,
      shippingCost: 0,
      tax: 0,
      discount: 0,
      total: 0,
      currency: 'INR',
      paymentMethod: 'Card',
      paymentIntentId: 'pi_mock',
    };

    const invoice = await invoiceService.generateInvoice(req.params.orderId, orderData);

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
 * GET /api/orders/:orderId/invoice
 * Get invoice for order
 */
router.get('/:orderId/invoice', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const invoice = await invoiceService.getInvoiceByOrder(req.params.orderId);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/invoices/:invoiceId/download
 * Download invoice PDF
 */
router.get('/:invoiceId/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const pdfBuffer = await invoiceService.downloadInvoice(req.params.invoiceId, req.user.sub);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.invoiceId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as invoiceRouter };
