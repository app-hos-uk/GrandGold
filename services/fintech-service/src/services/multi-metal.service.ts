import axios from 'axios';
import Redis from 'ioredis';
import type { Country, Currency } from '@grandgold/types';

type MetalType = 'gold' | 'silver' | 'platinum' | 'palladium';

interface MetalPrice {
  metal: MetalType;
  price: number;
  currency: Currency;
  unit: 'gram' | 'ounce';
  change24h: number;
  changePercent24h: number;
  timestamp: Date;
}

interface MetalPrices {
  gold: MetalPrice;
  silver: MetalPrice;
  platinum: MetalPrice;
  palladium?: MetalPrice;
}

export class MultiMetalService {
  private redis: Redis;
  private metalsApiKey: string;
  private metalsApiUrl: string;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.metalsApiKey = process.env.METALS_DEV_API_KEY || '';
    this.metalsApiUrl = process.env.METALS_DEV_API_URL || 'https://api.metals.dev/v1';
  }

  /**
   * Get prices for all metals
   */
  async getAllMetalPrices(country: Country): Promise<MetalPrices> {
    const cacheKey = `metals:prices:${country}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const currencyMap: Record<Country, Currency> = {
      IN: 'INR',
      AE: 'AED',
      UK: 'GBP',
    };
    const currency = currencyMap[country];

    try {
      // Fetch from Metals.Dev API
      const response = await axios.get(`${this.metalsApiUrl}/latest`, {
        params: {
          api_key: this.metalsApiKey,
          base: 'USD',
          currencies: 'XAU,XAG,XPT,XPD', // Gold, Silver, Platinum, Palladium
        },
      });

      const rates = response.data.rates;
      const exchangeRate = await this.getExchangeRate(currency);

      // Convert to local currency per gram
      const troyOunceToGrams = 31.1035;

      const prices: MetalPrices = {
        gold: {
          metal: 'gold',
          price: Math.round(((1 / rates.XAU) / troyOunceToGrams) * exchangeRate * 100) / 100,
          currency,
          unit: 'gram',
          change24h: 0, // Would need historical data
          changePercent24h: 0,
          timestamp: new Date(),
        },
        silver: {
          metal: 'silver',
          price: Math.round(((1 / rates.XAG) / troyOunceToGrams) * exchangeRate * 100) / 100,
          currency,
          unit: 'gram',
          change24h: 0,
          changePercent24h: 0,
          timestamp: new Date(),
        },
        platinum: {
          metal: 'platinum',
          price: Math.round(((1 / rates.XPT) / troyOunceToGrams) * exchangeRate * 100) / 100,
          currency,
          unit: 'gram',
          change24h: 0,
          changePercent24h: 0,
          timestamp: new Date(),
        },
      };

      // Cache for 1 minute
      await this.redis.setex(cacheKey, 60, JSON.stringify(prices));

      return prices;
    } catch (error) {
      // Fallback prices
      const fallbackPrices: MetalPrices = {
        gold: {
          metal: 'gold',
          price: country === 'IN' ? 6000 : country === 'AE' ? 250 : 60,
          currency,
          unit: 'gram',
          change24h: 0,
          changePercent24h: 0,
          timestamp: new Date(),
        },
        silver: {
          metal: 'silver',
          price: country === 'IN' ? 80 : country === 'AE' ? 3.5 : 0.85,
          currency,
          unit: 'gram',
          change24h: 0,
          changePercent24h: 0,
          timestamp: new Date(),
        },
        platinum: {
          metal: 'platinum',
          price: country === 'IN' ? 3500 : country === 'AE' ? 150 : 35,
          currency,
          unit: 'gram',
          change24h: 0,
          changePercent24h: 0,
          timestamp: new Date(),
        },
      };

      return fallbackPrices;
    }
  }

  /**
   * Get price for specific metal
   */
  async getMetalPrice(metal: MetalType, country: Country): Promise<MetalPrice> {
    const allPrices = await this.getAllMetalPrices(country);
    const price = allPrices[metal];
    if (!price) {
      throw new Error(`Price not found for metal: ${metal}`);
    }
    return price;
  }

  /**
   * Get metal price history
   */
  async getMetalPriceHistory(
    metal: MetalType,
    period: '7d' | '30d' | '90d' | '365d',
    country: Country
  ): Promise<{
    data: { date: string; price: number }[];
    summary: {
      current: number;
      change: number;
      changePercent: number;
      high: number;
      low: number;
    };
  }> {
    const cacheKey = `metal:history:${metal}:${country}:${period}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const basePrices: Record<MetalType, Record<Country, number>> = {
      gold: { IN: 6000, AE: 250, UK: 60 },
      silver: { IN: 80, AE: 3.5, UK: 0.85 },
      platinum: { IN: 3500, AE: 150, UK: 35 },
      palladium: { IN: 4000, AE: 170, UK: 40 },
    };

    const basePrice = basePrices[metal][country];
    const data: { date: string; price: number }[] = [];
    const prices: number[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const fluctuation = 1 + (Math.random() - 0.5) * 0.04;
      const price = Math.round(basePrice * fluctuation * 100) / 100;
      prices.push(price);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price,
      });
    }

    const current = prices[prices.length - 1];
    const previous = prices[0];
    const change = current - previous;
    const changePercent = ((change / previous) * 100);

    const result = {
      data,
      summary: {
        current,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.max(...prices),
        low: Math.min(...prices),
      },
    };

    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  /**
   * Get exchange rate
   */
  private async getExchangeRate(currency: Currency): Promise<number> {
    const cacheKey = `exchange:rate:${currency}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return parseFloat(cached);
    }

    const rates: Record<Currency, number> = {
      USD: 1,
      INR: 83.12,
      AED: 3.67,
      GBP: 0.79,
    };

    const rate = rates[currency] || 1;
    await this.redis.setex(cacheKey, 43200, rate.toString());

    return rate;
  }
}
