import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

// In-memory store for demo
const refundStore = new Map<string, any>();

const stripeService = new StripeService();
const razorpayService = new RazorpayService();

interface RefundRequest {
  orderId: string;
  userId: string;
  reason: string;
  amount?: number;
}

export class RefundService {
  /**
   * Request a refund
   */
  async requestRefund(data: RefundRequest): Promise<any> {
    const refundId = generateId('ref');
    
    // Fetch order (mock)
    const order = {
      id: data.orderId,
      total: 50000,
      gateway: 'stripe',
      paymentId: 'pi_mock123',
    };
    
    const refund = {
      id: refundId,
      orderId: data.orderId,
      userId: data.userId,
      reason: data.reason,
      amount: data.amount || order.total,
      status: 'pending',
      gateway: order.gateway,
      gatewayPaymentId: order.paymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    refundStore.set(refundId, refund);
    
    return refund;
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string, userId: string): Promise<any> {
    const refund = refundStore.get(refundId);
    
    if (!refund || refund.userId !== userId) {
      throw new NotFoundError('Refund');
    }
    
    return refund;
  }

  /**
   * Get user's refunds
   */
  async getUserRefunds(
    userId: string,
    options: { page: number; limit: number }
  ): Promise<{ data: any[]; total: number }> {
    const refunds = Array.from(refundStore.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = refunds.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = refunds.slice(start, start + options.limit);
    
    return { data: paginatedData, total };
  }

  /**
   * Approve refund
   */
  async approveRefund(refundId: string, adminUserId: string): Promise<any> {
    const refund = refundStore.get(refundId);
    
    if (!refund) {
      throw new NotFoundError('Refund');
    }
    
    if (refund.status !== 'pending') {
      throw new ValidationError('Refund is not pending');
    }
    
    refund.status = 'approved';
    refund.approvedBy = adminUserId;
    refund.approvedAt = new Date();
    refund.updatedAt = new Date();
    
    refundStore.set(refundId, refund);
    
    return refund;
  }

  /**
   * Reject refund
   */
  async rejectRefund(refundId: string, adminUserId: string, reason: string): Promise<any> {
    const refund = refundStore.get(refundId);
    
    if (!refund) {
      throw new NotFoundError('Refund');
    }
    
    if (refund.status !== 'pending') {
      throw new ValidationError('Refund is not pending');
    }
    
    refund.status = 'rejected';
    refund.rejectedBy = adminUserId;
    refund.rejectionReason = reason;
    refund.rejectedAt = new Date();
    refund.updatedAt = new Date();
    
    refundStore.set(refundId, refund);
    
    return refund;
  }

  /**
   * Process approved refund
   */
  async processRefund(refundId: string): Promise<any> {
    const refund = refundStore.get(refundId);
    
    if (!refund) {
      throw new NotFoundError('Refund');
    }
    
    if (refund.status !== 'approved') {
      throw new ValidationError('Refund is not approved');
    }
    
    let gatewayRefund: any;
    
    if (refund.gateway === 'stripe') {
      gatewayRefund = await stripeService.createRefund(
        refund.gatewayPaymentId,
        refund.amount
      );
    } else if (refund.gateway === 'razorpay') {
      gatewayRefund = await razorpayService.createRefund(
        refund.gatewayPaymentId,
        refund.amount
      );
    }
    
    refund.status = 'processed';
    refund.gatewayRefundId = gatewayRefund?.id;
    refund.processedAt = new Date();
    refund.updatedAt = new Date();
    
    refundStore.set(refundId, refund);
    
    return refund;
  }
}
