import { generateId, ValidationError } from '@grandgold/utils';

interface SplitPaymentMethod {
  type: 'card' | 'wallet' | 'upi' | 'bank_transfer';
  amount: number;
  provider?: string;
  paymentMethodId?: string;
}

interface SplitPaymentRequest {
  totalAmount: number;
  currency: string;
  methods: SplitPaymentMethod[];
}

export class SplitPaymentService {
  /**
   * Validate split payment request
   */
  validateSplitPayment(request: SplitPaymentRequest): {
    valid: boolean;
    error?: string;
  } {
    const totalSplit = request.methods.reduce((sum, m) => sum + m.amount, 0);

    if (Math.abs(totalSplit - request.totalAmount) > 0.01) {
      return {
        valid: false,
        error: 'Split amounts do not match total amount',
      };
    }

    if (request.methods.length < 2) {
      return {
        valid: false,
        error: 'Split payment requires at least 2 payment methods',
      };
    }

    if (request.methods.length > 3) {
      return {
        valid: false,
        error: 'Maximum 3 payment methods allowed for split payment',
      };
    }

    return { valid: true };
  }

  /**
   * Process split payment
   */
  async processSplitPayment(
    request: SplitPaymentRequest,
    userId: string,
    orderId: string
  ): Promise<{
    success: boolean;
    payments: { methodId: string; status: string; amount: number }[];
    failedPayments: string[];
  }> {
    const validation = this.validateSplitPayment(request);

    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid split payment');
    }

    const payments: { methodId: string; status: string; amount: number }[] = [];
    const failedPayments: string[] = [];

    // Process each payment method
    for (const method of request.methods) {
      try {
        const paymentId = generateId('pay');

        // In production, call appropriate payment gateway
        const paymentResult = await this.processPaymentMethod(
          method,
          userId,
          orderId
        );

        payments.push({
          methodId: paymentId,
          status: paymentResult.success ? 'succeeded' : 'failed',
          amount: method.amount,
        });

        if (!paymentResult.success) {
          failedPayments.push(paymentId);
        }
      } catch (error) {
        failedPayments.push(method.type);
      }
    }

    // If any payment failed, rollback successful ones
    if (failedPayments.length > 0) {
      // In production, initiate refunds for successful payments
      return {
        success: false,
        payments,
        failedPayments,
      };
    }

    return {
      success: true,
      payments,
      failedPayments: [],
    };
  }

  /**
   * Process individual payment method
   */
  private async processPaymentMethod(
    method: SplitPaymentMethod,
    userId: string,
    orderId: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    // Mock payment processing
    // In production, integrate with payment gateways
    return {
      success: true,
      transactionId: generateId('txn'),
    };
  }
}
