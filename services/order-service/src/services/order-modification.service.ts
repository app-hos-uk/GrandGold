import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { OrderStatus } from '@grandgold/types';

interface ModificationRecord {
  id: string; orderId: string; userId: string;
  changes: Record<string, unknown>; status: string;
  requestedAt: Date; approvedAt: Date | null; rejectedAt: Date | null;
  rejectionReason: string | null;
  [key: string]: unknown;
}

// In-memory store for demo
const modificationStore = new Map<string, ModificationRecord>();

interface ModifyOrderInput {
  orderId: string;
  userId: string;
  changes: {
    shippingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    deliveryOption?: 'standard' | 'express' | 'click_collect';
    notes?: string;
  };
}

export class OrderModificationService {
  /**
   * Request order modification
   */
  async requestModification(input: ModifyOrderInput): Promise<ModificationRecord> {
    // In production, verify order exists and belongs to user
    const order = { id: input.orderId, status: 'confirmed' }; // Mock

    // Check if order can be modified
    const modifiableStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing'];
    if (!modifiableStatuses.includes(order.status as OrderStatus)) {
      throw new ValidationError('Order cannot be modified at this stage');
    }

    const modificationId = generateId('mod');

    const modification = {
      id: modificationId,
      orderId: input.orderId,
      userId: input.userId,
      changes: input.changes,
      status: 'pending',
      requestedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    };

    modificationStore.set(modificationId, modification);

    return modification;
  }

  /**
   * Get order modifications
   */
  async getOrderModifications(orderId: string, userId: string): Promise<ModificationRecord[]> {
    const modifications = Array.from(modificationStore.values())
      .filter((m) => m.orderId === orderId && m.userId === userId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    return modifications;
  }

  /**
   * Approve modification (Admin/Seller)
   */
  async approveModification(
    modificationId: string,
    approverId: string
  ): Promise<ModificationRecord> {
    const modification = modificationStore.get(modificationId);

    if (!modification) {
      throw new NotFoundError('Modification request');
    }

    if (modification.status !== 'pending') {
      throw new ValidationError('Modification is not pending');
    }

    modification.status = 'approved';
    modification.approvedAt = new Date();
    modification.approvedBy = approverId;

    // Apply changes to order (in production)
    // await orderService.updateOrder(modification.orderId, modification.changes);

    modificationStore.set(modificationId, modification);

    return modification;
  }

  /**
   * Reject modification (Admin/Seller)
   */
  async rejectModification(
    modificationId: string,
    approverId: string,
    reason: string
  ): Promise<ModificationRecord> {
    const modification = modificationStore.get(modificationId);

    if (!modification) {
      throw new NotFoundError('Modification request');
    }

    if (modification.status !== 'pending') {
      throw new ValidationError('Modification is not pending');
    }

    modification.status = 'rejected';
    modification.rejectedAt = new Date();
    modification.rejectedBy = approverId;
    modification.rejectionReason = reason;

    modificationStore.set(modificationId, modification);

    return modification;
  }

  /**
   * Cancel modification request (Customer)
   */
  async cancelModification(modificationId: string, userId: string): Promise<void> {
    const modification = modificationStore.get(modificationId);

    if (!modification || modification.userId !== userId) {
      throw new NotFoundError('Modification request');
    }

    if (modification.status !== 'pending') {
      throw new ValidationError('Modification cannot be cancelled');
    }

    modification.status = 'cancelled';
    modification.cancelledAt = new Date();

    modificationStore.set(modificationId, modification);
  }
}
