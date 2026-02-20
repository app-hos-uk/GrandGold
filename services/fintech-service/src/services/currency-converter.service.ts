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
  private redis: Redis | null = null;

  private getRedis(): Redis | null {
    if (this.redis) return this.redis;
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
      this.redis = new Redis(url, { maxRetriesPerRequest: 2, retryStrategy: (times) => (times <= 2 ? 500 : null), lazyConnect: true });
      this.redis.on('error', () => {});
    } catch { /* no-op */ return null; }
    return this.redis;
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
    const redis = this.getRedis();
    const cacheKey = 'exchange:rates';

    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch { /* no-op */ }

    const rates: Record<Currency, number> = {
      USD: 1,
      INR: 83.12,
      AED: 3.67,
      GBP: 0.79,
    };

    try {
      if (redis) {
        await redis.setex(cacheKey, 43200, JSON.stringify(rates));
      }
    } catch { /* no-op */ }

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
