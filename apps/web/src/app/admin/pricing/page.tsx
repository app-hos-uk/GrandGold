'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Save,
  Check,
  Loader2,
  RefreshCw,
  Clock,
  Globe,
  Edit3,
  Zap,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type PricingMode = 'manual' | 'api';

interface CountryPricing {
  mode: PricingMode;
  manualRate24k: number | null;
  manualRate22k: number | null;
  manualRate18k: number | null;
  apiAdjustmentPercent: number;
  manualRateUpdatedAt: string | null;
  manualRateUpdatedBy: string | null;
}

interface FetchScheduleSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}

interface PricingConfig {
  countries: Record<string, CountryPricing>;
  fetchSchedule: FetchScheduleSlot[];
  fetchWindowMinutes: number;
  apiEnabled: boolean;
  updatedAt: string | null;
}

interface LiveRates {
  gold: Record<string, number>;
  provider: string;
  pricingMode?: string;
  updatedAt: string | null;
  cached?: boolean;
  ageMinutes?: number;
  schedule?: {
    fetchTimes: string[];
    nextFetch: string;
    minutesUntilNextFetch: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Country info                                                        */
/* ------------------------------------------------------------------ */

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED ' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [liveRates, setLiveRates] = useState<LiveRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable state
  const [countries, setCountries] = useState<Record<string, CountryPricing>>({});
  const [schedule, setSchedule] = useState<FetchScheduleSlot[]>([]);
  const [fetchWindow, setFetchWindow] = useState(10);
  const [apiEnabled, setApiEnabled] = useState(true);

  // Load config and live rates
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pricing').then((r) => r.json()),
      fetch('/api/rates/metals').then((r) => r.json()),
    ])
      .then(([configRes, ratesRes]) => {
        const cfg = configRes?.data as PricingConfig;
        if (cfg) {
          setConfig(cfg);
          setCountries(cfg.countries);
          setSchedule(cfg.fetchSchedule);
          setFetchWindow(cfg.fetchWindowMinutes);
          setApiEnabled(cfg.apiEnabled);
        }
        setLiveRates(ratesRes as LiveRates);
      })
      .catch(() => setError('Failed to load pricing configuration'))
      .finally(() => setLoading(false));
  }, []);

  const refreshLiveRates = () => {
    fetch('/api/rates/metals')
      .then((r) => r.json())
      .then((data) => setLiveRates(data as LiveRates))
      .catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countries,
          fetchSchedule: schedule,
          fetchWindowMinutes: fetchWindow,
          apiEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to save');
      setConfig(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Refresh live rates to show updated values
      refreshLiveRates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateCountry = (code: string, updates: Partial<CountryPricing>) => {
    setCountries((prev) => ({
      ...prev,
      [code]: { ...prev[code], ...updates },
    }));
  };

  const addScheduleSlot = () => {
    if (schedule.length >= 6) return;
    setSchedule((prev) => [...prev, { hour: 12, minute: 0, enabled: true }]);
  };

  const removeScheduleSlot = (idx: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateScheduleSlot = (idx: number, updates: Partial<FetchScheduleSlot>) => {
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const formatTime = (hour: number, minute: number) => {
    const h12 = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        <span className="ml-3 text-gray-500">Loading pricing configuration...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            Metal Pricing Management
          </h1>
          <p className="text-gray-600 mt-1">
            Set manual prices, choose pricing mode per country, and manage API fetch schedules.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-medium ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gold-500 text-white hover:bg-gold-600'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Live Rates Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-gold-400" />
            <div>
              <h2 className="text-lg font-bold">Live Rates Preview</h2>
              <p className="text-gray-400 text-sm">What customers currently see on the storefront</p>
            </div>
          </div>
          <button
            onClick={refreshLiveRates}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {COUNTRIES.map((c) => {
            const rate = liveRates?.gold?.[c.currency] ?? liveRates?.gold?.[c.code];
            const countryConf = countries[c.code];
            const isManual = countryConf?.mode === 'manual';
            return (
              <div key={c.code} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{c.flag}</span>
                  <span className="font-semibold">{c.name}</span>
                </div>
                <p className="text-2xl font-bold text-gold-400">
                  {c.symbol}{rate != null ? (rate >= 1000 ? rate.toLocaleString('en-IN') : rate.toFixed(2)) : '—'}<span className="text-sm font-normal text-gray-400">/g</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isManual ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {isManual ? 'Manual' : 'API'}
                  </span>
                  {countryConf?.apiAdjustmentPercent !== 0 && countryConf?.apiAdjustmentPercent != null && !isManual && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      {countryConf.apiAdjustmentPercent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {countryConf.apiAdjustmentPercent > 0 ? '+' : ''}{countryConf.apiAdjustmentPercent}% adj
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span>Provider: {liveRates?.provider || '—'}</span>
          <span>Mode: {liveRates?.pricingMode || '—'}</span>
          {liveRates?.updatedAt && (
            <span>Updated: {new Date(liveRates.updatedAt).toLocaleString()}</span>
          )}
          {liveRates?.cached && liveRates?.ageMinutes != null && (
            <span>Cache age: {liveRates.ageMinutes} min</span>
          )}
        </div>
      </motion.div>

      {/* Global API Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8 bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API Price Feed</h2>
              <p className="text-sm text-gray-500">
                Enable or disable the external metal pricing API globally. When disabled, all countries use manual pricing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApiEnabled(!apiEnabled)}
            className="flex items-center gap-2"
          >
            {apiEnabled ? (
              <ToggleRight className="w-10 h-10 text-gold-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-300" />
            )}
            <span className={`text-sm font-medium ${apiEnabled ? 'text-gold-600' : 'text-gray-500'}`}>
              {apiEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Per-Country Pricing Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-gold-500" />
          Country Pricing
        </h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {COUNTRIES.map((c, idx) => {
            const cp = countries[c.code] || {
              mode: 'api' as PricingMode,
              manualRate24k: null,
              manualRate22k: null,
              manualRate18k: null,
              apiAdjustmentPercent: 0,
              manualRateUpdatedAt: null,
              manualRateUpdatedBy: null,
            };
            const isManual = cp.mode === 'manual';
            const rate22k = cp.manualRate22k ?? (cp.manualRate24k ? Math.round(cp.manualRate24k * 0.916) : null);
            const rate18k = cp.manualRate18k ?? (cp.manualRate24k ? Math.round(cp.manualRate24k * 0.75) : null);

            return (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Country Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.flag}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-500">{c.currency} ({c.symbol.trim()})</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Pricing Mode Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Source</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateCountry(c.code, { mode: 'manual' })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          isManual
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCountry(c.code, { mode: 'api' })}
                        disabled={!apiEnabled}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          !isManual && apiEnabled
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : !apiEnabled
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        API
                      </button>
                    </div>
                    {!apiEnabled && !isManual && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        API is globally disabled. Using manual mode.
                      </p>
                    )}
                  </div>

                  {/* Manual Rate Entry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      24K Gold Rate ({c.symbol.trim()}/gram)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cp.manualRate24k ?? ''}
                      onChange={(e) =>
                        updateCountry(c.code, {
                          manualRate24k: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder={isManual ? 'Required for manual mode' : 'Fallback rate'}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg font-semibold ${
                        isManual ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                      }`}
                    />
                    {cp.manualRate24k != null && cp.manualRate24k > 0 && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>22K: {c.symbol}{rate22k?.toLocaleString()}</span>
                        <span>18K: {c.symbol}{rate18k?.toLocaleString()}</span>
                      </div>
                    )}
                    {cp.manualRateUpdatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(cp.manualRateUpdatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Custom 22K/18K rates (expandable) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">22K Rate (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cp.manualRate22k ?? ''}
                        onChange={(e) =>
                          updateCountry(c.code, {
                            manualRate22k: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder={rate22k != null ? `Auto: ${rate22k}` : '—'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">18K Rate (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cp.manualRate18k ?? ''}
                        onChange={(e) =>
                          updateCountry(c.code, {
                            manualRate18k: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder={rate18k != null ? `Auto: ${rate18k}` : '—'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>

                  {/* API Adjustment (only relevant in API mode) */}
                  {!isManual && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Rate Adjustment (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="-50"
                          max="50"
                          value={cp.apiAdjustmentPercent}
                          onChange={(e) =>
                            updateCountry(c.code, {
                              apiAdjustmentPercent: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                        <span className="text-sm text-gray-400 flex-shrink-0">%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Adjust API rate for local market difference. E.g., +2% adds 2% on top of API price.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* API Fetch Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8 bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API Fetch Schedule</h2>
              <p className="text-sm text-gray-500">
                Configure when the system fetches live rates from the metal pricing API. Times are in UAE timezone (UTC+4).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addScheduleSlot}
            disabled={schedule.length >= 6}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gold-600 hover:bg-gold-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>

        <div className="space-y-3">
          {schedule.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-500 w-8">#{idx + 1}</span>

              <div className="flex items-center gap-2">
                <select
                  value={slot.hour}
                  onChange={(e) => updateScheduleSlot(idx, { hour: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-gray-400">:</span>
                <select
                  value={slot.minute}
                  onChange={(e) => updateScheduleSlot(idx, { minute: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 ml-1">UAE</span>
              </div>

              <span className="text-sm text-gray-400">
                ({formatTime(slot.hour, slot.minute)})
              </span>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => updateScheduleSlot(idx, { enabled: !slot.enabled })}
                  className="flex items-center gap-1"
                >
                  {slot.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeScheduleSlot(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {schedule.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No fetch slots configured. Add slots above to enable API fetching.</p>
            </div>
          )}
        </div>

        {/* Fetch window */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fetch Window (minutes)</label>
              <p className="text-xs text-gray-500 mt-0.5">
                How many minutes after the scheduled time should the system attempt a fetch.
              </p>
            </div>
            <select
              value={fetchWindow}
              onChange={(e) => setFetchWindow(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {[5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current schedule info */}
        {liveRates?.schedule && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Current Active Schedule</p>
                <p className="mt-1">
                  Fetch times: {liveRates.schedule.fetchTimes.join(', ')}
                </p>
                <p>
                  Next fetch: {liveRates.schedule.nextFetch} ({liveRates.schedule.minutesUntilNextFetch} min)
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-2">
            <p className="font-medium">How Pricing Modes Work</p>
            <ul className="space-y-1 text-amber-700">
              <li><strong>Manual mode:</strong> The 24K rate you enter is shown directly to customers. 22K and 18K are auto-calculated (91.6% and 75% of 24K) unless you override them.</li>
              <li><strong>API mode:</strong> Live rates are fetched from MetalpriceAPI/Metals.Dev at scheduled times. You can apply a % adjustment for local market differences.</li>
              <li><strong>Mixed mode:</strong> Some countries use manual, others use API. Each country is independent.</li>
              <li><strong>Schedule:</strong> The API budget is ~100 calls/month. 3 fetches/day = 93 calls/month. Add more slots carefully.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
