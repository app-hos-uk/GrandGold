import { eq, and } from 'drizzle-orm';
import { db } from '../client';
import { orders, orderItems } from '../schema/orders';

export interface DeliveredOrderForSettlement {
  id: string;
  sellerId: string;
  total: string;
  subtotal: string;
  currency: string;
  paidAt: Date | null;
}

/**
 * Get delivered, paid orders that are not yet included in any settlement
 */
export async function getOrdersEligibleForSettlement(
  excludedOrderIds: string[] = []
): Promise<DeliveredOrderForSettlement[]> {
  const baseCondition = and(
    eq(orders.status, 'delivered'),
    eq(orders.paymentStatus, 'paid')
  );

  const query = db
    .select({
      id: orders.id,
      sellerId: orders.sellerId,
      total: orders.total,
      subtotal: orders.subtotal,
      currency: orders.currency,
      paidAt: orders.paidAt,
    })
    .from(orders)
    .where(baseCondition);

  const all = await query;

  if (excludedOrderIds.length > 0) {
    const excludedSet = new Set(excludedOrderIds);
    return all.filter((o) => !excludedSet.has(o.id));
  }
  return all;
}

export async function getOrderById(orderId: string) {
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

/**
 * Get all orders for a specific customer (used for GDPR export, order history, etc.)
 */
export async function getOrdersByCustomerId(customerId: string) {
  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      subtotal: orders.subtotal,
      currency: orders.currency,
      country: orders.country,
      shippingAddress: orders.shippingAddress,
      billingAddress: orders.billingAddress,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(orders.createdAt);

  // Enrich each order with its line items
  const enriched = await Promise.all(
    customerOrders.map(async (order) => {
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          productSnapshot: orderItems.productSnapshot,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          subtotal: orderItems.subtotal,
          total: orderItems.total,
          status: orderItems.status,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return { ...order, items };
    })
  );

  return enriched;
}
