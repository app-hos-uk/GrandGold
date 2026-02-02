import axios from 'axios';
import Redis from 'ioredis';
import type { Country, Currency, GoldPurity } from '@grandgold/types';

// Purity multipliers
const PURITY_MULTIPLIERS: Record<GoldPurity, number> = {
  '24K': 1.0,
  '22K': 0.9167,
  '21K': 0.875,
  '18K': 0.75,
  '14K': 0.583,
  '10K': 0.417,
};

// Troy ounce to grams
const TROY_OUNCE_TO_GRAMS = 31.1035;

interface SpotPrice {
  price: number;
  timestamp: Date;
  change24h: number;
  changePercent24h: number;
}

interface GoldPrices {
  spotPriceUsd: number;
  prices: Record<GoldPurity, number>;
  currency: Currency;
  updatedAt: Date;
  source: string;
}

interface ExchangeRates {
  base: 'USD';
  rates: Record<Currency, number>;
  updatedAt: Date;
}

export class GoldPriceService {
  private redis: Redis;
  private metalsApiKey: string;
  private metalsApiUrl: string;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.metalsApiKey = process.env.METALS_DEV_API_KEY || '';
    this.metalsApiUrl = process.env.METALS_DEV_API_URL || 'https://api.metals.dev/v1';
  }

  /**
   * Get current spot gold price in USD
   */
  async getSpotPrice(): Promise<SpotPrice> {
    // Try cache first
    const cached = await this.redis.get('gold:spot:usd');
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    try {
      const response = await axios.get(`${this.metalsApiUrl}/latest`, {
        params: {
          api_key: this.metalsApiKey,
          base: 'USD',
          currencies: 'XAU',
        },
      });

      const spotPrice: SpotPrice = {
        price: 1 / response.data.rates.XAU, // XAU is priced inversely
        timestamp: new Date(response.data.timestamp * 1000),
        change24h: 0, // Would need historical data
        changePercent24h: 0,
      };

      // Cache for 1 minute
      await this.redis.setex('gold:spot:usd', 60, JSON.stringify(spotPrice));

      return spotPrice;
    } catch (error) {
      // Fallback to last known price
      const fallback = await this.redis.get('gold:spot:usd:fallback');
      if (fallback) {
        return JSON.parse(fallback);
      }

      // Use hardcoded fallback
      return {
        price: 2000, // Approximate gold price
        timestamp: new Date(),
        change24h: 0,
        changePercent24h: 0,
      };
    }
  }

  /**
   * Get current gold prices for all purities in a country's currency
   */
  async getCurrentPrices(country: Country): Promise<GoldPrices> {
    const cacheKey = `gold:prices:${country}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get spot price and exchange rate
    const spotPrice = await this.getSpotPrice();
    const exchangeRates = await this.getExchangeRates();

    // Get currency for country
    const currencyMap: Record<Country, Currency> = {
      IN: 'INR',
      AE: 'AED',
      UK: 'GBP',
    };
    const currency = currencyMap[country];

    // Calculate price per gram in local currency
    const pricePerGramUsd = spotPrice.price / TROY_OUNCE_TO_GRAMS;
    const pricePerGramLocal = pricePerGramUsd * exchangeRates.rates[currency];

    // Calculate prices for all purities
    const prices: Record<GoldPurity, number> = {} as Record<GoldPurity, number>;
    for (const [purity, multiplier] of Object.entries(PURITY_MULTIPLIERS)) {
      prices[purity as GoldPurity] = Math.round(pricePerGramLocal * multiplier * 100) / 100;
    }

    const result: GoldPrices = {
      spotPriceUsd: spotPrice.price,
      prices,
      currency,
      updatedAt: new Date(),
      source: 'metals.dev',
    };

    // Cache for 1 minute
    await this.redis.setex(cacheKey, 60, JSON.stringify(result));

    return result;
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    const cacheKey = 'exchange:rates';
    
    // Try cache first (12 hour cache)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    try {
      const response = await axios.get(`${this.metalsApiUrl}/latest`, {
        params: {
          api_key: this.metalsApiKey,
          base: 'USD',
          currencies: 'INR,AED,GBP',
        },
      });

      const rates: ExchangeRates = {
        base: 'USD',
        rates: {
          USD: 1,
          INR: response.data.rates.INR,
          AED: response.data.rates.AED,
          GBP: response.data.rates.GBP,
        },
        updatedAt: new Date(),
      };

      // Cache for 12 hours
      await this.redis.setex(cacheKey, 43200, JSON.stringify(rates));

      return rates;
    } catch (error) {
      // Fallback rates
      return {
        base: 'USD',
        rates: {
          USD: 1,
          INR: 83.12,
          AED: 3.67,
          GBP: 0.79,
        },
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Get gold price history
   */
  async getPriceHistory(
    period: '7d' | '30d' | '90d' | '365d',
    country: Country,
    purity?: GoldPurity
  ): Promise<{
    data: { date: string; price: number; high: number; low: number }[];
    summary: {
      current: number;
      change: number;
      changePercent: number;
      high: number;
      low: number;
      average: number;
    };
  }> {
    const cacheKey = `gold:history:${country}:${purity || '24K'}:${period}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // For demo, generate sample data
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const history: { date: string; price: number; high: number; low: number }[] = [];
    const basePrice = 6000; // Approximate INR/g for 24K
    const prices: number[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random fluctuation ±2%
      const fluctuation = 1 + (Math.random() - 0.5) * 0.04;
      const price = Math.round(basePrice * fluctuation);
      prices.push(price);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price,
        high: Math.round(price * 1.01),
        low: Math.round(price * 0.99),
      });
    }

    const current = prices[prices.length - 1];
    const previous = prices[0];
    const change = current - previous;
    const changePercent = ((change / previous) * 100);

    const result = {
      data: history,
      summary: {
        current,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.max(...prices),
        low: Math.min(...prices),
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      },
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount: number, from: Currency, to: Currency): Promise<number> {
    const rates = await this.getExchangeRates();
    
    // Convert to USD first, then to target currency
    const amountInUsd = amount / rates.rates[from];
    return amountInUsd * rates.rates[to];
  }

  /**
   * Store latest price as fallback
   */
  async storeAsFallback(spotPrice: SpotPrice): Promise<void> {
    await this.redis.set('gold:spot:usd:fallback', JSON.stringify(spotPrice));
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
