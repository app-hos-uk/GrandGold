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

// Lazy Redis initialization
let redisClient: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) return redisClient;
  redisInitialized = true;
  
  const url = process.env.REDIS_URL;
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('[fintech-service] Redis not configured. Caching disabled.');
    return null;
  }
  
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redisClient.on('error', (err) => {
      console.error('[fintech-service] Redis error:', err.message);
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

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
  private metalsApiKey: string;
  private metalsApiUrl: string;

  constructor() {
    this.metalsApiKey = process.env.METALS_DEV_API_KEY || '';
    this.metalsApiUrl = process.env.METALS_DEV_API_URL || 'https://api.metals.dev/v1';
  }

  /**
   * Get current spot gold price in USD
   */
  async getSpotPrice(): Promise<SpotPrice> {
    const redis = getRedis();
    
    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get('gold:spot:usd');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Cache unavailable
      }
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
      if (redis) {
        try {
          await redis.setex('gold:spot:usd', 60, JSON.stringify(spotPrice));
        } catch {
          // Cache failed
        }
      }

      return spotPrice;
    } catch (error) {
      // Fallback to last known price
      if (redis) {
        try {
          const fallback = await redis.get('gold:spot:usd:fallback');
          if (fallback) {
            return JSON.parse(fallback);
          }
        } catch {
          // Cache unavailable
        }
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
    const redis = getRedis();
    const cacheKey = `gold:prices:${country}`;
    
    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Cache unavailable
      }
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
    if (redis) {
      try {
        await redis.setex(cacheKey, 60, JSON.stringify(result));
      } catch {
        // Cache failed
      }
    }

    return result;
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    const redis = getRedis();
    const cacheKey = 'exchange:rates';
    
    // Try cache first (12 hour cache)
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Cache unavailable
      }
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
      if (redis) {
        try {
          await redis.setex(cacheKey, 43200, JSON.stringify(rates));
        } catch {
          // Cache failed
        }
      }

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
    const redis = getRedis();
    const cacheKey = `gold:history:${country}:${purity || '24K'}:${period}`;
    
    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Cache unavailable
      }
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
    if (redis) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      } catch {
        // Cache failed
      }
    }

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
    const redis = getRedis();
    if (redis) {
      try {
        await redis.set('gold:spot:usd:fallback', JSON.stringify(spotPrice));
      } catch {
        // Cache failed
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    const redis = getRedis();
    if (redis) {
      try {
        await redis.quit();
      } catch {
        // Ignore quit errors
      }
    }
  }
}
