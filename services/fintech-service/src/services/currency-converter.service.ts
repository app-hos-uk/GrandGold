import Redis from 'ioredis';
import type { Currency } from '@grandgold/types';

interface ConversionResult {
  from: Currency;
  to: Currency;
  amount: number;
  converted: number;
  rate: number;
  timestamp: Date;
}

export class CurrencyConverterService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Convert currency
   */
  async convert(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<ConversionResult> {
    if (from === to) {
      return {
        from,
        to,
        amount,
        converted: amount,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const rates = await this.getExchangeRates();
    
    // Convert to USD first, then to target
    const amountInUsd = amount / rates[from];
    const converted = amountInUsd * rates[to];
    const rate = rates[to] / rates[from];

    return {
      from,
      to,
      amount,
      converted: Math.round(converted * 100) / 100,
      rate: Math.round(rate * 10000) / 10000,
      timestamp: new Date(),
    };
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(): Promise<Record<Currency, number>> {
    const cacheKey = 'exchange:rates';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // In production, fetch from API
    // For now, use fallback rates
    const rates: Record<Currency, number> = {
      USD: 1,
      INR: 83.12,
      AED: 3.67,
      GBP: 0.79,
    };

    await this.redis.setex(cacheKey, 43200, JSON.stringify(rates));

    return rates;
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
      USD: '$',
      INR: '₹',
      AED: 'د.إ',
      GBP: '£',
    };

    return symbols[currency] || currency;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: Currency): string {
    const symbol = this.getCurrencySymbol(currency);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    if (currency === 'INR') {
      return `₹${formatted}`;
    } else if (currency === 'AED') {
      return `${formatted} ${symbol}`;
    } else if (currency === 'GBP') {
      return `${symbol}${formatted}`;
    } else {
      return `${symbol}${formatted}`;
    }
  }
}
