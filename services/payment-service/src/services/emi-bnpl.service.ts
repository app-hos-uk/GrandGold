import { generateId, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

interface EMIOption {
  id: string;
  provider: 'razorpay' | 'stripe' | 'klarna' | 'clearpay' | 'simpl' | 'lazypay';
  name: string;
  tenure: number; // months
  interestRate: number; // annual percentage
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  countries: Country[];
  available: boolean;
}

interface BNPLOption {
  id: string;
  provider: 'klarna' | 'clearpay' | 'simpl' | 'lazypay';
  name: string;
  tenure: number; // days
  interestRate: number; // 0 for interest-free
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  countries: Country[];
  available: boolean;
}

export class EMIService {
  /**
   * Get available EMI options
   */
  async getEMIOptions(
    amount: number,
    country: Country
  ): Promise<EMIOption[]> {
    const allOptions: EMIOption[] = [
      {
        id: 'emi_razorpay_3',
        provider: 'razorpay',
        name: 'Razorpay EMI - 3 Months',
        tenure: 3,
        interestRate: 12,
        processingFee: 0,
        minAmount: 5000,
        maxAmount: 1000000,
        countries: ['IN'],
        available: true,
      },
      {
        id: 'emi_razorpay_6',
        provider: 'razorpay',
        name: 'Razorpay EMI - 6 Months',
        tenure: 6,
        interestRate: 15,
        processingFee: 0,
        minAmount: 5000,
        maxAmount: 1000000,
        countries: ['IN'],
        available: true,
      },
      {
        id: 'emi_stripe_3',
        provider: 'stripe',
        name: 'Stripe Installments - 3 Months',
        tenure: 3,
        interestRate: 0,
        processingFee: 0,
        minAmount: 10000,
        maxAmount: 500000,
        countries: ['UK', 'AE'],
        available: true,
      },
    ];

    return allOptions.filter(
      (option) =>
        option.countries.includes(country) &&
        option.available &&
        amount >= option.minAmount &&
        amount <= option.maxAmount
    );
  }

  /**
   * Calculate EMI amount
   */
  calculateEMI(principal: number, tenure: number, interestRate: number): number {
    const monthlyRate = interestRate / 12 / 100;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi * 100) / 100;
  }

  /**
   * Get EMI breakdown
   */
  getEMIBreakdown(
    principal: number,
    tenure: number,
    interestRate: number
  ): {
    emi: number;
    totalAmount: number;
    totalInterest: number;
    schedule: { month: number; principal: number; interest: number; balance: number }[];
  } {
    const emi = this.calculateEMI(principal, tenure, interestRate);
    const totalAmount = emi * tenure;
    const totalInterest = totalAmount - principal;

    const schedule: { month: number; principal: number; interest: number; balance: number }[] = [];
    let balance = principal;
    const monthlyRate = interestRate / 12 / 100;

    for (let month = 1; month <= tenure; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = emi - interest;
      balance -= principalPayment;

      schedule.push({
        month,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    return {
      emi,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule,
    };
  }
}

export class BNPLService {
  /**
   * Get available BNPL options
   */
  async getBNPLOptions(
    amount: number,
    country: Country
  ): Promise<BNPLOption[]> {
    const allOptions: BNPLOption[] = [
      {
        id: 'bnpl_klarna_14',
        provider: 'klarna',
        name: 'Klarna Pay Later - 14 Days',
        tenure: 14,
        interestRate: 0,
        processingFee: 0,
        minAmount: 1000,
        maxAmount: 100000,
        countries: ['UK', 'AE'],
        available: true,
      },
      {
        id: 'bnpl_clearpay_4',
        provider: 'clearpay',
        name: 'Clearpay - 4 Payments',
        tenure: 14,
        interestRate: 0,
        processingFee: 0,
        minAmount: 1000,
        maxAmount: 100000,
        countries: ['UK'],
        available: true,
      },
      {
        id: 'bnpl_simpl_15',
        provider: 'simpl',
        name: 'Simpl - 15 Days',
        tenure: 15,
        interestRate: 0,
        processingFee: 0,
        minAmount: 500,
        maxAmount: 50000,
        countries: ['IN'],
        available: true,
      },
      {
        id: 'bnpl_lazypay_30',
        provider: 'lazypay',
        name: 'LazyPay - 30 Days',
        tenure: 30,
        interestRate: 0,
        processingFee: 0,
        minAmount: 1000,
        maxAmount: 100000,
        countries: ['IN'],
        available: true,
      },
    ];

    return allOptions.filter(
      (option) =>
        option.countries.includes(country) &&
        option.available &&
        amount >= option.minAmount &&
        amount <= option.maxAmount
    );
  }

  /**
   * Calculate BNPL payment schedule
   */
  getBNPLSchedule(
    amount: number,
    tenure: number,
    provider: string
  ): { date: Date; amount: number }[] {
    const schedule: { date: Date; amount: number }[] = [];
    const paymentAmount = amount / (tenure / 7); // Weekly payments

    for (let i = 0; i < tenure / 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i * 7);
      schedule.push({
        date,
        amount: Math.round(paymentAmount * 100) / 100,
      });
    }

    return schedule;
  }
}
