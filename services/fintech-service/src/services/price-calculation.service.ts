import type { Country, GoldPurity, Currency } from '@grandgold/types';
import { GoldPriceService } from './gold-price.service';

// Purity multipliers
const PURITY_MULTIPLIERS: Record<GoldPurity, number> = {
  '24K': 1.0,
  '22K': 0.9167,
  '21K': 0.875,
  '18K': 0.75,
  '14K': 0.583,
  '10K': 0.417,
};

// Tax rates by country
const TAX_RATES: Record<Country, number> = {
  IN: 3,  // GST on gold
  AE: 5,  // VAT
  UK: 20, // VAT
};

interface PriceCalculationInput {
  goldWeight: number;
  purity: GoldPurity;
  stoneValue: number;
  laborCost: number;
  makingChargesPercent: number;
  country: Country;
}

interface PriceCalculation {
  goldWeight: number;
  purity: GoldPurity;
  purityMultiplier: number;
  baseGoldPrice: number;
  goldValue: number;
  stoneValue: number;
  laborCost: number;
  makingCharges: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: Currency;
  calculatedAt: Date;
  validUntil: Date;
}

export class PriceCalculationService {
  private goldPriceService: GoldPriceService;

  constructor() {
    this.goldPriceService = new GoldPriceService();
  }

  /**
   * Calculate product price based on gold content and additions
   */
  async calculatePrice(input: PriceCalculationInput): Promise<PriceCalculation> {
    // Get current gold prices
    const goldPrices = await this.goldPriceService.getCurrentPrices(input.country);

    // Get base price for purity
    const purityMultiplier = PURITY_MULTIPLIERS[input.purity];
    const baseGoldPrice = goldPrices.prices['24K']; // Price per gram for 24K

    // Calculate gold value
    const goldValue = input.goldWeight * baseGoldPrice * purityMultiplier;

    // Calculate making charges
    const makingCharges = (goldValue + input.stoneValue + input.laborCost) * (input.makingChargesPercent / 100);

    // Calculate subtotal
    const subtotal = goldValue + input.stoneValue + input.laborCost + makingCharges;

    // Calculate tax
    const taxRate = TAX_RATES[input.country];
    const tax = subtotal * (taxRate / 100);

    // Calculate total
    const total = subtotal + tax;

    // Currency mapping
    const currencyMap: Record<Country, Currency> = {
      IN: 'INR',
      AE: 'AED',
      UK: 'GBP',
    };

    // Validity (1 minute)
    const calculatedAt = new Date();
    const validUntil = new Date(calculatedAt.getTime() + 60000);

    return {
      goldWeight: input.goldWeight,
      purity: input.purity,
      purityMultiplier,
      baseGoldPrice,
      goldValue: Math.round(goldValue * 100) / 100,
      stoneValue: input.stoneValue,
      laborCost: input.laborCost,
      makingCharges: Math.round(makingCharges * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency: currencyMap[input.country],
      calculatedAt,
      validUntil,
    };
  }

  /**
   * Calculate price breakdown for display
   */
  async getBreakdown(input: PriceCalculationInput): Promise<{
    items: { label: string; amount: number }[];
    total: number;
    currency: Currency;
  }> {
    const calculation = await this.calculatePrice(input);

    return {
      items: [
        { label: `Gold Value (${input.goldWeight}g ${input.purity})`, amount: calculation.goldValue },
        { label: 'Stone Value', amount: calculation.stoneValue },
        { label: 'Labor Cost', amount: calculation.laborCost },
        { label: `Making Charges (${input.makingChargesPercent}%)`, amount: calculation.makingCharges },
        { label: `Tax (${calculation.taxRate}%)`, amount: calculation.tax },
      ].filter(item => item.amount > 0),
      total: calculation.total,
      currency: calculation.currency,
    };
  }

  /**
   * Calculate price difference for updated pricing
   */
  async calculatePriceDifference(
    oldPrice: number,
    input: PriceCalculationInput
  ): Promise<{
    oldPrice: number;
    newPrice: number;
    difference: number;
    percentChange: number;
    currency: Currency;
  }> {
    const newCalculation = await this.calculatePrice(input);

    const difference = newCalculation.total - oldPrice;
    const percentChange = (difference / oldPrice) * 100;

    return {
      oldPrice,
      newPrice: newCalculation.total,
      difference: Math.round(difference * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100,
      currency: newCalculation.currency,
    };
  }

  /**
   * Batch calculate prices for multiple products
   */
  async batchCalculate(
    inputs: PriceCalculationInput[]
  ): Promise<PriceCalculation[]> {
    // Process in parallel for better performance
    return Promise.all(inputs.map(input => this.calculatePrice(input)));
  }
}
