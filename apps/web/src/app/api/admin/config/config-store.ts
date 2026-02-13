/* ================================================================== */
/*  Shared admin config store (singleton)                              */
/*                                                                     */
/*  Both /api/admin/config and /api/rates/metals import from here      */
/*  so the metal pricing API key configured in admin Settings is       */
/*  immediately visible to the rate-fetching route.                    */
/*                                                                     */
/*  For true persistence across deploys / cold starts, migrate to a    */
/*  database table or GCP Secret Manager.                              */
/* ================================================================== */

export type MetalPricingProvider = 'metalpriceapi' | 'metalsdev';

export interface MetalPricingConfig {
  provider: MetalPricingProvider;
  apiKey: string;
  baseUrl?: string;
  enabled?: boolean;
  fetchIntervalMinutes?: number;
}

export interface IntegrationsConfig {
  metalPricing?: MetalPricingConfig;
}

// ── Singleton store ────────────────────────────────────────────────────
let configStore: Record<string, unknown> = {};
let seeded = false;

/** Seed from environment variables so Cloud Run starts pre-configured */
function seedFromEnv(): void {
  if (seeded) return;
  seeded = true;

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const metalApiKey = process.env.METAL_PRICING_API_KEY;
  const metalProvider = process.env.METAL_PRICING_PROVIDER;

  if (razorpayKeyId || razorpayKeySecret) {
    configStore.razorpay = { keyId: razorpayKeyId, keySecret: razorpayKeySecret };
  }
  if (stripePublishableKey || stripeSecretKey) {
    configStore.stripe = { publishableKey: stripePublishableKey, secretKey: stripeSecretKey };
  }
  if (metalApiKey || metalProvider) {
    configStore.integrations = {
      metalPricing: {
        provider: (metalProvider || 'metalpriceapi').toLowerCase(),
        apiKey: metalApiKey || '',
        baseUrl: process.env.METAL_PRICING_BASE_URL || '',
        enabled: true,
        fetchIntervalMinutes: 5,
      },
    };
  }
}

/** Get the full config store (auto-seeds from env on first call) */
export function getConfigStore(): Record<string, unknown> {
  seedFromEnv();
  return configStore;
}

/** Replace the config store (used by POST /api/admin/config) */
export function setConfigStore(newConfig: Record<string, unknown>): void {
  seedFromEnv();
  configStore = newConfig;
}

/** Get the metal pricing integration config (convenience accessor for /api/rates/metals) */
export function getMetalPricingFromStore(): MetalPricingConfig | null {
  seedFromEnv();
  const integrations = configStore.integrations as Record<string, unknown> | undefined;
  const mp = integrations?.metalPricing as MetalPricingConfig | undefined;
  if (!mp?.apiKey) return null;
  return mp;
}
