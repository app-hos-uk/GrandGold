import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  sellerSettlements,
  sellers,
  type NewSellerSettlement,
  type SellerSettlement,
} from '../schema/sellers';

export async function createSettlement(data: NewSellerSettlement): Promise<SellerSettlement> {
  const result = await db.insert(sellerSettlements).values(data).returning();
  return result[0];
}

export async function getSettlementById(id: string): Promise<SellerSettlement | undefined> {
  const result = await db
    .select()
    .from(sellerSettlements)
    .where(eq(sellerSettlements.id, id))
    .limit(1);
  return result[0];
}

export async function getSettlementsBySeller(
  sellerId: string,
  options: { status?: string; limit?: number; offset?: number }
): Promise<{ data: SellerSettlement[]; total: number }> {
  const conditions = [eq(sellerSettlements.sellerId, sellerId)];
  if (options.status) {
    conditions.push(eq(sellerSettlements.status, options.status as 'pending' | 'processing' | 'completed' | 'failed'));
  }

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const data = await db
    .select()
    .from(sellerSettlements)
    .where(and(...conditions))
    .orderBy(desc(sellerSettlements.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sellerSettlements)
    .where(and(...conditions));
  const total = countResult[0]?.count ?? 0;

  return { data, total };
}

export async function getAllSettlementOrderIds(): Promise<string[]> {
  const rows = await db
    .select({ orderIds: sellerSettlements.orderIds })
    .from(sellerSettlements);

  const ids = new Set<string>();
  for (const row of rows) {
    const arr = row.orderIds as string[] | null;
    if (Array.isArray(arr)) arr.forEach((id) => ids.add(id));
  }
  return Array.from(ids);
}

export async function updateSettlementStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  details?: { paymentReference?: string; paymentMethod?: string; paidAt?: Date }
): Promise<SellerSettlement | undefined> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (details?.paymentReference) updates.paymentReference = details.paymentReference;
  if (details?.paymentMethod) updates.paymentMethod = details.paymentMethod;
  if (details?.paidAt) updates.paidAt = details.paidAt;

  const result = await db
    .update(sellerSettlements)
    .set(updates as Record<string, Date | string>)
    .where(eq(sellerSettlements.id, id))
    .returning();
  return result[0];
}

export async function getSellerIdByUserId(userId: string): Promise<string | undefined> {
  const result = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.userId, userId))
    .limit(1);
  return result[0]?.id;
}
