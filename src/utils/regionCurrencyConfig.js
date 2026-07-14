/**
 * regionCurrencyConfig.js
 *
 * Central config for:
 *  - Country code → currency + payment methods
 *  - Phone prefix  → country code (for useRegionDetection)
 *  - Browser locale → country code
 *  - Price formatting helpers
 */

// ─── Region definitions ────────────────────────────────────────────────────────

/**
 * Each region entry:
 *   currency         ISO currency code sent to backend (Stripe uses lowercase)
 *   currencySymbol   Display symbol
 *   currencyName     Human-readable
 *   locale           For Intl.NumberFormat
 *   displayRate      Approximate multiplier vs USD (for display-only conversion)
 *                    The actual charge on Stripe is always in the hotel's listed currency
 *   paymentMethods   Ordered list of payment instruments to show
 *     id, label, icon, description, stripeType (Stripe payment_method_type)
 */
export const REGION_CONFIG = {
  IN: {
    currency: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee',
    locale: 'en-IN',
    displayRate: 83.5,           // ~83.5 INR per USD (display only)
    region: 'IN',
    paymentMethods: [
      {
        id: 'upi',
        label: 'UPI',
        icon: '📲',
        description: 'Pay instantly via UPI (Google Pay, PhonePe, Paytm)',
        stripeType: 'upi',
        note: 'Redirects to your UPI app',
      },
      {
        id: 'netbanking',
        label: 'Net Banking',
        icon: '🏦',
        description: 'Pay directly from your bank account',
        stripeType: 'netbanking',
        note: 'All major Indian banks supported',
      },
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, RuPay',
        stripeType: 'card',
        note: '3D Secure verified',
      },
    ],
  },

  US: {
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
    locale: 'en-US',
    displayRate: 1,
    region: 'US',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex, Discover',
        stripeType: 'card',
        note: 'Secure encrypted payment',
      },
    ],
  },

  GB: {
    currency: 'GBP',
    currencySymbol: '£',
    currencyName: 'British Pound',
    locale: 'en-GB',
    displayRate: 0.79,
    region: 'GB',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: '3D Secure verified',
      },
    ],
  },

  AE: {
    currency: 'AED',
    currencySymbol: 'AED',
    currencyName: 'UAE Dirham',
    locale: 'ar-AE',
    displayRate: 3.67,
    region: 'AE',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: 'Secure payment',
      },
    ],
  },

  SG: {
    currency: 'SGD',
    currencySymbol: 'S$',
    currencyName: 'Singapore Dollar',
    locale: 'en-SG',
    displayRate: 1.35,
    region: 'SG',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: 'Secure encrypted payment',
      },
    ],
  },

  AU: {
    currency: 'AUD',
    currencySymbol: 'A$',
    currencyName: 'Australian Dollar',
    locale: 'en-AU',
    displayRate: 1.53,
    region: 'AU',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: 'Secure encrypted payment',
      },
    ],
  },

  // EU catch-all
  EU: {
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
    locale: 'de-DE',
    displayRate: 0.92,
    region: 'EU',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: 'Secure payment',
      },
    ],
  },

  DEFAULT: {
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
    locale: 'en-US',
    displayRate: 1,
    region: 'DEFAULT',
    paymentMethods: [
      {
        id: 'card',
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, Amex',
        stripeType: 'card',
        note: 'Secure encrypted payment',
      },
    ],
  },
};

// EU country codes
const EU_COUNTRIES = new Set([
  'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'SE', 'NO', 'DK', 'FI',
  'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'LU',
  'MT', 'CY', 'IE', 'GR', 'CH',
]);

/**
 * Given an ISO country code, return the full region config.
 */
export function getRegionConfig(countryCode) {
  const cc = (countryCode || '').toUpperCase();
  if (REGION_CONFIG[cc]) return REGION_CONFIG[cc];
  if (EU_COUNTRIES.has(cc)) return REGION_CONFIG['EU'];
  return REGION_CONFIG['DEFAULT'];
}

// ─── Phone prefix → country code ──────────────────────────────────────────────
// Ordered longest-first in useRegionDetection to avoid +1 matching +1-xxx

export const PHONE_PREFIX_MAP = {
  '+91':   'IN',   // India
  '+1':    'US',   // USA / Canada
  '+44':   'GB',   // UK
  '+971':  'AE',   // UAE
  '+65':   'SG',   // Singapore
  '+61':   'AU',   // Australia
  '+49':   'DE',   // Germany
  '+33':   'FR',   // France
  '+39':   'IT',   // Italy
  '+34':   'ES',   // Spain
  '+81':   'JP',   // Japan
  '+82':   'KR',   // South Korea
  '+86':   'CN',   // China
  '+55':   'BR',   // Brazil
  '+52':   'MX',   // Mexico
  '+7':    'RU',   // Russia
  '+92':   'PK',   // Pakistan
  '+880':  'BD',   // Bangladesh
  '+94':   'LK',   // Sri Lanka
  '+977':  'NP',   // Nepal
  '+66':   'TH',   // Thailand
  '+60':   'MY',   // Malaysia
  '+62':   'ID',   // Indonesia
  '+63':   'PH',   // Philippines
  '+64':   'NZ',   // New Zealand
  '+27':   'ZA',   // South Africa
  '+234':  'NG',   // Nigeria
  '+254':  'KE',   // Kenya
  '+20':   'EG',   // Egypt
  '+212':  'MA',   // Morocco
};

// ─── Browser locale → country code ────────────────────────────────────────────

export const LOCALE_MAP = {
  IN: 'IN',
  US: 'US',
  GB: 'GB',
  AE: 'AE',
  SG: 'SG',
  AU: 'AU',
  DE: 'DE',
  FR: 'FR',
  IT: 'IT',
  ES: 'ES',
  PT: 'PT',
  NL: 'NL',
  JP: 'JP',
  KR: 'KR',
  CN: 'CN',
  PK: 'PK',
  BD: 'BD',
  LK: 'LK',
  NP: 'NP',
  TH: 'TH',
  MY: 'MY',
  ID: 'ID',
  PH: 'PH',
  NZ: 'NZ',
  ZA: 'ZA',
  NG: 'NG',
  KE: 'KE',
  EG: 'EG',
  CA: 'US',   // Canada → treat as USD for simplicity
};

// ─── Price formatting helpers ─────────────────────────────────────────────────

/**
 * Format a USD amount for display in the user's detected currency.
 * NOTE: This is display-only. Stripe always charges in the listed currency (USD).
 *
 * @param {number} amountUsd   Amount in USD dollars (not cents)
 * @param {object} regionCfg   Object from getRegionConfig()
 * @param {boolean} converted  If true, multiply by displayRate and show local currency
 */
export function formatPrice(amountUsd, regionCfg, converted = false) {
  if (amountUsd == null || !regionCfg) return '—';
  const { currency, currencySymbol, locale, displayRate } = regionCfg;

  if (!converted) {
    // Always show USD if we're not converting (billing currency stays USD)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountUsd);
  }

  const localAmount = amountUsd * (displayRate || 1);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'INR' ? 0 : 2,
    }).format(localAmount);
  } catch {
    return `${currencySymbol}${localAmount.toFixed(0)}`;
  }
}

/**
 * Format a raw currency amount (cents or dollars) with the given currency config.
 * Used for displaying owner balance, payout amounts, etc.
 *
 * @param {number} amount      Amount (dollars, not cents)
 * @param {string} currency    ISO currency code e.g. 'USD', 'INR'
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  try {
    const locale = currency === 'INR' ? 'en-IN'
                 : currency === 'GBP' ? 'en-GB'
                 : currency === 'EUR' ? 'de-DE'
                 : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
