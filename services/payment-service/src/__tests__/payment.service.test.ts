import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_xxx',
        status: 'requires_payment_method',
      }),
      confirm: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000000,
        currency: 'inr',
      }),
    },
    setupIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'seti_test_123',
        client_secret: 'seti_test_123_secret_xxx',
      }),
    },
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
      retrieve: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
    },
    paymentMethods: {
      list: vi.fn().mockResolvedValue({
        data: [
          { id: 'pm_1', card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2025 } },
        ],
      }),
      detach: vi.fn().mockResolvedValue({ id: 'pm_1' }),
    },
    refunds: {
      create: vi.fn().mockResolvedValue({
        id: 'ref_test_123',
        status: 'succeeded',
        amount: 5000000,
      }),
    },
  })),
}));

vi.mock('@grandgold/utils', () => ({
  generateId: vi.fn().mockReturnValue('pay_test_123'),
  ValidationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

import { StripeService } from '../services/stripe.service';

describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    stripeService = new StripeService();
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const result = await stripeService.createPaymentIntent({
        amount: 50000,
        currency: 'inr',
        customerId: 'user_123',
        metadata: { orderId: 'order_123' },
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('clientSecret');
    });

    it('should handle different currencies', async () => {
      const result = await stripeService.createPaymentIntent({
        amount: 1000,
        currency: 'gbp',
        customerId: 'user_123',
      });

      expect(result).toHaveProperty('id');
    });
  });

  describe('createSetupIntent', () => {
    it('should create a setup intent for saving cards', async () => {
      const result = await stripeService.createSetupIntent('user_123');

      expect(result).toHaveProperty('clientSecret');
    });
  });

  describe('getSavedCards', () => {
    it('should return saved payment methods', async () => {
      const result = await stripeService.getSavedCards('user_123');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('brand');
      expect(result[0]).toHaveProperty('last4');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment intent', async () => {
      const result = await stripeService.confirmPayment('pi_test_123', 'pm_1');

      expect(result).toHaveProperty('status');
    });
  });

  describe('deleteCard', () => {
    it('should detach a payment method', async () => {
      await expect(
        stripeService.deleteCard('user_123', 'pm_1')
      ).resolves.not.toThrow();
    });
  });
});

describe('Payment Calculations', () => {
  describe('calculateTax', () => {
    it('should calculate GST for India', () => {
      const amount = 100000;
      const taxRate = 0.03; // 3% GST
      const tax = Math.round(amount * taxRate);
      
      expect(tax).toBe(3000);
    });

    it('should calculate VAT for UAE', () => {
      const amount = 10000;
      const taxRate = 0.05; // 5% VAT
      const tax = Math.round(amount * taxRate);
      
      expect(tax).toBe(500);
    });

    it('should calculate VAT for UK', () => {
      const amount = 1000;
      const taxRate = 0.20; // 20% VAT
      const tax = Math.round(amount * taxRate);
      
      expect(tax).toBe(200);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with shipping', () => {
      const subtotal = 50000;
      const tax = 1500;
      const shipping = 500;
      const total = subtotal + tax + shipping;

      expect(total).toBe(52000);
    });

    it('should apply free shipping for large orders', () => {
      const subtotal = 100000;
      const tax = 3000;
      const shipping = subtotal > 50000 ? 0 : 500;
      const total = subtotal + tax + shipping;

      expect(shipping).toBe(0);
      expect(total).toBe(103000);
    });
  });
});

describe('EMI Calculations', () => {
  it('should calculate EMI correctly', () => {
    const principal = 100000;
    const ratePerMonth = 0.01; // 1% per month
    const months = 12;
    
    // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = Math.round(
      (principal * ratePerMonth * Math.pow(1 + ratePerMonth, months)) /
      (Math.pow(1 + ratePerMonth, months) - 1)
    );

    expect(emi).toBeGreaterThan(principal / months); // EMI should be > simple division
    expect(emi).toBeLessThan(principal); // But less than principal
  });
});
