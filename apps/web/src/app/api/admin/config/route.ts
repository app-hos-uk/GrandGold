import { NextRequest, NextResponse } from 'next/server';
import { getConfigStore, setConfigStore } from './config-store';

// ── Helpers ────────────────────────────────────────────────────────────

function maskSecret(value: string | undefined): boolean {
  return !!(value && value.length > 0);
}

// ── GET ───────────────────────────────────────────────────────────────

export async function GET() {
  const config = getConfigStore();
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
    const body = await request.json();
    const existing = getConfigStore();

    const existingIntegrations = (existing.integrations as Record<string, unknown>) || {};
    const existingMetal =
      (existingIntegrations.metalPricing as Record<string, string> | undefined) || {};

    setConfigStore({
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
    });

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
