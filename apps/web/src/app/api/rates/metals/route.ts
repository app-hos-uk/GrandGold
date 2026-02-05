import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const getConfigPath = () => path.join(process.cwd(), '.grandgold', 'config.json');
const TROY_OZ_GRAMS = 31.1034768;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

let cache: { data: Record<string, unknown>; expires: number } | null = null;

async function getMetalPricingConfig(): Promise<{
  provider: string;
  apiKey: string;
  baseUrl?: string;
} | null> {
  try {
    const data = await fs.readFile(getConfigPath(), 'utf-8').catch(() => '{}');
    const config = JSON.parse(data);
    const mp = config.integrations?.metalPricing;
    if (!mp?.apiKey) return null;
    const provider = (mp.provider || 'metalpriceapi').toString().toLowerCase();
    return {
      provider: provider === 'metalsdev' ? 'metalsdev' : 'metalpriceapi',
      apiKey: mp.apiKey,
      baseUrl: mp.baseUrl ? String(mp.baseUrl).trim() : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch live metal rates from MetalpriceAPI.
 * API: base=USD, currencies=XAU,INR,AED,GBP → then derive gold per gram in each currency.
 */
async function fetchMetalpriceAPI(apiKey: string, baseUrl?: string): Promise<Record<string, unknown>> {
  const base = baseUrl?.replace(/\/$/, '') || 'https://api.metalpriceapi.com';
  const url = `${base}/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=USD&currencies=XAU,INR,AED,GBP`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MetalpriceAPI error: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rates = json.rates;
  if (!rates || typeof rates.XAU !== 'number') {
    throw new Error('Invalid MetalpriceAPI response: missing rates.XAU');
  }
  // XAU = troy oz of gold per 1 USD → 1/XAU = USD per troy oz; per gram = (1/XAU)/TROY_OZ_GRAMS
  const usdPerGram = 1 / (rates.XAU * TROY_OZ_GRAMS);
  const gold: Record<string, number> = {};
  if (typeof rates.INR === 'number') gold.INR = Math.round(usdPerGram * rates.INR * 100) / 100;
  if (typeof rates.AED === 'number') gold.AED = Math.round(usdPerGram * rates.AED * 100) / 100;
  if (typeof rates.GBP === 'number') gold.GBP = Math.round(usdPerGram * rates.GBP * 100) / 100;
  return {
    gold,
    silver: null,
    updatedAt: new Date().toISOString(),
    provider: 'metalpriceapi',
  };
}

/**
 * Metals.Dev - example endpoint (adjust to their real API docs).
 * Placeholder: same shape as MetalpriceAPI if they support it.
 */
async function fetchMetalsDev(apiKey: string, baseUrl?: string): Promise<Record<string, unknown>> {
  const base = baseUrl?.replace(/\/$/, '') || 'https://api.metals.dev';
  const url = `${base}/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=USD&currencies=XAU,INR,AED,GBP`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metals.Dev error: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rates = json.rates;
  if (!rates || typeof rates.XAU !== 'number') {
    throw new Error('Invalid Metals.Dev response: missing rates.XAU');
  }
  const usdPerGram = 1 / (rates.XAU * TROY_OZ_GRAMS);
  const gold: Record<string, number> = {};
  if (typeof rates.INR === 'number') gold.INR = Math.round(usdPerGram * rates.INR * 100) / 100;
  if (typeof rates.AED === 'number') gold.AED = Math.round(usdPerGram * rates.AED * 100) / 100;
  if (typeof rates.GBP === 'number') gold.GBP = Math.round(usdPerGram * rates.GBP * 100) / 100;
  return {
    gold,
    silver: null,
    updatedAt: new Date().toISOString(),
    provider: 'metalsdev',
  };
}

export async function GET() {
  const config = await getMetalPricingConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Metal pricing API not configured. Configure it in Admin → Settings → API Integrations.' },
      { status: 503 }
    );
  }

  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.data);
  }

  try {
    const data =
      config.provider === 'metalsdev'
        ? await fetchMetalsDev(config.apiKey, config.baseUrl)
        : await fetchMetalpriceAPI(config.apiKey, config.baseUrl);
    cache = { data, expires: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rates';
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
