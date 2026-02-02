import { Router, Request, Response, NextFunction } from 'express';
import { CurrencyConverterService } from '../services/currency-converter.service';

const router = Router();
const currencyConverterService = new CurrencyConverterService();

/**
 * POST /api/fintech/currency/convert
 * Convert currency
 */
router.post('/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: amount, from, to' },
      });
      return;
    }

    const result = await currencyConverterService.convert(amount, from, to);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fintech/currency/rates
 * Get exchange rates
 */
router.get('/rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await currencyConverterService.getExchangeRates();

    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fintech/currency/format
 * Format currency amount
 */
router.get('/format', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = parseFloat(req.query.amount as string);
    const currency = req.query.currency as string;

    if (!amount || !currency) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: amount, currency' },
      });
      return;
    }

    const formatted = currencyConverterService.formatCurrency(amount, currency as any);

    res.json({
      success: true,
      data: { formatted, amount, currency },
    });
  } catch (error) {
    next(error);
  }
});

export { router as currencyConverterRouter };
