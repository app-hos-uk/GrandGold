'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

type CountryCode = 'in' | 'ae' | 'uk';

interface GoldRates {
  rate24k: number;
  rate22k: number;
  rate18k: number;
}

interface GoldRateContextValue {
  rates: GoldRates;
  /** Formatted live rate string (e.g. "6,250") or null while loading */
  liveRateDisplay: string | null;
  /** When rates were last fetched (HH:MM) or null */
  updatedAt: string | null;
  /** Whether rates are from fallback (not live) */
  isFallback: boolean;
  /** Currency symbol for the current country */
  symbol: string;
  /** Currency code (INR/AED/GBP) */
  currencyCode: string;
}

const currencyMap: Record<CountryCode, string> = { in: 'INR', ae: 'AED', uk: 'GBP' };
const symbolMap: Record<CountryCode, string> = { in: '₹', ae: 'AED ', uk: '£' };

const fallbackRates: Record<CountryCode, GoldRates> = {
  in: { rate24k: 6250, rate22k: 5730, rate18k: 4690 },
  ae: { rate24k: 242, rate22k: 222, rate18k: 181 },
  uk: { rate24k: 52, rate22k: 48, rate18k: 39 },
};

const GoldRateContext = createContext<GoldRateContextValue | null>(null);

export function GoldRateProvider({
  children,
  country,
}: {
  children: React.ReactNode;
  country: CountryCode;
}) {
  const [rates, setRates] = useState<GoldRates>(fallbackRates[country] || fallbackRates.in);
  const [liveRateDisplay, setLiveRateDisplay] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = currencyMap[country] || 'INR';
  const symbol = symbolMap[country] || '₹';

  const fetchRates = useCallback(() => {
    return fetch('/api/rates/metals')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { gold?: Record<string, number>; cacheTtlSeconds?: number; updatedAt?: string | null } | null) => {
        const rate24k = data?.gold?.[currency];
        if (typeof rate24k === 'number') {
          setRates({
            rate24k,
            rate22k: Math.round(rate24k * 0.916),
            rate18k: Math.round(rate24k * 0.75),
          });
          setLiveRateDisplay(
            rate24k >= 1000
              ? rate24k.toLocaleString('en-IN', { maximumFractionDigits: 0 })
              : String(rate24k)
          );
          setIsFallback(false);
        }
        if (data?.updatedAt) {
          try {
            const d = new Date(data.updatedAt);
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            setUpdatedAt(`${hh}:${mm}`);
          } catch {
            setUpdatedAt(null);
          }
        }
        return data?.cacheTtlSeconds ?? 300;
      })
      .catch(() => {
        setIsFallback(true);
        return 300;
      });
  }, [currency]);

  useEffect(() => {
    // Reset to fallback for current country when country changes
    setRates(fallbackRates[country] || fallbackRates.in);
    setLiveRateDisplay(null);
    setUpdatedAt(null);
    setIsFallback(true);

    let cancelled = false;

    function scheduleNext(ttlSeconds: number) {
      if (cancelled) return;
      const ms = Math.max(30, Math.min(ttlSeconds, 3600)) * 1000;
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        fetchRates().then((nextTtl) => {
          if (!cancelled) scheduleNext(nextTtl);
        });
      }, ms);
    }

    fetchRates().then(scheduleNext);

    return () => {
      cancelled = true;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [country, fetchRates]);

  const value: GoldRateContextValue = {
    rates,
    liveRateDisplay,
    updatedAt,
    isFallback,
    symbol,
    currencyCode: currency,
  };

  return <GoldRateContext.Provider value={value}>{children}</GoldRateContext.Provider>;
}

export function useGoldRates() {
  const ctx = useContext(GoldRateContext);
  if (!ctx) {
    throw new Error('useGoldRates must be used within GoldRateProvider');
  }
  return ctx;
}
