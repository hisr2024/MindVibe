'use client'

import { useState, useEffect, useCallback } from 'react'

export type Currency = 'USD' | 'EUR' | 'INR'

export interface CurrencyConfig {
  symbol: string
  code: Currency
  name: string
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
}

// Pricing in each currency (as per requirements)
export const PRICING: Record<string, Record<Currency, number>> = {
  free: { USD: 0, EUR: 0, INR: 0 },
  pro: { USD: 5, EUR: 4.60, INR: 420 },
  premium: { USD: 10, EUR: 9.20, INR: 830 },
  executive: { USD: 15, EUR: 13.80, INR: 1250 },
}

// Yearly discount (15%)
export const YEARLY_DISCOUNT = 0.15

const STORAGE_KEY = 'mindvibe_currency'

function detectCurrencyFromLocale(): Currency {
  if (typeof window === 'undefined') return 'USD'
  
  const locale = navigator.language || ''
  
  // European locales
  if (
    locale.startsWith('de') ||
    locale.startsWith('fr') ||
    locale.startsWith('es') ||
    locale.startsWith('it') ||
    locale.startsWith('nl') ||
    locale.startsWith('pt')
  ) {
    return 'EUR'
  }
  
  // Indian locales
  if (locale.startsWith('hi') || locale === 'en-IN') {
    return 'INR'
  }
  
  return 'USD'
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize currency from localStorage or auto-detect
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null
    if (stored && CURRENCIES[stored]) {
      setCurrencyState(stored)
    } else {
      const detected = detectCurrencyFromLocale()
      setCurrencyState(detected)
      localStorage.setItem(STORAGE_KEY, detected)
    }
    setIsInitialized(true)
  }, [])

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newCurrency)
    }
  }, [])

  const formatPrice = useCallback(
    (amount: number, options?: { showDecimals?: boolean }): string => {
      const config = CURRENCIES[currency]
      const showDecimals = options?.showDecimals ?? (currency !== 'INR')
      
      if (currency === 'INR') {
        // Format Indian Rupees without decimals
        return `${config.symbol}${Math.round(amount).toLocaleString('en-IN')}`
      }
      
      return `${config.symbol}${showDecimals ? amount.toFixed(2) : Math.round(amount)}`
    },
    [currency]
  )

  const getMonthlyPrice = useCallback(
    (tierId: string): number => {
      return PRICING[tierId]?.[currency] ?? 0
    },
    [currency]
  )

  const getYearlyPrice = useCallback(
    (tierId: string): number => {
      const monthly = getMonthlyPrice(tierId)
      // Yearly = 12 months with 15% discount
      return monthly * 12 * (1 - YEARLY_DISCOUNT)
    },
    [getMonthlyPrice]
  )

  return {
    currency,
    setCurrency,
    formatPrice,
    getMonthlyPrice,
    getYearlyPrice,
    config: CURRENCIES[currency],
    isInitialized,
  }
}

export default useCurrency
