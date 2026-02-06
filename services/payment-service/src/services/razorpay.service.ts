import crypto from 'crypto';
import { generateId } from '@grandgold/utils';

// In-memory store for demo mode
const orderStore = new Map<string, any>();

interface CreateOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, any>;
}

interface CreateUpiInput {
  amount: number;
  receipt: string;
  vpa: string;
  customerId: string;
}

interface CreateNetbankingInput {
  amount: number;
  receipt: string;
  bankCode: string;
  customerId: string;
}

export class RazorpayService {
  private razorpay: any = null;

  constructor() {
    // Initialize Razorpay if keys are available
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        // Dynamic import to avoid errors if package not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
      } catch {
        console.warn('Razorpay SDK not available, using mock mode');
      }
    }
  }

  /**
   * Create Razorpay order
   */
  async createOrder(input: CreateOrderInput): Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  }> {
    if (this.razorpay) {
      const order = await this.razorpay.orders.create({
        amount: input.amount,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
      });
      
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    }
    
    // Mock mode
    const id = `order_${generateId('rzp')}`;
    const order = {
      id,
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      status: 'created',
      createdAt: new Date(),
    };
    
    orderStore.set(id, order);
    
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  }

  /**
   * Verify payment signature
   */
  verifyPayment(data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    
    const body = `${data.orderId}|${data.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expectedSignature === data.signature;
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    if (this.razorpay) {
      return this.razorpay.payments.fetch(paymentId);
    }
    
    // Mock mode
    return {
      id: paymentId,
      amount: 10000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
    };
  }

  /**
   * Get payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<{
    type: string;
    last4?: string;
    brand?: string;
    upi_id?: string;
    bank_name?: string;
    account_number?: string;
  }> {
    // Razorpay doesn't have a separate payment method concept like Stripe
    // Return mock data based on the token/method id
    return {
      type: 'card',
      last4: '4242',
      brand: 'visa',
    };
  }

  /**
   * Create UPI payment
   */
  async createUpiPayment(input: CreateUpiInput): Promise<any> {
    // Create order first
    const order = await this.createOrder({
      amount: input.amount,
      currency: 'INR',
      receipt: input.receipt,
    });
    
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      vpa: input.vpa,
      method: 'upi',
      status: 'created',
    };
  }

  /**
   * Check UPI payment status
   */
  async checkUpiStatus(paymentId: string): Promise<{
    status: string;
    paid: boolean;
  }> {
    const payment = await this.getPayment(paymentId);
    
    return {
      status: payment.status,
      paid: payment.status === 'captured',
    };
  }

  /**
   * Create netbanking payment
   */
  async createNetbankingPayment(input: CreateNetbankingInput): Promise<any> {
    const order = await this.createOrder({
      amount: input.amount,
      currency: 'INR',
      receipt: input.receipt,
    });
    
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bankCode: input.bankCode,
      method: 'netbanking',
      status: 'created',
    };
  }

  /**
   * Get supported banks
   */
  getSupportedBanks(): { code: string; name: string }[] {
    return [
      { code: 'HDFC', name: 'HDFC Bank' },
      { code: 'ICIC', name: 'ICICI Bank' },
      { code: 'SBIN', name: 'State Bank of India' },
      { code: 'AXIS', name: 'Axis Bank' },
      { code: 'KKBK', name: 'Kotak Mahindra Bank' },
      { code: 'YESB', name: 'Yes Bank' },
      { code: 'PUNB', name: 'Punjab National Bank' },
      { code: 'BARB', name: 'Bank of Baroda' },
      { code: 'UTIB', name: 'Axis Bank' },
      { code: 'CITI', name: 'Citibank' },
    ];
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount?: number): Promise<any> {
    if (this.razorpay) {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount,
        speed: 'optimum',
      });
      
      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    }
    
    // Mock mode
    return {
      id: `rfnd_${generateId('refund')}`,
      status: 'processed',
      amount,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === signature;
  }
}
