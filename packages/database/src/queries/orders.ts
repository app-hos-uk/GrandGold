import { eq, and } from 'drizzle-orm';
import { db } from '../client';
import { orders } from '../schema/orders';

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
