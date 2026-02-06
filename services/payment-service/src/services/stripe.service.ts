import Stripe from 'stripe';
import { generateId } from '@grandgold/utils';

// Initialize Stripe (mock mode if no API key)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as Stripe.LatestApiVersion })
  : null;

// In-memory store for demo mode
const paymentIntentStore = new Map<string, any>();
const customerStore = new Map<string, any>();

export class StripeService {
  /**
   * Create a payment intent
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customerId: string;
    metadata?: Record<string, any>;
  }): Promise<{ id: string; clientSecret: string; status: string }> {
    if (stripe) {
      // Real Stripe integration
      const stripeCustomerId = await this.getOrCreateCustomer(data.customerId);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        metadata: data.metadata,
      });
      
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
      };
    }
    
    // Mock mode
    const id = `pi_${generateId('stripe')}`;
    const intent = {
      id,
      clientSecret: `${id}_secret_${generateId('secret')}`,
      status: 'requires_payment_method',
      amount: data.amount,
      currency: data.currency,
      customerId: data.customerId,
      metadata: data.metadata,
      createdAt: new Date(),
    };
    
    paymentIntentStore.set(id, intent);
    
    return {
      id: intent.id,
      clientSecret: intent.clientSecret,
      status: intent.status,
    };
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{
    status: string;
    requiresAction: boolean;
    actionUrl?: string;
  }> {
    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      
      return {
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        actionUrl: paymentIntent.next_action?.redirect_to_url?.url ?? undefined,
      };
    }
    
    // Mock mode
    const intent = paymentIntentStore.get(paymentIntentId);
    if (intent) {
      intent.status = 'succeeded';
      intent.paymentMethodId = paymentMethodId;
      intent.confirmedAt = new Date();
      paymentIntentStore.set(paymentIntentId, intent);
    }
    
    return {
      status: 'succeeded',
      requiresAction: false,
    };
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    if (stripe) {
      await stripe.paymentIntents.cancel(paymentIntentId);
      return;
    }
    
    // Mock mode
    const intent = paymentIntentStore.get(paymentIntentId);
    if (intent) {
      intent.status = 'canceled';
      paymentIntentStore.set(paymentIntentId, intent);
    }
  }

  /**
   * Create a setup intent for saving cards
   */
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
    if (stripe) {
      const stripeCustomerId = await this.getOrCreateCustomer(customerId);
      
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
      });
      
      return { clientSecret: setupIntent.client_secret! };
    }
    
    // Mock mode
    return { clientSecret: `seti_${generateId('setup')}_secret_${generateId('secret')}` };
  }

  /**
   * Get saved cards
   */
  async getSavedCards(customerId: string): Promise<any[]> {
    if (stripe) {
      const stripeCustomerId = await this.getOrCreateCustomer(customerId);
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      });
      
      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      }));
    }
    
    // Mock mode
    return [
      { id: 'pm_mock1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027 },
      { id: 'pm_mock2', brand: 'mastercard', last4: '5556', expMonth: 6, expYear: 2026 },
    ];
  }

  /**
   * Delete a saved card
   */
  async deleteCard(customerId: string, cardId: string): Promise<void> {
    if (stripe) {
      await stripe.paymentMethods.detach(cardId);
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
    if (stripe) {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
      
      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    }
    
    // Mock mode
    return {
      id: `re_${generateId('refund')}`,
      status: 'succeeded',
      amount,
    };
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateCustomer(userId: string): Promise<string> {
    const existing = customerStore.get(userId);
    if (existing) {
      return existing;
    }
    
    if (stripe) {
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      
      customerStore.set(userId, customer.id);
      return customer.id;
    }
    
    // Mock mode
    const customerId = `cus_${generateId('customer')}`;
    customerStore.set(userId, customerId);
    return customerId;
  }

  /**
   * Get payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<{
    type: string;
    last4?: string;
    brand?: string;
    exp_month?: number;
    exp_year?: number;
  }> {
    if (stripe) {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      return {
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      };
    }
    
    // Mock mode
    return {
      type: 'card',
      last4: '4242',
      brand: 'visa',
      exp_month: 12,
      exp_year: 2025,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event | null {
    if (!stripe) {
      return null;
    }
    
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return null;
    }
  }
}
