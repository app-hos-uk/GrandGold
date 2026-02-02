import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

// In-memory store for demo
const paymentStore = new Map<string, any>();

interface CreatePaymentInput {
  userId: string;
  checkoutId: string;
  amount: number;
  currency: 'INR' | 'AED' | 'GBP' | 'USD';
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';
  country: Country;
  metadata?: Record<string, any>;
}

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
  countries: Country[];
  minAmount?: number;
  maxAmount?: number;
}

const stripeService = new StripeService();
const razorpayService = new RazorpayService();

export class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(input: CreatePaymentInput): Promise<any> {
    const paymentId = generateId('pay');
    
    // Determine which gateway to use based on country
    const gateway = this.getGateway(input.country, input.paymentMethod);
    
    let gatewayResponse: any;
    
    if (gateway === 'stripe') {
      gatewayResponse = await stripeService.createPaymentIntent({
        amount: this.convertToSmallestUnit(input.amount, input.currency),
        currency: input.currency.toLowerCase(),
        customerId: input.userId,
        metadata: {
          paymentId,
          checkoutId: input.checkoutId,
          ...input.metadata,
        },
      });
    } else if (gateway === 'razorpay') {
      gatewayResponse = await razorpayService.createOrder({
        amount: this.convertToSmallestUnit(input.amount, input.currency),
        currency: input.currency,
        receipt: paymentId,
        notes: {
          checkoutId: input.checkoutId,
          userId: input.userId,
        },
      });
    }
    
    const payment = {
      id: paymentId,
      userId: input.userId,
      checkoutId: input.checkoutId,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      country: input.country,
      gateway,
      gatewayPaymentId: gatewayResponse.id,
      clientSecret: gatewayResponse.clientSecret,
      status: 'pending',
      metadata: input.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    paymentStore.set(paymentId, payment);
    
    return payment;
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string, userId: string): Promise<any> {
    const payment = paymentStore.get(paymentId);
    
    if (!payment || payment.userId !== userId) {
      throw new NotFoundError('Payment');
    }
    
    return payment;
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentId: string, userId: string, paymentMethodId: string): Promise<any> {
    const payment = await this.getPayment(paymentId, userId);
    
    if (payment.status !== 'pending') {
      throw new ValidationError('Payment is not pending');
    }
    
    let result: any;
    
    if (payment.gateway === 'stripe') {
      result = await stripeService.confirmPayment(payment.gatewayPaymentId, paymentMethodId);
    } else if (payment.gateway === 'razorpay') {
      // Razorpay confirmation is handled on client side
      result = { status: 'requires_verification' };
    }
    
    payment.status = result.status === 'succeeded' ? 'completed' : 'processing';
    payment.confirmedAt = new Date();
    payment.updatedAt = new Date();
    
    paymentStore.set(paymentId, payment);
    
    return payment;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, userId: string): Promise<any> {
    const payment = await this.getPayment(paymentId, userId);
    
    if (payment.status !== 'pending') {
      throw new ValidationError('Payment cannot be cancelled');
    }
    
    if (payment.gateway === 'stripe') {
      await stripeService.cancelPaymentIntent(payment.gatewayPaymentId);
    }
    
    payment.status = 'cancelled';
    payment.cancelledAt = new Date();
    payment.updatedAt = new Date();
    
    paymentStore.set(paymentId, payment);
    
    return payment;
  }

  /**
   * Get available payment methods for a country
   */
  async getPaymentMethods(country: Country): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [
      {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        icon: 'credit-card',
        enabled: true,
        countries: ['IN', 'AE', 'UK'],
      },
    ];
    
    // India-specific methods
    if (country === 'IN') {
      methods.push(
        {
          id: 'upi',
          type: 'upi',
          name: 'UPI',
          icon: 'upi',
          enabled: true,
          countries: ['IN'],
        },
        {
          id: 'netbanking',
          type: 'netbanking',
          name: 'Net Banking',
          icon: 'bank',
          enabled: true,
          countries: ['IN'],
        },
        {
          id: 'wallet',
          type: 'wallet',
          name: 'Wallets (Paytm, PhonePe, etc.)',
          icon: 'wallet',
          enabled: true,
          countries: ['IN'],
        },
        {
          id: 'emi',
          type: 'emi',
          name: 'EMI',
          icon: 'calendar',
          enabled: true,
          countries: ['IN'],
          minAmount: 5000,
        }
      );
    }
    
    // UAE methods
    if (country === 'AE') {
      methods.push({
        id: 'apple_pay',
        type: 'wallet',
        name: 'Apple Pay',
        icon: 'apple',
        enabled: true,
        countries: ['AE', 'UK'],
      });
    }
    
    // UK methods
    if (country === 'UK') {
      methods.push(
        {
          id: 'apple_pay',
          type: 'wallet',
          name: 'Apple Pay',
          icon: 'apple',
          enabled: true,
          countries: ['AE', 'UK'],
        },
        {
          id: 'google_pay',
          type: 'wallet',
          name: 'Google Pay',
          icon: 'google',
          enabled: true,
          countries: ['UK'],
        }
      );
    }
    
    return methods;
  }

  /**
   * Get EMI options for amount
   */
  async getEmiOptions(amount: number, country: Country): Promise<any[]> {
    if (country !== 'IN' || amount < 5000) {
      return [];
    }
    
    const emiOptions = [
      { tenure: 3, interestRate: 13, bank: 'HDFC Bank' },
      { tenure: 6, interestRate: 14, bank: 'HDFC Bank' },
      { tenure: 9, interestRate: 14.5, bank: 'HDFC Bank' },
      { tenure: 12, interestRate: 15, bank: 'HDFC Bank' },
      { tenure: 3, interestRate: 12, bank: 'ICICI Bank' },
      { tenure: 6, interestRate: 13, bank: 'ICICI Bank' },
      { tenure: 12, interestRate: 14, bank: 'ICICI Bank' },
      { tenure: 3, interestRate: 13.5, bank: 'Axis Bank' },
      { tenure: 6, interestRate: 14, bank: 'Axis Bank' },
      { tenure: 12, interestRate: 15, bank: 'Axis Bank' },
    ];
    
    return emiOptions.map((option) => ({
      ...option,
      ...this.calculateEmi(amount, option.tenure, option.interestRate),
    }));
  }

  /**
   * Calculate EMI
   */
  calculateEmi(principal: number, tenure: number, interestRate: number): {
    emi: number;
    totalAmount: number;
    totalInterest: number;
  } {
    const monthlyRate = interestRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalAmount = emi * tenure;
    const totalInterest = totalAmount - principal;
    
    return {
      emi: Math.round(emi),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
    };
  }

  /**
   * Determine which payment gateway to use
   */
  private getGateway(country: Country, paymentMethod: string): 'stripe' | 'razorpay' {
    // Use Razorpay for India for UPI, netbanking, wallets
    if (country === 'IN' && ['upi', 'netbanking', 'wallet', 'emi'].includes(paymentMethod)) {
      return 'razorpay';
    }
    
    // Use Stripe for cards and international payments
    return 'stripe';
  }

  /**
   * Convert amount to smallest currency unit
   */
  private convertToSmallestUnit(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW'];
    
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }
    
    return Math.round(amount * 100);
  }
}
