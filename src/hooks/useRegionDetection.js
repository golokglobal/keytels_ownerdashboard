/**
 * useRegionDetection
 *
 * Detects the user's region/country from multiple signals, ordered by reliability:
 *
 * Priority 1 — User profile country (set during signup)           ★★★★★
 * Priority 2 — Phone country code  (+91 → IN, +1 → US/CA, etc.)  ★★★★☆
 * Priority 3 — Browser locale      (en-IN → IN, en-US → US)       ★★★☆☆
 * Priority 4 — IP geolocation      (ipapi.co free tier)            ★★★☆☆
 * Priority 5 — GPS                 (navigator.geolocation)         ★★☆☆☆ (async, user must allow)
 *
 * Returns { region, currency, currencySymbol, countryCode, loading }
 *
 * `region` is one of: 'IN' | 'US' | 'GB' | 'EU' | 'AE' | 'SG' | 'AU' | 'DEFAULT'
 */

import { useState, useEffect } from 'react';
import { getRegionConfig, PHONE_PREFIX_MAP, LOCALE_MAP } from '../utils/regionCurrencyConfig';

const CACHE_KEY = 'keytels_detected_region';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCachedRegion() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { region, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return region;
  } catch {
    return null;
  }
}

function setCachedRegion(region) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ region, ts: Date.now() }));
  } catch { /* ignore */ }
}

/** Extract country code from phone string like "+91 9876543210" or "+1-555-000" */
function countryFromPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Try longest prefix first (e.g. +971 before +97)
  for (const prefix of Object.keys(PHONE_PREFIX_MAP).sort((a, b) => b.length - a.length)) {
    if (cleaned.startsWith(prefix)) return PHONE_PREFIX_MAP[prefix];
  }
  return null;
}

/** Extract country code from browser locale string like "en-IN" → "IN" */
function countryFromLocale(locale) {
  if (!locale) return null;
  const parts = locale.split('-');
  if (parts.length >= 2) {
    const cc = parts[parts.length - 1].toUpperCase();
    return LOCALE_MAP[cc] || cc;
  }
  return null;
}

/** Fetch region from IP geolocation (ipapi.co free tier — 1000 req/day) */
async function detectFromIp() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.country_code || null;
  } catch {
    return null;
  }
}

/** Reverse-geocode GPS coords to country code (nominatim OSM, free) */
async function detectFromGps() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`;
          const res = await fetch(url, {
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(4000),
          });
          const data = await res.json();
          resolve(data?.address?.country_code?.toUpperCase() || null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}

/**
 * Main hook.
 *
 * @param {object} [userProfile]           Redux user object (optional)
 * @param {string} [userProfile.country]   ISO country code from signup
 * @param {string} [userProfile.phone]     Phone number (may include country prefix)
 */
export function useRegionDetection(userProfile = null) {
  const [state, setState] = useState(() => {
    // Instant resolution from cache so the UI doesn't flicker
    const cached = getCachedRegion();
    if (cached) {
      const config = getRegionConfig(cached);
      return { countryCode: cached, ...config, loading: false };
    }
    return { countryCode: 'DEFAULT', ...getRegionConfig('DEFAULT'), loading: true };
  });

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      // ── Priority 1: User profile country ──────────────────────────────────
      if (userProfile?.country) {
        const cc = userProfile.country.toUpperCase();
        if (!cancelled) finalize(cc);
        return;
      }

      // ── Priority 2: Phone country code ────────────────────────────────────
      const fromPhone = countryFromPhone(userProfile?.phone || userProfile?.phoneNumber);
      if (fromPhone) {
        if (!cancelled) finalize(fromPhone);
        return;
      }

      // ── Priority 3: Browser locale ─────────────────────────────────────────
      const navigatorLang = navigator.language || navigator.languages?.[0] || '';
      const fromLocale = countryFromLocale(navigatorLang);
      if (fromLocale && fromLocale !== 'US') {
        // If locale says non-US, trust it immediately; for US we keep looking
        // (too many locales default to en-US even for non-US users)
        if (!cancelled) finalize(fromLocale);
        return;
      }

      // ── Priority 4: IP geolocation ────────────────────────────────────────
      // Run IP + GPS in parallel, take whichever resolves first with a value
      const cached = getCachedRegion();
      if (cached) {
        if (!cancelled) finalize(cached);
        return;
      }

      const ipResult = await detectFromIp();
      if (ipResult && !cancelled) {
        finalize(ipResult);
        // Still kick off GPS in background for next session — don't await
        detectFromGps().then((gpsResult) => {
          if (gpsResult) setCachedRegion(gpsResult);
        });
        return;
      }

      // ── Priority 5: GPS ───────────────────────────────────────────────────
      const gpsResult = await detectFromGps();
      if (!cancelled) finalize(gpsResult || fromLocale || 'DEFAULT');
    }

    function finalize(countryCode) {
      const cc = (countryCode || 'DEFAULT').toUpperCase();
      setCachedRegion(cc);
      const config = getRegionConfig(cc);
      setState({ countryCode: cc, ...config, loading: false });
    }

    // Only run if not already resolved from cache
    if (state.loading) detect();

    return () => { cancelled = true; };
  }, [userProfile?.country, userProfile?.phone, userProfile?.phoneNumber]);

  return state;
}

export default useRegionDetection;
