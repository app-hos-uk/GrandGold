/* ================================================================== */
/*  Shared pricing config store                                         */
/*                                                                      */
/*  This module is the single source of truth for the pricing config.   */
/*  Both /api/admin/pricing and /api/rates/metals import from here      */
/*  to avoid self-referencing HTTP calls.                               */
/* ================================================================== */

export type PricingMode = 'manual' | 'api';

export interface CountryPricing {
  mode: PricingMode;
  manualRate24k: number | null;
  manualRate22k: number | null;
  manualRate18k: number | null;
  apiAdjustmentPercent: number;
  manualRateUpdatedAt: string | null;
  manualRateUpdatedBy: string | null;
}

export interface FetchScheduleSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}

export interface PricingConfig {
  countries: Record<string, CountryPricing>;
  fetchSchedule: FetchScheduleSlot[];
  fetchWindowMinutes: number;
  apiEnabled: boolean;
  updatedAt: string | null;
}

const DEFAULT_CONFIG: PricingConfig = {
  countries: {
    IN: {
      mode: 'api',
      manualRate24k: 6250,
      manualRate22k: null,
      manualRate18k: null,
      apiAdjustmentPercent: 0,
      manualRateUpdatedAt: null,
      manualRateUpdatedBy: null,
    },
    AE: {
      mode: 'api',
      manualRate24k: 242,
      manualRate22k: null,
      manualRate18k: null,
      apiAdjustmentPercent: 0,
      manualRateUpdatedAt: null,
      manualRateUpdatedBy: null,
    },
    UK: {
      mode: 'api',
      manualRate24k: 52,
      manualRate22k: null,
      manualRate18k: null,
      apiAdjustmentPercent: 0,
      manualRateUpdatedAt: null,
      manualRateUpdatedBy: null,
    },
  },
  fetchSchedule: [
    { hour: 9, minute: 0, enabled: true },
    { hour: 12, minute: 15, enabled: true },
    { hour: 16, minute: 30, enabled: true },
  ],
  fetchWindowMinutes: 10,
  apiEnabled: true,
  updatedAt: null,
};

// Singleton store — survives across requests within the same process
let store: PricingConfig = { ...DEFAULT_CONFIG };

export function getPricingConfigStore(): PricingConfig {
  return store;
}

export function updatePricingConfigStore(config: PricingConfig): void {
  store = config;
}
