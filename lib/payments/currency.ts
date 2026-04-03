/**
 * Currency detection and multi-currency pricing utilities
 *
 * Auto-detects user locale to set default currency.
 * Supports INR, USD, EUR, GBP with manual override.
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  locale: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
}

/**
 * Detect currency based on device locale / timezone.
 * Indian locales or IST timezone → INR, UK → GBP, EU → EUR, else USD.
 */
export function detectCurrency(): CurrencyCode {
  if (typeof navigator === 'undefined') return 'USD'

  const lang = navigator.language?.toLowerCase() || ''
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''

  if (lang.startsWith('en-in') || lang.startsWith('hi') || lang.startsWith('ta') ||
      lang.startsWith('te') || lang.startsWith('kn') || lang.startsWith('ml') ||
      lang.startsWith('mr') || lang.startsWith('gu') || lang.startsWith('bn') ||
      lang.startsWith('pa') || tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) {
    return 'INR'
  }
  if (lang.startsWith('en-gb') || tz.startsWith('Europe/London')) {
    return 'GBP'
  }
  if (['de', 'fr', 'es', 'it', 'nl', 'pt'].some(l => lang.startsWith(l)) ||
      tz.startsWith('Europe/')) {
    return 'EUR'
  }
  return 'USD'
}

/**
 * Format a price amount for display.
 */
export function formatPrice(amount: number, currency: CurrencyCode): string {
  const config = CURRENCIES[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get the smallest currency unit multiplier (e.g. paise for INR, cents for USD).
 */
export function toSmallestUnit(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * 100)
}
