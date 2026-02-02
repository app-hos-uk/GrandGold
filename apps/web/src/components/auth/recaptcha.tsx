'use client';

import { useCallback, useEffect, useState } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/**
 * Execute reCAPTCHA v3 and return token for server verification.
 * Only works when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set.
 */
export function useRecaptcha(action = 'submit') {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || typeof window === 'undefined') return;
    const src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  const execute = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY || !ready || typeof (window as unknown as { grecaptcha?: { execute: (key: string, opts: { action: string }) => Promise<string> } }).grecaptcha?.execute !== 'function') {
      return null;
    }
    try {
      const token = await (window as unknown as { grecaptcha: { execute: (key: string, opts: { action: string }) => Promise<string> } }).grecaptcha.execute(SITE_KEY, { action });
      return token;
    } catch {
      return null;
    }
  }, [ready]);

  return { execute, ready: !!SITE_KEY && ready };
}
