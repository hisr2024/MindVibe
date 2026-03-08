/**
 * useLocaleFormat — Hook for locale-aware date, number, and currency formatting.
 *
 * Uses the browser's Intl API (zero bundle cost, CLDR-accurate).
 * Automatically updates when the user changes language via useLanguage().
 *
 * Usage:
 *   const { formatDate, formatNumber, formatCurrency, formatRelative } = useLocaleFormat()
 *   formatDate(new Date())           // "8 Mar 2026" (en) or "8 मार्च 2026" (hi)
 *   formatNumber(12345.67)           // "12,345.67" (en) or "12.345,67" (de)
 *   formatCurrency(799, 'INR')       // "₹799.00" (en) or "₹799.00" (hi)
 *   formatRelative(-1, 'day')        // "yesterday" (en) or "कल" (hi)
 */

import { useMemo } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

/* ------------------------------------------------------------------ */
/*  Locale mapping                                                     */
/* ------------------------------------------------------------------ */

/**
 * Map our internal locale codes to BCP 47 tags that the Intl API expects.
 * Most are identical, but some need adjustment.
 */
const INTL_LOCALE_MAP: Record<string, string> = {
  'zh-CN': 'zh-Hans-CN',
  'sa': 'sa-Deva',       // Sanskrit in Devanagari script
}

function toIntlLocale(locale: string): string {
  return INTL_LOCALE_MAP[locale] ?? locale
}

/* ------------------------------------------------------------------ */
/*  Currency defaults per locale                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_CURRENCY: Record<string, string> = {
  en: 'USD',
  hi: 'INR', ta: 'INR', te: 'INR', bn: 'INR', mr: 'INR',
  gu: 'INR', kn: 'INR', ml: 'INR', pa: 'INR', sa: 'INR',
  es: 'EUR', fr: 'EUR', de: 'EUR', pt: 'BRL',
  ja: 'JPY', 'zh-CN': 'CNY',
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export interface LocaleFormatters {
  /** Format a date. Defaults to medium style (e.g., "Mar 8, 2026"). */
  formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => string

  /** Format a number with locale-appropriate grouping and decimals. */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string

  /** Format a currency value. Uses locale's default currency if not specified. */
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string

  /** Format a relative time (e.g., "2 days ago", "in 3 hours"). */
  formatRelative: (value: number, unit: Intl.RelativeTimeFormatUnit) => string

  /** Format a list (e.g., "A, B, and C"). */
  formatList: (items: string[], options?: Intl.ListFormatOptions) => string

  /** The resolved Intl locale tag (BCP 47). */
  intlLocale: string

  /** The app's internal locale code (e.g., "hi", "zh-CN"). */
  locale: string
}

export function useLocaleFormat(): LocaleFormatters {
  const { language } = useLanguage()
  const locale = language as string
  const intlLocale = toIntlLocale(locale)

  const formatters = useMemo(() => {
    // Pre-create commonly used formatters for performance
    const dateFormatter = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium' })
    const numberFormatter = new Intl.NumberFormat(intlLocale)
    const relativeFormatter = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' })

    const defaultCurrency = DEFAULT_CURRENCY[locale] ?? 'USD'

    return {
      formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
        if (options) {
          return new Intl.DateTimeFormat(intlLocale, options).format(date)
        }
        return dateFormatter.format(date)
      },

      formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
        if (options) {
          return new Intl.NumberFormat(intlLocale, options).format(value)
        }
        return numberFormatter.format(value)
      },

      formatCurrency(
        value: number,
        currency?: string,
        options?: Intl.NumberFormatOptions,
      ): string {
        return new Intl.NumberFormat(intlLocale, {
          style: 'currency',
          currency: currency ?? defaultCurrency,
          ...options,
        }).format(value)
      },

      formatRelative(value: number, unit: Intl.RelativeTimeFormatUnit): string {
        return relativeFormatter.format(value, unit)
      },

      formatList(items: string[], options?: Intl.ListFormatOptions): string {
        return new Intl.ListFormat(intlLocale, {
          style: 'long',
          type: 'conjunction',
          ...options,
        }).format(items)
      },

      intlLocale,
      locale,
    }
  }, [intlLocale, locale])

  return formatters
}

export default useLocaleFormat
