import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { ValidationError, NotFoundError } from '@grandgold/utils';
import { authenticate, authorize } from '../middleware/auth';
import type { UserRole } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager'];

// In-memory stores for demo (in production, use database)
const carriersStore: Map<string, Carrier> = new Map();
let shippingSettings: ShippingSettings = {
  freeShippingThreshold: 25000,
  armoredTransportEnabled: true,
  armoredTransportMinValue: 100000,
};

// Initialize demo carriers
const demoCarriers: Carrier[] = [
  {
    id: 'c1',
    name: 'Delhivery',
    code: 'delhivery',
    countries: ['IN'],
    services: [
      { name: 'Standard', estimatedDays: '5-7', rateType: 'flat', rate: 80 },
      { name: 'Express', estimatedDays: '2-3', rateType: 'flat', rate: 150 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: 'c2',
    name: 'Blue Dart',
    code: 'bluedart',
    countries: ['IN'],
    services: [
      { name: 'Surface', estimatedDays: '4-6', rateType: 'per_kg', rate: 60 },
      { name: 'Air', estimatedDays: '2-3', rateType: 'per_kg', rate: 120 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: 'c3',
    name: 'DHL Express',
    code: 'dhl',
    countries: ['IN', 'AE', 'UK'],
    services: [
      { name: 'International', estimatedDays: '3-5', rateType: 'per_kg', rate: 500 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: 'c4',
    name: 'Aramex',
    code: 'aramex',
    countries: ['AE', 'UK'],
    services: [
      { name: 'Standard', estimatedDays: '4-6', rateType: 'flat', rate: 25 },
      { name: 'Express', estimatedDays: '1-2', rateType: 'flat', rate: 45 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
];
demoCarriers.forEach((c) => carriersStore.set(c.id, c));

interface Carrier {
  id: string;
  name: string;
  code: string;
  countries: string[];
  services: { name: string; estimatedDays: string; rateType: 'flat' | 'per_kg'; rate: number }[];
  isActive: boolean;
  supportsTracking: boolean;
  supportsInsurance: boolean;
  apiKey?: string;
  apiSecret?: string;
}

interface ShippingSettings {
  freeShippingThreshold: number;
  armoredTransportEnabled: boolean;
  armoredTransportMinValue: number;
}

const createCarrierSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  countries: z.array(z.enum(['IN', 'AE', 'UK'])).min(1),
  services: z.array(z.object({
    name: z.string().min(1),
    estimatedDays: z.string(),
    rateType: z.enum(['flat', 'per_kg']),
    rate: z.number().positive(),
  })),
  isActive: z.boolean().optional().default(true),
  supportsTracking: z.boolean().optional().default(true),
  supportsInsurance: z.boolean().optional().default(false),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
});

const updateSettingsSchema = z.object({
  freeShippingThreshold: z.number().min(0),
  armoredTransportEnabled: z.boolean(),
  armoredTransportMinValue: z.number().min(0).optional(),
});

/**
 * GET /api/shipping/carriers
 * List all carriers
 */
router.get('/carriers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = req.query.country as string;
    
    let carriers = Array.from(carriersStore.values());
    
    if (country) {
      carriers = carriers.filter((c) => c.countries.includes(country));
    }

    // Don't expose API secrets
    const sanitized = carriers.map(({ apiKey, apiSecret, ...rest }) => ({
      ...rest,
      hasApiCredentials: !!(apiKey && apiSecret),
    }));

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shipping/carriers/:id
 * Get single carrier
 */
router.get('/carriers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const carrier = carriersStore.get(id);

    if (!carrier) {
      throw new NotFoundError('Carrier not found');
    }

    // Don't expose API secrets
    const { apiKey, apiSecret, ...rest } = carrier;

    res.json({
      success: true,
      data: { ...rest, hasApiCredentials: !!(apiKey && apiSecret) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shipping/carriers
 * Create new carrier (admin only)
 */
router.post(
  '/carriers',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createCarrierSchema.parse(req.body);

      // Check code uniqueness
      const existing = Array.from(carriersStore.values()).find((c) => c.code === data.code);
      if (existing) {
        throw new ValidationError('A carrier with this code already exists');
      }

      const carrier: Carrier = {
        id: randomUUID(),
        ...data,
      };

      carriersStore.set(carrier.id, carrier);

      // Don't return secrets
      const { apiKey, apiSecret, ...rest } = carrier;

      res.status(201).json({
        success: true,
        data: rest,
        message: 'Carrier created',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * PATCH /api/shipping/carriers/:id
 * Update carrier (admin only)
 */
router.patch(
  '/carriers/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const carrier = carriersStore.get(id);

      if (!carrier) {
        throw new NotFoundError('Carrier not found');
      }

      const updateData = req.body;
      
      // Don't allow changing id
      delete updateData.id;
      
      Object.assign(carrier, updateData);
      carriersStore.set(id, carrier);

      // Don't return secrets
      const { apiKey, apiSecret, ...rest } = carrier;

      res.json({
        success: true,
        data: rest,
        message: 'Carrier updated',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/shipping/carriers/:id
 * Delete carrier (admin only)
 */
router.delete(
  '/carriers/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!carriersStore.has(id)) {
        throw new NotFoundError('Carrier not found');
      }

      carriersStore.delete(id);

      res.json({
        success: true,
        message: 'Carrier deleted',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/shipping/settings
 * Get shipping settings
 */
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: shippingSettings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/shipping/settings
 * Update shipping settings (admin only)
 */
router.put(
  '/settings',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateSettingsSchema.parse(req.body);

      shippingSettings = {
        ...shippingSettings,
        ...data,
      };

      res.json({
        success: true,
        data: shippingSettings,
        message: 'Shipping settings updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates for an order
 */
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, weight, value } = req.body;

    if (!country || !weight) {
      throw new ValidationError('Country and weight are required');
    }

    const carriers = Array.from(carriersStore.values()).filter(
      (c) => c.isActive && c.countries.includes(country)
    );

    const rates = carriers.flatMap((carrier) =>
      carrier.services.map((service) => ({
        carrierId: carrier.id,
        carrierName: carrier.name,
        serviceName: service.name,
        estimatedDays: service.estimatedDays,
        rate: service.rateType === 'flat' ? service.rate : service.rate * weight,
        currency: country === 'IN' ? 'INR' : country === 'AE' ? 'AED' : 'GBP',
        supportsTracking: carrier.supportsTracking,
        supportsInsurance: carrier.supportsInsurance,
        isFree: value >= shippingSettings.freeShippingThreshold,
        requiresArmoredTransport: shippingSettings.armoredTransportEnabled && value >= shippingSettings.armoredTransportMinValue,
      }))
    );

    // Sort by rate
    rates.sort((a, b) => a.rate - b.rate);

    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
});

export { router as shippingRouter };
