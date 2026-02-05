import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Store config in .grandgold/config.json (relative to project root)
// In production, use database or secret manager
const getConfigPath = () => {
  const root = process.cwd();
  return path.join(root, '.grandgold', 'config.json');
};

/** Integration types for global admin API configuration */
export type MetalPricingProvider = 'metalpriceapi' | 'metalsdev';

export interface MetalPricingConfig {
  provider: MetalPricingProvider;
  apiKey: string;
  baseUrl?: string;
}

export interface IntegrationsConfig {
  metalPricing?: MetalPricingConfig;
}

function maskSecret(value: string | undefined): boolean {
  return !!(value && value.length > 0);
}

export async function GET() {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8').catch(() => '{}');
    const config = JSON.parse(data);
    // Don't return secrets to client - only masked version
    return NextResponse.json({
      success: true,
      data: {
        razorpay: {
          keyId: config.razorpay?.keyId || '',
          keyIdConfigured: !!config.razorpay?.keyId,
        },
        stripe: {
          publishableKey: config.stripe?.publishableKey || '',
          publishableKeyConfigured: !!config.stripe?.publishableKey,
        },
        integrations: {
          metalPricing: {
            provider: (config.integrations?.metalPricing?.provider || 'metalpriceapi').toLowerCase(),
            apiKeyConfigured: maskSecret(config.integrations?.metalPricing?.apiKey),
            baseUrl: (config.integrations?.metalPricing?.baseUrl || '').trim(),
          },
        },
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        razorpay: { keyId: '', keyIdConfigured: false },
        stripe: { publishableKey: '', publishableKeyConfigured: false },
        integrations: {
          metalPricing: {
            provider: 'metalpriceapi',
            apiKeyConfigured: false,
            baseUrl: '',
          },
        },
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const configPath = getConfigPath();
    const dir = path.dirname(configPath);

    await fs.mkdir(dir, { recursive: true });

    let existing: Record<string, unknown> = {};
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      existing = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    const existingIntegrations = (existing.integrations as Record<string, unknown>) || {};
    const existingMetal = (existingIntegrations.metalPricing as Record<string, string> | undefined) || {};

    const updated = {
      ...existing,
      razorpay: body.razorpay
        ? {
            keyId: body.razorpay.keyId || (existing.razorpay as Record<string, string>)?.keyId,
            keySecret: body.razorpay.keySecret || (existing.razorpay as Record<string, string>)?.keySecret,
          }
        : (existing.razorpay as object),
      stripe: body.stripe
        ? {
            publishableKey: body.stripe.publishableKey || (existing.stripe as Record<string, string>)?.publishableKey,
            secretKey: body.stripe.secretKey || (existing.stripe as Record<string, string>)?.secretKey,
          }
        : (existing.stripe as object),
      integrations: body.integrations
        ? {
            ...existingIntegrations,
            metalPricing: body.integrations.metalPricing
              ? {
                  provider: (body.integrations.metalPricing.provider || existingMetal.provider || 'metalpriceapi').toLowerCase(),
                  apiKey: body.integrations.metalPricing.apiKey || existingMetal.apiKey,
                  baseUrl: (body.integrations.metalPricing.baseUrl ?? existingMetal.baseUrl ?? '').trim(),
                }
              : existingIntegrations.metalPricing,
          }
        : existing.integrations,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(configPath, JSON.stringify(updated, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch {
    // Log to monitoring service in production
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save configuration' } },
      { status: 500 }
    );
  }
}
