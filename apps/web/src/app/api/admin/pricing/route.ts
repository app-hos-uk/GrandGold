import { NextRequest, NextResponse } from 'next/server';
import {
  type PricingMode,
  type CountryPricing,
  type PricingConfig,
  getPricingConfigStore,
  updatePricingConfigStore,
} from '@/app/api/rates/metals/pricing-store';

// ── GET — Return current pricing config ──────────────────────────────

export async function GET() {
  return NextResponse.json({
    success: true,
    data: getPricingConfigStore(),
  });
}

// ── POST — Update pricing config ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const pricingConfig = { ...getPricingConfigStore() };
    pricingConfig.countries = { ...pricingConfig.countries };

    // Update country-specific pricing
    if (body.countries && typeof body.countries === 'object') {
      for (const [code, update] of Object.entries(body.countries)) {
        const countryCode = code.toUpperCase();
        const existing = pricingConfig.countries[countryCode] || {
          mode: 'api' as PricingMode,
          manualRate24k: null,
          manualRate22k: null,
          manualRate18k: null,
          apiAdjustmentPercent: 0,
          manualRateUpdatedAt: null,
          manualRateUpdatedBy: null,
        };

        const u = update as Partial<CountryPricing>;

        pricingConfig.countries[countryCode] = {
          mode: u.mode || existing.mode,
          manualRate24k: u.manualRate24k !== undefined ? u.manualRate24k : existing.manualRate24k,
          manualRate22k: u.manualRate22k !== undefined ? u.manualRate22k : existing.manualRate22k,
          manualRate18k: u.manualRate18k !== undefined ? u.manualRate18k : existing.manualRate18k,
          apiAdjustmentPercent:
            u.apiAdjustmentPercent !== undefined
              ? Math.max(-50, Math.min(50, Number(u.apiAdjustmentPercent) || 0))
              : existing.apiAdjustmentPercent,
          manualRateUpdatedAt:
            u.manualRate24k !== undefined || u.mode !== existing.mode ? now : existing.manualRateUpdatedAt,
          manualRateUpdatedBy: u.manualRateUpdatedBy || existing.manualRateUpdatedBy,
        };
      }
    }

    // Update fetch schedule
    if (Array.isArray(body.fetchSchedule)) {
      pricingConfig.fetchSchedule = body.fetchSchedule
        .filter(
          (slot: unknown) =>
            slot &&
            typeof slot === 'object' &&
            'hour' in (slot as Record<string, unknown>) &&
            'minute' in (slot as Record<string, unknown>)
        )
        .map((slot: { hour: number; minute: number; enabled?: boolean }) => ({
          hour: Math.max(0, Math.min(23, Number(slot.hour) || 0)),
          minute: Math.max(0, Math.min(59, Number(slot.minute) || 0)),
          enabled: slot.enabled !== false,
        }))
        .slice(0, 6); // Max 6 slots
    }

    // Update fetch window
    if (typeof body.fetchWindowMinutes === 'number') {
      pricingConfig.fetchWindowMinutes = Math.max(5, Math.min(30, body.fetchWindowMinutes));
    }

    // Update global API toggle
    if (typeof body.apiEnabled === 'boolean') {
      pricingConfig.apiEnabled = body.apiEnabled;
    }

    pricingConfig.updatedAt = now;
    updatePricingConfigStore(pricingConfig);

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration saved successfully',
      data: pricingConfig,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save pricing configuration' } },
      { status: 500 }
    );
  }
}
