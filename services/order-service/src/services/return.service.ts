import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';

interface ReturnRecord {
  id: string; orderId: string; userId: string; items: string[];
  reason: string; reasonDetails?: string; images: string[];
  preferredResolution: string; status: string;
  requestedAt: Date; approvedAt: Date | null; rejectedAt: Date | null;
  rejectionReason: string | null; returnLabelUrl: string | null;
  trackingNumber: string | null; refundAmount: number | null; refundedAt: Date | null;
  [key: string]: unknown;
}

// In-memory store for demo
const returnStore = new Map<string, ReturnRecord>();

interface CreateReturnInput {
  orderId: string;
  userId: string;
  items: string[]; // Product IDs or order item IDs
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other';
  reasonDetails?: string;
  images?: string[];
  preferredResolution: 'refund' | 'exchange' | 'store_credit';
}

export class ReturnService {
  /**
   * Initiate return request
   */
  async initiateReturn(input: CreateReturnInput): Promise<ReturnRecord> {
    // Verify order exists and belongs to user
    const order = { id: input.orderId, status: 'delivered', deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }; // Mock

    if (order.status !== 'delivered') {
      throw new ValidationError('Returns can only be requested for delivered orders');
    }

    // Check return window (7 days)
    const deliveryDate = new Date(order.deliveredAt);
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      throw new ValidationError('Return window has expired (7 days)');
    }

    // Check if return already exists
    const existing = Array.from(returnStore.values()).find(
      (r) => r.orderId === input.orderId && r.status === 'pending'
    );

    if (existing) {
      throw new ValidationError('Return request already exists for this order');
    }

    const returnId = generateId('ret');

    const returnRequest = {
      id: returnId,
      orderId: input.orderId,
      userId: input.userId,
      items: input.items,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      images: input.images || [],
      preferredResolution: input.preferredResolution,
      status: 'pending',
      requestedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      returnLabelUrl: null,
      trackingNumber: null,
      refundAmount: null,
      refundedAt: null,
    };

    returnStore.set(returnId, returnRequest);

    return returnRequest;
  }

  /**
   * Get return request
   */
  async getReturn(returnId: string, userId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);

    if (!returnRequest || returnRequest.userId !== userId) {
      throw new NotFoundError('Return request');
    }

    return returnRequest;
  }

  /**
   * Get user's returns
   */
  async getUserReturns(
    userId: string,
    options: { status?: string; page: number; limit: number }
  ): Promise<{ data: ReturnRecord[]; total: number }> {
    let returns = Array.from(returnStore.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    if (options.status) {
      returns = returns.filter((r) => r.status === options.status);
    }

    const total = returns.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = returns.slice(start, start + options.limit);

    return { data: paginatedData, total };
  }

  /**
   * Approve return (Admin/Seller)
   */
  async approveReturn(
    returnId: string,
    approverId: string,
    refundAmount: number
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);

    if (!returnRequest) {
      throw new NotFoundError('Return request');
    }

    if (returnRequest.status !== 'pending') {
      throw new ValidationError('Return is not pending');
    }

    returnRequest.status = 'approved';
    returnRequest.approvedAt = new Date();
    returnRequest.approvedBy = approverId;
    returnRequest.refundAmount = refundAmount;

    // Generate return label
    returnRequest.returnLabelUrl = `https://storage.googleapis.com/grandgold-returns/${returnId}.pdf`;
    returnRequest.trackingNumber = `RET${returnId.slice(-8).toUpperCase()}`;

    returnStore.set(returnId, returnRequest);

    return returnRequest;
  }

  /**
   * Reject return (Admin/Seller)
   */
  async rejectReturn(
    returnId: string,
    approverId: string,
    reason: string
  ): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);

    if (!returnRequest) {
      throw new NotFoundError('Return request');
    }

    if (returnRequest.status !== 'pending') {
      throw new ValidationError('Return is not pending');
    }

    returnRequest.status = 'rejected';
    returnRequest.rejectedAt = new Date();
    returnRequest.rejectedBy = approverId;
    returnRequest.rejectionReason = reason;

    returnStore.set(returnId, returnRequest);

    return returnRequest;
  }

  /**
   * Process return (after item received)
   */
  async processReturn(returnId: string, adminId: string): Promise<ReturnRecord> {
    const returnRequest = returnStore.get(returnId);

    if (!returnRequest) {
      throw new NotFoundError('Return request');
    }

    if (returnRequest.status !== 'approved') {
      throw new ValidationError('Return must be approved before processing');
    }

    returnRequest.status = 'processed';
    returnRequest.processedAt = new Date();
    returnRequest.processedBy = adminId;

    // Initiate refund (in production, call payment service)
    returnRequest.status = 'refunded';
    returnRequest.refundedAt = new Date();

    returnStore.set(returnId, returnRequest);

    return returnRequest;
  }

  /**
   * Cancel return request (Customer)
   */
  async cancelReturn(returnId: string, userId: string): Promise<void> {
    const returnRequest = await this.getReturn(returnId, userId);

    if (returnRequest.status !== 'pending') {
      throw new ValidationError('Return cannot be cancelled');
    }

    returnRequest.status = 'cancelled';
    returnRequest.cancelledAt = new Date();

    returnStore.set(returnId, returnRequest);
  }
}
