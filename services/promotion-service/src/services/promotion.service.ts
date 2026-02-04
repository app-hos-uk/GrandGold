import { generateId } from '@grandgold/utils';

export type PromoType = 'percentage' | 'fixed' | 'free_shipping' | 'bogo';
export type PromoScope = 'entire_order' | 'category' | 'product' | 'min_quantity';
export type PromoStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser: number;
  usedCount: number;
  scope: PromoScope;
  scopeCategoryIds?: string[];
  scopeProductIds?: string[];
  countries: string[];
  status: PromoStatus;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AutomaticDiscount {
  id: string;
  name: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  scope: PromoScope;
  scopeCategoryIds?: string[];
  countries: string[];
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSale {
  id: string;
  name: string;
  description?: string;
  discountType: PromoType;
  discountValue: number;
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

const couponsStore = new Map<string, Coupon>();
const automaticDiscountsStore = new Map<string, AutomaticDiscount>();
const flashSalesStore = new Map<string, FlashSale>();

// Seed demo data
const seedCoupons: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>[] = [
  { code: 'GOLD10', description: '10% off on gold', type: 'percentage', value: 10, minOrderAmount: 10000, usageLimitPerUser: 1, scope: 'entire_order', countries: ['IN', 'AE', 'UK'], status: 'active' },
  { code: 'FLAT500', description: 'Flat ₹500 off', type: 'fixed', value: 500, minOrderAmount: 5000, usageLimitPerUser: 1, scope: 'entire_order', countries: ['IN'], status: 'active' },
  { code: 'FREESHIP', description: 'Free shipping', type: 'free_shipping', value: 0, minOrderAmount: 25000, usageLimitPerUser: 1, scope: 'entire_order', countries: ['IN', 'AE', 'UK'], status: 'active' },
];
seedCoupons.forEach((c, i) => {
  const id = `coup-${i + 1}`;
  const now = new Date().toISOString();
  couponsStore.set(id, { ...c, id, usedCount: 0, createdAt: now, updatedAt: now });
});

export class PromotionService {
  // --- Coupons ---
  listCoupons(params: { page?: number; limit?: number; status?: string; country?: string }): { data: Coupon[]; total: number } {
    let list = Array.from(couponsStore.values());
    if (params.status) list = list.filter((c) => c.status === params.status);
    if (params.country) list = list.filter((c) => c.countries.includes(params.country!));
    const total = list.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    list = list.slice((page - 1) * limit, page * limit);
    return { data: list, total };
  }

  getCoupon(id: string): Coupon | undefined {
    return couponsStore.get(id);
  }

  getCouponByCode(code: string): Coupon | undefined {
    return Array.from(couponsStore.values()).find((c) => c.code.toUpperCase() === code.toUpperCase());
  }

  createCoupon(input: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Coupon {
    const existing = this.getCouponByCode(input.code);
    if (existing) throw new Error('Coupon code already exists');
    const id = generateId('coup');
    const now = new Date().toISOString();
    const coupon: Coupon = { ...input, id, usedCount: 0, createdAt: now, updatedAt: now };
    couponsStore.set(id, coupon);
    return coupon;
  }

  updateCoupon(id: string, input: Partial<Omit<Coupon, 'id' | 'createdAt'>>): Coupon {
    const existing = couponsStore.get(id);
    if (!existing) throw new Error('Coupon not found');
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    couponsStore.set(id, updated);
    return updated;
  }

  deleteCoupon(id: string): void {
    if (!couponsStore.has(id)) throw new Error('Coupon not found');
    couponsStore.delete(id);
  }

  validateCoupon(code: string, subtotal: number, country: string, userId?: string): { valid: boolean; discount: number; message?: string } {
    const coupon = this.getCouponByCode(code);
    if (!coupon) return { valid: false, discount: 0, message: 'Invalid promo code' };
    if (coupon.status !== 'active') return { valid: false, discount: 0, message: 'Promo code is not active' };
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return { valid: false, discount: 0, message: 'Promo not yet started' };
    if (coupon.endsAt && new Date(coupon.endsAt) < new Date()) return { valid: false, discount: 0, message: 'Promo expired' };
    if (!coupon.countries.includes(country)) return { valid: false, discount: 0, message: 'Not valid in your region' };
    if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) return { valid: false, discount: 0, message: `Minimum order ${coupon.minOrderAmount}` };
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { valid: false, discount: 0, message: 'Usage limit reached' };

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount != null) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // Caller applies shipping waiver
    }
    return { valid: true, discount };
  }

  recordCouponUsage(id: string): void {
    const c = couponsStore.get(id);
    if (c) {
      c.usedCount += 1;
      c.updatedAt = new Date().toISOString();
      couponsStore.set(id, c);
    }
  }

  // --- Automatic discounts ---
  listAutomaticDiscounts(params: { page?: number; limit?: number; country?: string }): { data: AutomaticDiscount[]; total: number } {
    let list = Array.from(automaticDiscountsStore.values());
    if (params.country) list = list.filter((d) => d.countries.includes(params.country!));
    const total = list.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    list = list.slice((page - 1) * limit, page * limit);
    return { data: list, total };
  }

  createAutomaticDiscount(input: Omit<AutomaticDiscount, 'id' | 'createdAt' | 'updatedAt'>): AutomaticDiscount {
    const id = generateId('auto');
    const now = new Date().toISOString();
    const discount: AutomaticDiscount = { ...input, id, createdAt: now, updatedAt: now };
    automaticDiscountsStore.set(id, discount);
    return discount;
  }

  updateAutomaticDiscount(id: string, input: Partial<Omit<AutomaticDiscount, 'id' | 'createdAt'>>): AutomaticDiscount {
    const existing = automaticDiscountsStore.get(id);
    if (!existing) throw new Error('Automatic discount not found');
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    automaticDiscountsStore.set(id, updated);
    return updated;
  }

  deleteAutomaticDiscount(id: string): void {
    if (!automaticDiscountsStore.has(id)) throw new Error('Automatic discount not found');
    automaticDiscountsStore.delete(id);
  }

  // --- Flash sales ---
  listFlashSales(params: { page?: number; limit?: number; activeOnly?: boolean }): { data: FlashSale[]; total: number } {
    let list = Array.from(flashSalesStore.values());
    if (params.activeOnly) {
      const now = new Date().toISOString();
      list = list.filter((f) => f.isActive && f.startsAt <= now && f.endsAt >= now);
    }
    const total = list.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    list = list.slice((page - 1) * limit, page * limit);
    return { data: list, total };
  }

  createFlashSale(input: Omit<FlashSale, 'id' | 'createdAt' | 'updatedAt'>): FlashSale {
    const id = generateId('flash');
    const now = new Date().toISOString();
    const sale: FlashSale = { ...input, id, createdAt: now, updatedAt: now };
    flashSalesStore.set(id, sale);
    return sale;
  }

  updateFlashSale(id: string, input: Partial<Omit<FlashSale, 'id' | 'createdAt'>>): FlashSale {
    const existing = flashSalesStore.get(id);
    if (!existing) throw new Error('Flash sale not found');
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    flashSalesStore.set(id, updated);
    return updated;
  }

  deleteFlashSale(id: string): void {
    if (!flashSalesStore.has(id)) throw new Error('Flash sale not found');
    flashSalesStore.delete(id);
  }
}
