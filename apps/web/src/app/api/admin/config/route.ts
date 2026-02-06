import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin configuration API.
 *
 * Cloud Run containers have an ephemeral, read-only filesystem, so we
 * cannot persist config to disk.  We use an in-memory store here so the
 * admin panel keeps working across requests within the same instance.
 *
 * For true persistence across deploys / instances, migrate to a database
 * table or GCP Secret Manager.
 */

/** Integration types for global admin API configuration */
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

// ── In-memory config store (replaces filesystem) ──────────────────────
let configStore: Record<string, unknown> = {};

// Seed from environment variables so Cloud Run deployments start pre-configured
function seedFromEnv(): void {
  if (Object.keys(configStore).length > 0) return; // already seeded

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

// ── Helpers ────────────────────────────────────────────────────────────

function maskSecret(value: string | undefined): boolean {
  return !!(value && value.length > 0);
}

// ── GET ───────────────────────────────────────────────────────────────

export async function GET() {
  seedFromEnv();

  const config = configStore;
  const razorpay = config.razorpay as Record<string, string> | undefined;
  const stripe = config.stripe as Record<string, string> | undefined;
  const integrations = config.integrations as Record<string, Record<string, unknown>> | undefined;
  const metalPricing = integrations?.metalPricing;

  return NextResponse.json({
    success: true,
    data: {
      razorpay: {
        keyId: razorpay?.keyId || '',
        keyIdConfigured: !!razorpay?.keyId,
      },
      stripe: {
        publishableKey: stripe?.publishableKey || '',
        publishableKeyConfigured: !!stripe?.publishableKey,
      },
      integrations: {
        metalPricing: {
          provider: ((metalPricing?.provider as string) || 'metalpriceapi').toLowerCase(),
          apiKeyConfigured: maskSecret(metalPricing?.apiKey as string | undefined),
          baseUrl: ((metalPricing?.baseUrl as string) || '').trim(),
          enabled: metalPricing?.enabled !== false,
          fetchIntervalMinutes: Math.min(
            60,
            Math.max(1, Number(metalPricing?.fetchIntervalMinutes) || 5),
          ),
        },
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    seedFromEnv();

    const body = await request.json();
    const existing = configStore;

    const existingIntegrations = (existing.integrations as Record<string, unknown>) || {};
    const existingMetal =
      (existingIntegrations.metalPricing as Record<string, string> | undefined) || {};

    configStore = {
      ...existing,
      razorpay: body.razorpay
        ? {
            keyId:
              body.razorpay.keyId ||
              (existing.razorpay as Record<string, string>)?.keyId,
            keySecret:
              body.razorpay.keySecret ||
              (existing.razorpay as Record<string, string>)?.keySecret,
          }
        : (existing.razorpay as object),
      stripe: body.stripe
        ? {
            publishableKey:
              body.stripe.publishableKey ||
              (existing.stripe as Record<string, string>)?.publishableKey,
            secretKey:
              body.stripe.secretKey ||
              (existing.stripe as Record<string, string>)?.secretKey,
          }
        : (existing.stripe as object),
      integrations: body.integrations
        ? {
            ...existingIntegrations,
            metalPricing: body.integrations.metalPricing
              ? {
                  provider: (
                    body.integrations.metalPricing.provider ||
                    existingMetal.provider ||
                    'metalpriceapi'
                  ).toLowerCase(),
                  apiKey:
                    body.integrations.metalPricing.apiKey || existingMetal.apiKey,
                  baseUrl: (
                    body.integrations.metalPricing.baseUrl ??
                    existingMetal.baseUrl ??
                    ''
                  ).trim(),
                  enabled: body.integrations.metalPricing.enabled !== false,
                  fetchIntervalMinutes: Math.min(
                    60,
                    Math.max(
                      1,
                      Number(
                        body.integrations.metalPricing.fetchIntervalMinutes,
                      ) || 5,
                    ),
                  ),
                }
              : existingIntegrations.metalPricing,
          }
        : existing.integrations,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save configuration' } },
      { status: 500 },
    );
  }
}
