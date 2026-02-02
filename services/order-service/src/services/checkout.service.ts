import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import { CartService } from './cart.service';
import { TaxService } from './tax.service';
import { AbandonedCartService } from './abandoned-cart.service';

// In-memory store for demo
const checkoutStore = new Map<string, any>();

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: Country;
  coordinates?: { lat: number; lng: number };
}

interface BillingAddress {
  sameAsShipping: boolean;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: Country;
}

interface CheckoutInput {
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  deliveryOption: 'standard' | 'express' | 'click_collect';
  notes?: string;
  giftWrapping?: boolean;
  giftMessage?: string;
  insuranceIncluded?: boolean;
  scheduledDeliveryDate?: string;
  isExpressCheckout?: boolean;
}

const cartService = new CartService();
const taxService = new TaxService();
const abandonedCartService = new AbandonedCartService();

export class CheckoutService {
  /**
   * Initiate checkout
   */
  async initiateCheckout(userId: string, input: CheckoutInput): Promise<any> {
    const cart = await cartService.getCart(userId);
    
    if (cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }
    
    // Validate cart
    const validation = await cartService.validateCart(userId);
    if (!validation.valid) {
      throw new ValidationError('Cart has issues', { issues: validation.issues });
    }
    
    const checkoutId = generateId('chk');
    
    // Gift wrapping fee
    const giftWrappingFee = input.giftWrapping ? 250 : 0;

    // Insurance: 0.5% of order value for high-value items (>50k)
    let insuranceCost = 0;
    if (input.insuranceIncluded && cart.subtotal > 50000) {
      insuranceCost = Math.round(cart.subtotal * 0.005);
    }

    const checkout = {
      id: checkoutId,
      userId,
      cart: cart,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress.sameAsShipping 
        ? input.shippingAddress 
        : input.billingAddress,
      deliveryOption: input.deliveryOption,
      notes: input.notes,
      giftWrapping: input.giftWrapping ?? false,
      giftMessage: input.giftMessage,
      insuranceIncluded: input.insuranceIncluded ?? false,
      scheduledDeliveryDate: input.scheduledDeliveryDate,
      isExpressCheckout: input.isExpressCheckout ?? false,
      subtotal: cart.subtotal,
      shippingCost: 0,
      tax: 0,
      discount: 0,
      giftWrappingFee,
      insuranceCost,
      total: 0,
      promoCode: null,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Calculate shipping
    checkout.shippingCost = await this.calculateShipping(
      input.shippingAddress,
      input.deliveryOption,
      cart.subtotal
    );
    
    // Calculate tax
    const taxResult = await taxService.calculateTax(
      cart.items,
      input.shippingAddress.country
    );
    checkout.tax = taxResult.totalTax;
    
    // Calculate total (including gift wrapping and insurance)
    checkout.total =
      checkout.subtotal +
      checkout.shippingCost +
      checkout.tax +
      giftWrappingFee +
      insuranceCost -
      checkout.discount;
    
    checkoutStore.set(checkoutId, checkout);
    
    return checkout;
  }

  /**
   * Get checkout
   */
  async getCheckout(checkoutId: string, userId: string): Promise<any> {
    const checkout = checkoutStore.get(checkoutId);
    
    if (!checkout || checkout.userId !== userId) {
      throw new NotFoundError('Checkout');
    }
    
    // Check if expired
    if (new Date() > new Date(checkout.expiresAt)) {
      throw new ValidationError('Checkout session expired');
    }
    
    return checkout;
  }

  /**
   * Calculate totals
   */
  async calculateTotals(checkoutId: string, userId: string, promoCode?: string): Promise<any> {
    const checkout = await this.getCheckout(checkoutId, userId);
    
    // Recalculate with potentially updated prices
    const cart = await cartService.getCart(userId);
    checkout.subtotal = cart.subtotal;
    
    // Apply promo code if provided
    if (promoCode) {
      const promoResult = await this.validatePromoCode(promoCode, checkout.subtotal);
      checkout.promoCode = promoCode;
      checkout.discount = promoResult.discount;
    }
    
    checkout.total = checkout.subtotal + checkout.shippingCost + checkout.tax - checkout.discount;
    checkout.updatedAt = new Date();
    
    checkoutStore.set(checkoutId, checkout);
    
    return {
      subtotal: checkout.subtotal,
      shipping: checkout.shippingCost,
      tax: checkout.tax,
      discount: checkout.discount,
      total: checkout.total,
      currency: cart.currency,
    };
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(checkoutId: string, userId: string, code: string): Promise<any> {
    const checkout = await this.getCheckout(checkoutId, userId);
    
    const promoResult = await this.validatePromoCode(code, checkout.subtotal);
    
    checkout.promoCode = code;
    checkout.discount = promoResult.discount;
    checkout.total = checkout.subtotal + checkout.shippingCost + checkout.tax - checkout.discount;
    checkout.updatedAt = new Date();
    
    checkoutStore.set(checkoutId, checkout);
    
    return {
      applied: true,
      code,
      discount: promoResult.discount,
      newTotal: checkout.total,
    };
  }

  /**
   * Remove promo code
   */
  async removePromoCode(checkoutId: string, userId: string): Promise<any> {
    const checkout = await this.getCheckout(checkoutId, userId);
    
    checkout.promoCode = null;
    checkout.discount = 0;
    checkout.total = checkout.subtotal + checkout.shippingCost + checkout.tax;
    checkout.updatedAt = new Date();
    
    checkoutStore.set(checkoutId, checkout);
    
    return { removed: true, newTotal: checkout.total };
  }

  /**
   * Confirm checkout and create order
   */
  async confirmCheckout(
    checkoutId: string,
    userId: string,
    payment: { paymentIntentId: string; paymentMethod: string }
  ): Promise<any> {
    const checkout = await this.getCheckout(checkoutId, userId);
    
    // Verify payment (mock - in production, verify with payment service)
    const paymentVerified = true;
    
    if (!paymentVerified) {
      throw new ValidationError('Payment verification failed');
    }
    
    // Generate order number
    const orderNumber = this.generateOrderNumber(checkout.shippingAddress.country);
    
    const order = {
      id: generateId('ord'),
      orderNumber,
      invoiceNumber: `INV-${orderNumber}`,
      checkoutId,
      customerId: userId,
      items: checkout.cart.items.map((item: any) => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        sellerId: item.sellerId, // Hidden until now
        quantity: item.quantity,
        price: item.price,
        goldWeight: item.goldWeight,
        purity: item.purity,
      })),
      shippingAddress: checkout.shippingAddress,
      billingAddress: checkout.billingAddress,
      deliveryOption: checkout.deliveryOption,
      notes: checkout.notes,
      subtotal: checkout.subtotal,
      shippingCost: checkout.shippingCost,
      tax: checkout.tax,
      discount: checkout.discount,
      total: checkout.total,
      currency: checkout.cart.currency,
      country: checkout.shippingAddress.country,
      paymentMethod: payment.paymentMethod,
      paymentIntentId: payment.paymentIntentId,
      paymentStatus: 'paid',
      status: 'confirmed',
      statusHistory: [
        { status: 'confirmed', timestamp: new Date(), note: 'Order placed successfully' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Mark checkout as completed
    checkout.status = 'completed';
    checkout.orderId = order.id;
    checkoutStore.set(checkoutId, checkout);
    
    // Clear cart and remove from abandoned cart tracking
    await cartService.clearCart(userId);
    await abandonedCartService.deleteAbandonedCart(userId);

    // In production, save order to database and trigger notifications

    return order;
  }

  /**
   * Get shipping options
   */
  async getShippingOptions(checkoutId: string, userId: string): Promise<any[]> {
    const checkout = await this.getCheckout(checkoutId, userId);
    const country = checkout.shippingAddress.country;
    
    const options = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        description: 'Secure insured delivery',
        estimatedDays: country === 'IN' ? '5-7' : '7-10',
        price: this.getStandardShippingRate(country, checkout.subtotal),
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Priority secured delivery',
        estimatedDays: country === 'IN' ? '2-3' : '3-5',
        price: this.getExpressShippingRate(country),
      },
    ];
    
    // Add click & collect if available
    if (checkout.cart.items.some((i: any) => i.hasClickCollect)) {
      options.push({
        id: 'click_collect',
        name: 'Click & Collect',
        description: 'Pick up from store',
        estimatedDays: '1-2',
        price: 0,
      });
    }
    
    return options;
  }

  /**
   * Set click and collect
   */
  async setClickCollect(
    checkoutId: string,
    userId: string,
    data: { storeId: string; collectionDate: string; collectionTime: string }
  ): Promise<any> {
    const checkout = await this.getCheckout(checkoutId, userId);
    
    checkout.deliveryOption = 'click_collect';
    checkout.clickCollect = {
      storeId: data.storeId,
      collectionDate: data.collectionDate,
      collectionTime: data.collectionTime,
    };
    checkout.shippingCost = 0;
    checkout.total = checkout.subtotal + checkout.tax - checkout.discount;
    checkout.updatedAt = new Date();
    
    checkoutStore.set(checkoutId, checkout);
    
    return checkout;
  }

  /**
   * Calculate shipping cost
   */
  private async calculateShipping(
    address: ShippingAddress,
    option: string,
    subtotal: number
  ): Promise<number> {
    if (option === 'click_collect') {
      return 0;
    }
    
    if (option === 'express') {
      return this.getExpressShippingRate(address.country);
    }
    
    return this.getStandardShippingRate(address.country, subtotal);
  }

  private getStandardShippingRate(country: Country, subtotal: number): number {
    // Free shipping above threshold
    const thresholds: Record<Country, number> = {
      IN: 50000,
      AE: 2000,
      UK: 500,
    };
    
    if (subtotal >= thresholds[country]) {
      return 0;
    }
    
    const rates: Record<Country, number> = {
      IN: 500,
      AE: 75,
      UK: 25,
    };
    
    return rates[country] || 500;
  }

  private getExpressShippingRate(country: Country): number {
    const rates: Record<Country, number> = {
      IN: 1500,
      AE: 150,
      UK: 50,
    };
    
    return rates[country] || 1500;
  }

  /**
   * Validate promo code
   */
  private async validatePromoCode(
    code: string,
    subtotal: number
  ): Promise<{ valid: boolean; discount: number }> {
    // Mock promo codes
    const promoCodes: Record<string, { type: 'percentage' | 'fixed'; value: number; minOrder: number }> = {
      'GOLD10': { type: 'percentage', value: 10, minOrder: 10000 },
      'FLAT500': { type: 'fixed', value: 500, minOrder: 5000 },
    };
    
    const promo = promoCodes[code.toUpperCase()];
    
    if (!promo) {
      throw new ValidationError('Invalid promo code');
    }
    
    if (subtotal < promo.minOrder) {
      throw new ValidationError(`Minimum order value of ${promo.minOrder} required`);
    }
    
    const discount = promo.type === 'percentage' 
      ? (subtotal * promo.value) / 100 
      : promo.value;
    
    return { valid: true, discount };
  }

  private generateOrderNumber(country: Country): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    return `GG-${country}-${dateStr}-${seq}`;
  }
}
