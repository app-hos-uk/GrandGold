import { generateId, NotFoundError } from '@grandgold/utils';

// In-memory store for demo
const invoiceStore = new Map<string, any>();

interface InvoiceData {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customer: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  seller: {
    name: string;
    address: {
      line1: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    goldWeight?: number;
    purity?: string;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
}

export class InvoiceService {
  /**
   * Generate invoice for order
   */
  async generateInvoice(orderId: string, orderData: any): Promise<{
    invoiceNumber: string;
    invoiceUrl: string;
    pdfUrl: string;
  }> {
    // Check if invoice already exists
    const existing = Array.from(invoiceStore.values()).find(
      (inv) => inv.orderId === orderId
    );

    if (existing) {
      return {
        invoiceNumber: existing.invoiceNumber,
        invoiceUrl: existing.invoiceUrl,
        pdfUrl: existing.pdfUrl,
      };
    }

    const invoiceNumber = `INV-${orderData.orderNumber || orderId.slice(-8).toUpperCase()}`;
    const invoiceId = generateId('inv');

    const invoiceData: InvoiceData = {
      orderId,
      orderNumber: orderData.orderNumber || orderId,
      invoiceNumber,
      invoiceDate: new Date(),
      customer: {
        name: orderData.customerName || 'Customer',
        email: orderData.customerEmail || '',
        address: orderData.shippingAddress || {},
      },
      seller: {
        name: orderData.sellerName || 'GrandGold Partner',
        address: orderData.sellerAddress || {},
        taxId: orderData.sellerTaxId,
      },
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      shipping: orderData.shippingCost || 0,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
      total: orderData.total || 0,
      currency: orderData.currency || 'INR',
      paymentMethod: orderData.paymentMethod || 'Card',
      paymentReference: orderData.paymentIntentId || '',
    };

    // Generate PDF (in production, use PDF library like pdfkit or puppeteer)
    const pdfUrl = await this.generatePDF(invoiceData);

    const invoice = {
      id: invoiceId,
      ...invoiceData,
      invoiceUrl: `/api/invoices/${invoiceId}`,
      pdfUrl,
      createdAt: new Date(),
    };

    invoiceStore.set(invoiceId, invoice);

    return {
      invoiceNumber,
      invoiceUrl: invoice.invoiceUrl,
      pdfUrl: invoice.pdfUrl,
    };
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string, userId: string): Promise<any> {
    const invoice = invoiceStore.get(invoiceId);

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // In production, verify user has access to this invoice

    return invoice;
  }

  /**
   * Get invoice by order ID
   */
  async getInvoiceByOrder(orderId: string): Promise<any> {
    const invoice = Array.from(invoiceStore.values()).find(
      (inv) => inv.orderId === orderId
    );

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    return invoice;
  }

  /**
   * Generate PDF invoice
   */
  private async generatePDF(invoiceData: InvoiceData): Promise<string> {
    // In production, use PDF library
    // For now, return mock URL
    const invoiceId = generateId('inv');
    const pdfUrl = `https://storage.googleapis.com/grandgold-invoices/${invoiceId}.pdf`;

    // Mock PDF generation
    // In production:
    // const PDFDocument = require('pdfkit');
    // const doc = new PDFDocument();
    // ... generate PDF with invoice data
    // Upload to Cloud Storage

    return pdfUrl;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string, userId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId, userId);

    // In production, fetch PDF from Cloud Storage
    // For now, return mock buffer
    return Buffer.from('Mock PDF content');
  }
}
