import { Router, Request, Response, NextFunction } from 'express';
import { GoldPriceService } from '../services/gold-price.service';
import { PriceCalculationService } from '../services/price-calculation.service';
import type { Country, GoldPurity, Currency } from '@grandgold/types';

const router = Router();
const goldPriceService = new GoldPriceService();
const priceCalculationService = new PriceCalculationService();

/**
 * GET /api/prices/gold
 * Get current gold prices for all purities
 */
router.get('/gold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as Country) || 'IN';
    const prices = await goldPriceService.getCurrentPrices(country);
    
    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prices/gold/spot
 * Get current spot gold price in USD
 */
router.get('/gold/spot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spotPrice = await goldPriceService.getSpotPrice();
    
    res.json({
      success: true,
      data: {
        price: spotPrice.price,
        currency: 'USD',
        unit: 'per troy ounce',
        updatedAt: spotPrice.timestamp,
        change24h: spotPrice.change24h,
        changePercent24h: spotPrice.changePercent24h,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prices/gold/history
 * Get gold price history
 */
router.get('/gold/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as '7d' | '30d' | '90d' | '365d') || '7d';
    const country = (req.query.country as Country) || 'IN';
    
    const history = await goldPriceService.getPriceHistory(period, country);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prices/exchange-rates
 * Get current exchange rates
 */
router.get('/exchange-rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await goldPriceService.getExchangeRates();
    
    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prices/calculate
 * Calculate product price based on gold weight, purity, and additions
 */
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      goldWeight,
      purity,
      stoneValue,
      laborCost,
      makingChargesPercent,
      country,
    } = req.body;
    
    const calculation = await priceCalculationService.calculatePrice({
      goldWeight: parseFloat(goldWeight),
      purity: purity as GoldPurity,
      stoneValue: parseFloat(stoneValue || 0),
      laborCost: parseFloat(laborCost || 0),
      makingChargesPercent: parseFloat(makingChargesPercent || 0),
      country: country as Country || 'IN',
    });
    
    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prices/convert
 * Convert price between currencies
 */
router.post('/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, from, to } = req.body;
    
    const convertedAmount = await goldPriceService.convertCurrency(
      parseFloat(amount),
      from as Currency,
      to as Currency
    );
    
    res.json({
      success: true,
      data: {
        original: { amount: parseFloat(amount), currency: from },
        converted: { amount: convertedAmount, currency: to },
        rate: convertedAmount / parseFloat(amount),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fintech/price/health
 * Pricing health endpoint for monitoring
 */
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const spotPrice = await goldPriceService.getSpotPrice();
    const ageMs = Date.now() - new Date(spotPrice.timestamp).getTime();
    const isStale = ageMs > 5 * 60 * 1000; // 5 minutes
    
    res.json({
      success: true,
      data: {
        status: isStale ? 'degraded' : 'healthy',
        lastUpdate: spotPrice.timestamp,
        ageSeconds: Math.floor(ageMs / 1000),
        spotPrice: spotPrice.price,
        change24h: spotPrice.change24h,
        checks: {
          priceFeed: !isStale,
          cache: true,
          scheduler: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as priceRouter };
