import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country, OrderStatus } from '@grandgold/types';
import { addNotification } from '../lib/notification-store';

// In-memory store for demo
const orderStore = new Map<string, any>();

interface OrderFilters {
  status?: string;
  page: number;
  limit: number;
}

interface AdminOrderFilters extends OrderFilters {
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  adminCountry: Country | 'super_admin';
}

export class OrderService {
  /**
   * Get customer's orders
   */
  async getCustomerOrders(userId: string, filters: OrderFilters): Promise<{ data: any[]; total: number }> {
    let orders = Array.from(orderStore.values())
      .filter((o) => o.customerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (filters.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    
    const total = orders.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedData = orders.slice(start, start + filters.limit);
    
    return { data: paginatedData, total };
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string, userId: string): Promise<any> {
    const order = orderStore.get(orderId);
    
    if (!order || order.customerId !== userId) {
      throw new NotFoundError('Order');
    }
    
    return order;
  }

  /**
   * Get invoice for order
   */
  async getInvoice(orderId: string, userId: string): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    
    return {
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.createdAt,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        address: order.shippingAddress,
      },
      items: order.items.map((item: any) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      invoiceUrl: `https://storage.googleapis.com/grandgold-invoices/${orderId}.pdf`,
    };
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, userId: string, reason: string): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    
    // Check if order can be cancelled
    const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ValidationError('Order cannot be cancelled at this stage');
    }
    
    order.status = 'cancellation_requested';
    order.cancellationReason = reason;
    order.cancellationRequestedAt = new Date();
    order.updatedAt = new Date();
    
    orderStore.set(orderId, order);
    
    return order;
  }

  /**
   * Request return for an order
   */
  async requestReturn(
    orderId: string,
    userId: string,
    data: { items: string[]; reason: string; images?: string[] }
  ): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    
    if (order.status !== 'delivered') {
      throw new ValidationError('Returns can only be requested for delivered orders');
    }
    
    // Check if return window is still open (e.g., 7 days)
    const deliveryDate = new Date(order.deliveredAt);
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      throw new ValidationError('Return window has expired');
    }
    
    const returnRequest = {
      id: generateId('ret'),
      orderId,
      items: data.items,
      reason: data.reason,
      images: data.images,
      status: 'pending',
      createdAt: new Date(),
    };
    
    order.returnRequest = returnRequest;
    order.status = 'return_requested';
    order.updatedAt = new Date();
    
    orderStore.set(orderId, order);
    
    return returnRequest;
  }

  /**
   * Add review for an order
   */
  async addReview(
    orderId: string,
    userId: string,
    data: { productId: string; rating: number; title?: string; content?: string; images?: string[] }
  ): Promise<any> {
    const order = await this.getOrder(orderId, userId);
    
    if (order.status !== 'delivered') {
      throw new ValidationError('Reviews can only be added for delivered orders');
    }
    
    // Check if product exists in order
    const item = order.items.find((i: any) => i.productId === data.productId);
    if (!item) {
      throw new ValidationError('Product not found in order');
    }
    
    const review = {
      id: generateId('rev'),
      orderId,
      productId: data.productId,
      userId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      images: data.images,
      isVerifiedPurchase: true,
      createdAt: new Date(),
    };
    
    return review;
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(filters: AdminOrderFilters): Promise<{ data: any[]; total: number }> {
    let orders = Array.from(orderStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Filter by admin's country if not super admin
    if (filters.adminCountry && filters.adminCountry !== 'super_admin') {
      orders = orders.filter((o) => o.country === filters.adminCountry);
    }
    
    if (filters.country) {
      orders = orders.filter((o) => o.country === filters.country);
    }
    if (filters.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    if (filters.dateFrom) {
      orders = orders.filter((o) => new Date(o.createdAt) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      orders = orders.filter((o) => new Date(o.createdAt) <= new Date(filters.dateTo!));
    }
    
    const total = orders.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedData = orders.slice(start, start + filters.limit);
    
    return { data: paginatedData, total };
  }

  /**
   * Update order status (Admin)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    adminUserId: string,
    note?: string
  ): Promise<any> {
    const order = orderStore.get(orderId);
    
    if (!order) {
      throw new NotFoundError('Order');
    }
    
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      from: previousStatus,
      to: status,
      changedBy: adminUserId,
      note,
      changedAt: new Date(),
    });
    
    // Update specific timestamps
    if (status === 'confirmed') {
      order.confirmedAt = new Date();
    } else if (status === 'shipped') {
      order.shippedAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }
    
    orderStore.set(orderId, order);

    const customerId = order.customerId;
    const isClickCollect = (order as { deliveryOption?: string }).deliveryOption === 'click_collect';
    if (customerId && ['confirmed', 'shipped', 'delivered'].includes(status)) {
      const messages: Record<string, { title: string; body: string; link?: string }> = {
        confirmed: isClickCollect
          ? { title: 'Ready for pickup', body: `Order ${orderId} is ready for collection at your selected store.`, link: `/account/orders` }
          : { title: 'Order confirmed', body: `Order ${orderId} has been confirmed.`, link: `/account/orders` },
        shipped: { title: 'Order shipped', body: `Order ${orderId} is on its way!`, link: `/account/orders` },
        delivered: isClickCollect
          ? { title: 'Collected', body: `Order ${orderId} has been collected.`, link: `/account/orders` }
          : { title: 'Order delivered', body: `Order ${orderId} has been delivered.`, link: `/account/orders` },
      };
      const msg = messages[status];
      if (msg) {
        addNotification(customerId, { type: 'order', ...msg }).catch(() => {});
      }
    }

    return order;
  }
}
