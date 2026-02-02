import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import Redis from 'ioredis';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'upi' | 'bank_account';
  provider: 'stripe' | 'razorpay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
  createdAt: Date;
}

export class SavedPaymentService {
  private stripeService: StripeService;
  private razorpayService: RazorpayService;

  constructor() {
    this.stripeService = new StripeService();
    this.razorpayService = new RazorpayService();
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(
    userId: string,
    paymentMethodId: string,
    provider: 'stripe' | 'razorpay',
    isDefault: boolean = false
  ): Promise<SavedPaymentMethod> {
    // Fetch payment method details from provider
    let paymentMethodData: any;

    if (provider === 'stripe') {
      paymentMethodData = await this.stripeService.getPaymentMethod(paymentMethodId);
    } else if (provider === 'razorpay') {
      paymentMethodData = await this.razorpayService.getPaymentMethod(paymentMethodId);
    }

    const savedMethodId = generateId('pm');

    const savedMethod: SavedPaymentMethod = {
      id: savedMethodId,
      userId,
      type: paymentMethodData.type || 'card',
      provider,
      last4: paymentMethodData.last4,
      brand: paymentMethodData.brand,
      expiryMonth: paymentMethodData.exp_month,
      expiryYear: paymentMethodData.exp_year,
      upiId: paymentMethodData.upi_id,
      bankName: paymentMethodData.bank_name,
      accountNumber: paymentMethodData.account_number,
      isDefault,
      createdAt: new Date(),
    };

    // If this is default, unset other defaults
    if (isDefault) {
      await this.unsetDefault(userId);
    }

    // Store in Redis
    await redis.hset(
      `saved_payments:${userId}`,
      savedMethodId,
      JSON.stringify(savedMethod)
    );

    // Add to user's payment methods list
    await redis.sadd(`saved_payments:list:${userId}`, savedMethodId);

    return savedMethod;
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    const methodIds = await redis.smembers(`saved_payments:list:${userId}`);
    const methods: SavedPaymentMethod[] = [];

    for (const methodId of methodIds) {
      const data = await redis.hget(`saved_payments:${userId}`, methodId);
      if (data) {
        methods.push(JSON.parse(data));
      }
    }

    // Sort: default first, then by creation date
    return methods.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get saved payment method
   */
  async getSavedPaymentMethod(
    methodId: string,
    userId: string
  ): Promise<SavedPaymentMethod> {
    const data = await redis.hget(`saved_payments:${userId}`, methodId);

    if (!data) {
      throw new NotFoundError('Saved payment method');
    }

    const method = JSON.parse(data) as SavedPaymentMethod;

    if (method.userId !== userId) {
      throw new NotFoundError('Saved payment method');
    }

    return method;
  }

  /**
   * Set default payment method
   */
  async setDefault(methodId: string, userId: string): Promise<void> {
    const method = await this.getSavedPaymentMethod(methodId, userId);

    await this.unsetDefault(userId);

    method.isDefault = true;
    await redis.hset(
      `saved_payments:${userId}`,
      methodId,
      JSON.stringify(method)
    );
  }

  /**
   * Unset default payment methods
   */
  private async unsetDefault(userId: string): Promise<void> {
    const methods = await this.getSavedPaymentMethods(userId);

    for (const method of methods) {
      if (method.isDefault) {
        method.isDefault = false;
        await redis.hset(
          `saved_payments:${userId}`,
          method.id,
          JSON.stringify(method)
        );
      }
    }
  }

  /**
   * Delete saved payment method
   */
  async deletePaymentMethod(methodId: string, userId: string): Promise<void> {
    const method = await this.getSavedPaymentMethod(methodId, userId);

    await redis.hdel(`saved_payments:${userId}`, methodId);
    await redis.srem(`saved_payments:list:${userId}`, methodId);
  }

  /**
   * Use saved payment method for payment
   */
  async useSavedPaymentMethod(
    methodId: string,
    userId: string,
    amount: number,
    currency: string,
    country: string
  ): Promise<{ paymentIntentId: string; clientSecret?: string }> {
    const method = await this.getSavedPaymentMethod(methodId, userId);

    if (method.provider === 'stripe') {
      const result = await this.stripeService.createPaymentIntent({
        amount: amount * 100,
        currency: currency.toLowerCase(),
        customerId: userId,
      });
      return {
        paymentIntentId: result.id,
        clientSecret: result.clientSecret,
      };
    } else if (method.provider === 'razorpay') {
      const result = await this.razorpayService.createOrder({
        amount: amount * 100,
        currency: currency.toUpperCase(),
        receipt: generateId('receipt'),
      });
      return {
        paymentIntentId: result.id,
      };
    }

    throw new ValidationError('Unsupported payment provider');
  }
}
