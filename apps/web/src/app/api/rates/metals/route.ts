import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/* ================================================================== */
/*  Metal Price API — Schedule-Based Fetching                          */
/*                                                                     */
/*  Budget: ~100 API calls/month from MetalpriceAPI                    */
/*  Strategy: Fetch ONLY 3 times daily at UAE market hours:            */
/*    - 09:00 UAE (05:00 UTC)  — Market open                           */
/*    - 12:15 UAE (08:15 UTC)  — Midday                                */
/*    - 16:30 UAE (12:30 UTC)  — Afternoon / before close              */
/*                                                                     */
/*  3 calls/day × 31 days = 93 calls/month (safely under 100)         */
/*                                                                     */
/*  All other requests are served from cache (file + in-memory).       */
/*  Cache persists to .grandgold/rates-cache.json so it survives       */
/*  process restarts (Cloud Run cold starts).                          */
/* ================================================================== */

const TROY_OZ_GRAMS = 31.1034768;

/* ------------------------------------------------------------------ */
/*  Schedule — Fetch windows (UTC times of the 3 daily slots)          */
/* ------------------------------------------------------------------ */

/** UAE is UTC+4. Convert UAE local times to UTC hours/minutes. */
const FETCH_SCHEDULE_UTC = [
  { hour: 5, minute: 0 },   // 09:00 UAE = 05:00 UTC
  { hour: 8, minute: 15 },  // 12:15 UAE = 08:15 UTC
  { hour: 12, minute: 30 }, // 16:30 UAE = 12:30 UTC
];

/**
 * Window (in minutes) after the scheduled time during which a fresh
 * fetch is allowed. Outside this window, only cached data is served.
 * A 10-minute window means: if the request lands at 05:00–05:10 UTC,
 * it will trigger a fresh fetch (if cache is from a previous slot).
 */
const FETCH_WINDOW_MINUTES = 10;

/** Check if current UTC time falls within any fetch window */
function isWithinFetchWindow(now: Date): boolean {
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const nowMinutesFromMidnight = utcHour * 60 + utcMinute;

  for (const slot of FETCH_SCHEDULE_UTC) {
    const slotMinutes = slot.hour * 60 + slot.minute;
    if (nowMinutesFromMidnight >= slotMinutes && nowMinutesFromMidnight < slotMinutes + FETCH_WINDOW_MINUTES) {
      return true;
    }
  }
  return false;
}

/** Get the current slot identifier (e.g. "2026-02-06T05:00") so we know
 *  if we already fetched for this window. */
function getCurrentSlotId(now: Date): string | null {
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const nowMinutesFromMidnight = utcHour * 60 + utcMinute;

  for (const slot of FETCH_SCHEDULE_UTC) {
    const slotMinutes = slot.hour * 60 + slot.minute;
    if (nowMinutesFromMidnight >= slotMinutes && nowMinutesFromMidnight < slotMinutes + FETCH_WINDOW_MINUTES) {
      const d = now.toISOString().split('T')[0]; // YYYY-MM-DD
      return `${d}T${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
    }
  }
  return null;
}

/** Get descriptive next fetch time for display */
function getNextFetchInfo(now: Date): { nextFetchUAE: string; minutesUntil: number } {
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const nowMinutesFromMidnight = utcHour * 60 + utcMinute;

  const uaeLabels = ['9:00 AM', '12:15 PM', '4:30 PM'];

  for (let i = 0; i < FETCH_SCHEDULE_UTC.length; i++) {
    const slotMinutes = FETCH_SCHEDULE_UTC[i].hour * 60 + FETCH_SCHEDULE_UTC[i].minute;
    if (nowMinutesFromMidnight < slotMinutes) {
      return { nextFetchUAE: uaeLabels[i], minutesUntil: slotMinutes - nowMinutesFromMidnight };
    }
  }
  // All slots passed today → next is tomorrow's 9 AM UAE
  const tomorrowFirstSlot = FETCH_SCHEDULE_UTC[0].hour * 60 + FETCH_SCHEDULE_UTC[0].minute;
  return { nextFetchUAE: uaeLabels[0] + ' (tomorrow)', minutesUntil: (24 * 60 - nowMinutesFromMidnight) + tomorrowFirstSlot };
}

/* ------------------------------------------------------------------ */
/*  Cache — In-memory + file-backed persistence                        */
/* ------------------------------------------------------------------ */

interface CachedRates {
  gold: Record<string, number>;
  silver: null;
  updatedAt: string;
  provider: string;
  /** The slot ID when this data was fetched (e.g. "2026-02-06T05:00") */
  fetchedSlotId: string;
}

let memoryCache: CachedRates | null = null;

const CACHE_DIR = path.join(process.cwd(), '.grandgold');
const CACHE_FILE = path.join(CACHE_DIR, 'rates-cache.json');

async function loadCacheFromFile(): Promise<CachedRates | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as CachedRates;
    if (parsed?.gold && parsed?.updatedAt && parsed?.fetchedSlotId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveCacheToFile(data: CachedRates): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[rates/metals] Failed to persist cache:', err);
  }
}

/** Get cached rates — from memory first, then from file */
async function getCachedRates(): Promise<CachedRates | null> {
  if (memoryCache) return memoryCache;
  const fromFile = await loadCacheFromFile();
  if (fromFile) {
    memoryCache = fromFile;
  }
  return fromFile;
}

/* ------------------------------------------------------------------ */
/*  Config (env vars or config.json)                                    */
/* ------------------------------------------------------------------ */

const CONFIG_FILE = path.join(process.cwd(), '.grandgold', 'config.json');

async function getMetalPricingConfig(): Promise<{
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
} | null> {
  if (process.env.METAL_PRICING_API_KEY) {
    const provider = (process.env.METAL_PRICING_PROVIDER || 'metalpriceapi').toString().toLowerCase();
    const enabled = process.env.METAL_PRICING_ENABLED !== 'false' && process.env.METAL_PRICING_ENABLED !== '0';
    return {
      provider: provider === 'metalsdev' ? 'metalsdev' : 'metalpriceapi',
      apiKey: process.env.METAL_PRICING_API_KEY,
      baseUrl: process.env.METAL_PRICING_BASE_URL?.trim() || undefined,
      enabled,
    };
  }

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8').catch(() => '{}');
    const config = JSON.parse(data);
    const mp = config.integrations?.metalPricing;
    if (!mp?.apiKey) return null;
    const provider = (mp.provider || 'metalpriceapi').toString().toLowerCase();
    const enabled = mp.enabled !== false;
    return {
      provider: provider === 'metalsdev' ? 'metalsdev' : 'metalpriceapi',
      apiKey: mp.apiKey,
      baseUrl: mp.baseUrl ? String(mp.baseUrl).trim() : undefined,
      enabled,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  API fetch functions                                                 */
/* ------------------------------------------------------------------ */

async function fetchMetalpriceAPI(apiKey: string, baseUrl?: string): Promise<Record<string, number>> {
  const base = baseUrl?.replace(/\/$/, '') || 'https://api.metalpriceapi.com';
  const url = `${base}/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=USD&currencies=XAU,INR,AED,GBP`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MetalpriceAPI error: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rates = json.rates;
  if (!rates || typeof rates.XAU !== 'number') {
    throw new Error('Invalid MetalpriceAPI response: missing rates.XAU');
  }
  const usdPerGram = 1 / (rates.XAU * TROY_OZ_GRAMS);
  const gold: Record<string, number> = {};
  if (typeof rates.INR === 'number') gold.INR = Math.round(usdPerGram * rates.INR * 100) / 100;
  if (typeof rates.AED === 'number') gold.AED = Math.round(usdPerGram * rates.AED * 100) / 100;
  if (typeof rates.GBP === 'number') gold.GBP = Math.round(usdPerGram * rates.GBP * 100) / 100;
  return gold;
}

async function fetchMetalsDev(apiKey: string, baseUrl?: string): Promise<Record<string, number>> {
  const base = baseUrl?.replace(/\/$/, '') || 'https://api.metals.dev';
  const url = `${base}/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=USD&currencies=XAU,INR,AED,GBP`;
  const res = await fetch(url, { cache: 'no-store' });
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
  return gold;
}

/* ------------------------------------------------------------------ */
/*  Hardcoded fallback rates (used when API has never been called)      */
/* ------------------------------------------------------------------ */

const FALLBACK_RATES: Record<string, number> = {
  INR: 6250,
  AED: 242,
  GBP: 52,
};

/* ------------------------------------------------------------------ */
/*  Manual pricing config — shared in-memory store                      */
/* ------------------------------------------------------------------ */

import { getPricingConfigStore } from './pricing-store';

interface PricingCountryConfig {
  mode: 'manual' | 'api';
  manualRate24k: number | null;
  manualRate22k: number | null;
  manualRate18k: number | null;
  apiAdjustmentPercent: number;
  manualRateUpdatedAt: string | null;
}

interface PricingConfigData {
  countries: Record<string, PricingCountryConfig>;
  fetchSchedule?: Array<{ hour: number; minute: number; enabled: boolean }>;
  fetchWindowMinutes?: number;
  apiEnabled?: boolean;
}

/** Get pricing config from the shared in-memory store */
async function getPricingConfig(): Promise<PricingConfigData | null> {
  try {
    return getPricingConfigStore();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                         */
/* ------------------------------------------------------------------ */

export async function GET() {
  const config = await getMetalPricingConfig();
  const pricingConfig = await getPricingConfig();
  const now = new Date();

  // --- 0. Check for manual pricing overrides ----------------
  // Build gold rates object: start with fallback, override per-country
  const manualOverrides: Record<string, number> = {};
  const manualCountries: string[] = [];
  const apiCountries: string[] = [];
  const adjustments: Record<string, number> = {};

  if (pricingConfig?.countries) {
    for (const [code, cc] of Object.entries(pricingConfig.countries)) {
      if (cc.mode === 'manual' && cc.manualRate24k != null && cc.manualRate24k > 0) {
        manualOverrides[code] = cc.manualRate24k;
        manualCountries.push(code);
      } else {
        apiCountries.push(code);
      }
      if (cc.apiAdjustmentPercent && cc.apiAdjustmentPercent !== 0) {
        adjustments[code] = cc.apiAdjustmentPercent;
      }
    }
  }

  // If ALL countries are manual, just return manual rates directly
  if (manualCountries.length > 0 && apiCountries.length === 0) {
    const gold: Record<string, number> = {};
    for (const [code, rate] of Object.entries(manualOverrides)) {
      gold[code] = rate;
    }
    return NextResponse.json({
      gold,
      silver: null,
      updatedAt: pricingConfig?.countries?.[manualCountries[0]]?.manualRateUpdatedAt || null,
      provider: 'manual',
      pricingMode: 'manual',
      cacheTtlSeconds: 60,
    });
  }

  // Use custom fetch schedule if configured
  // (pricingConfig.fetchSchedule overrides the hardcoded FETCH_SCHEDULE_UTC)

  // --- 1. Try to serve from cache (memory or file) ---------
  const cached = await getCachedRates();

  // --- 2. Determine if we should attempt a fresh fetch ------
  let shouldFetch = false;
  let currentSlotId: string | null = null;

  if (config?.enabled && config.apiKey) {
    if (isWithinFetchWindow(now)) {
      currentSlotId = getCurrentSlotId(now);
      // Only fetch if we haven't already fetched for this slot
      if (currentSlotId && (!cached || cached.fetchedSlotId !== currentSlotId)) {
        shouldFetch = true;
      }
    }
    // Also fetch if we have NO cached data at all (first-time boot)
    if (!cached) {
      shouldFetch = true;
    }
  }

  // --- 3. Fetch if needed -----------------------------------
  if (shouldFetch && config) {
    try {
      console.log(`[rates/metals] Fetching live rates from ${config.provider} (slot: ${currentSlotId || 'initial'})`);
      const gold =
        config.provider === 'metalsdev'
          ? await fetchMetalsDev(config.apiKey, config.baseUrl)
          : await fetchMetalpriceAPI(config.apiKey, config.baseUrl);

      const newCache: CachedRates = {
        gold,
        silver: null,
        updatedAt: now.toISOString(),
        provider: config.provider,
        fetchedSlotId: currentSlotId || `init-${now.toISOString()}`,
      };

      // Update both caches
      memoryCache = newCache;
      await saveCacheToFile(newCache);

      console.log(`[rates/metals] Rates updated: INR=${gold.INR}, AED=${gold.AED}, GBP=${gold.GBP}`);

      // Apply manual overrides and adjustments
      const finalGold = { ...gold };
      for (const [code, rate] of Object.entries(manualOverrides)) {
        finalGold[code] = rate;
      }
      for (const [code, pct] of Object.entries(adjustments)) {
        if (finalGold[code] && !manualOverrides[code]) {
          finalGold[code] = Math.round(finalGold[code] * (1 + pct / 100) * 100) / 100;
        }
      }

      const nextInfo = getNextFetchInfo(now);
      return NextResponse.json({
        gold: finalGold,
        silver: null,
        updatedAt: newCache.updatedAt,
        provider: config.provider,
        pricingMode: manualCountries.length > 0 ? 'mixed' : 'api',
        manualCountries: manualCountries.length > 0 ? manualCountries : undefined,
        cacheTtlSeconds: nextInfo.minutesUntil * 60,
        schedule: {
          fetchTimes: ['9:00 AM UAE', '12:15 PM UAE', '4:30 PM UAE'],
          nextFetch: nextInfo.nextFetchUAE,
          minutesUntilNextFetch: nextInfo.minutesUntil,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rates';
      console.error(`[rates/metals] Fetch error: ${message}`);
      // Fall through to serve cached data if available
    }
  }

  // --- 4. Serve cached data ---------------------------------
  if (cached) {
    const nextInfo = getNextFetchInfo(now);
    const ageMs = now.getTime() - new Date(cached.updatedAt).getTime();
    const ageMinutes = Math.round(ageMs / 60000);

    // Apply manual overrides and adjustments to cached rates
    const finalGold = { ...cached.gold };
    for (const [code, rate] of Object.entries(manualOverrides)) {
      finalGold[code] = rate;
    }
    for (const [code, pct] of Object.entries(adjustments)) {
      if (finalGold[code] && !manualOverrides[code]) {
        finalGold[code] = Math.round(finalGold[code] * (1 + pct / 100) * 100) / 100;
      }
    }

    return NextResponse.json({
      gold: finalGold,
      silver: cached.silver,
      updatedAt: cached.updatedAt,
      provider: cached.provider,
      pricingMode: manualCountries.length > 0 ? 'mixed' : 'api',
      manualCountries: manualCountries.length > 0 ? manualCountries : undefined,
      cacheTtlSeconds: nextInfo.minutesUntil * 60,
      cached: true,
      ageMinutes,
      schedule: {
        fetchTimes: ['9:00 AM UAE', '12:15 PM UAE', '4:30 PM UAE'],
        nextFetch: nextInfo.nextFetchUAE,
        minutesUntilNextFetch: nextInfo.minutesUntil,
      },
    });
  }

  // --- 5. No cache, no API — serve manual or hardcoded fallback -------
  const finalFallback = { ...FALLBACK_RATES };
  for (const [code, rate] of Object.entries(manualOverrides)) {
    finalFallback[code] = rate;
  }

  const nextInfo = getNextFetchInfo(now);
  return NextResponse.json({
    gold: finalFallback,
    silver: null,
    updatedAt: null,
    provider: manualCountries.length > 0 ? 'manual' : 'fallback',
    pricingMode: manualCountries.length > 0 ? 'mixed' : 'fallback',
    manualCountries: manualCountries.length > 0 ? manualCountries : undefined,
    cacheTtlSeconds: nextInfo.minutesUntil * 60,
    fallback: manualCountries.length === 0,
    schedule: {
      fetchTimes: ['9:00 AM UAE', '12:15 PM UAE', '4:30 PM UAE'],
      nextFetch: nextInfo.nextFetchUAE,
      minutesUntilNextFetch: nextInfo.minutesUntil,
    },
    message: config
      ? 'API configured but no cached data yet. Rates will be fetched at the next scheduled time.'
      : 'Metal pricing API not configured. Set METAL_PRICING_API_KEY env var or configure in Admin → Settings.',
  });
}
