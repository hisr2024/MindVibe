'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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

export const BASE_PRICES_USD: Record<string, number> = {
  free: 0,
  basic: 2.49,
  premium: 10,
  enterprise: 15,
}

// Conversion + discount rules
const EUR_RATE = 0.92
const INR_RATE = 83
const INR_DISCOUNT = 0.2 // 20% cheaper than USD/EUR equivalent

// Yearly discount (15%)
export const YEARLY_DISCOUNT = 0.15

const STORAGE_KEY = 'mindvibe_currency'

function detectCurrencyFromLocale(): Currency {
  if (typeof window === 'undefined') return 'USD'

  const locale = navigator.language || ''

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

  if (locale.startsWith('hi') || locale === 'en-IN') {
    return 'INR'
  }

  return 'USD'
}

const roundForCurrency = (currency: Currency, amount: number) => {
  if (currency === 'INR') {
    // Round to the nearest 10 rupees for simplicity
    return Math.round(amount / 10) * 10
  }

  return Number(amount.toFixed(2))
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [isInitialized, setIsInitialized] = useState(false)

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

  const convertFromUsd = useCallback(
    (usdAmount: number) => {
      if (currency === 'EUR') {
        return usdAmount * EUR_RATE
      }

      if (currency === 'INR') {
        return usdAmount * INR_RATE * (1 - INR_DISCOUNT)
      }

      return usdAmount
    },
    [currency]
  )

  const getMonthlyPrice = useCallback(
    (tierId: string): number => {
      const usdPrice = BASE_PRICES_USD[tierId] ?? 0
      const converted = convertFromUsd(usdPrice)
      return roundForCurrency(currency, converted)
    },
    [convertFromUsd, currency]
  )

  const getYearlyPrice = useCallback(
    (tierId: string): number => {
      const usdPrice = BASE_PRICES_USD[tierId] ?? 0
      const converted = convertFromUsd(usdPrice)
      const yearly = converted * 12 * (1 - YEARLY_DISCOUNT)
      return roundForCurrency(currency, yearly)
    },
    [convertFromUsd, currency]
  )

  const formatPrice = useCallback(
    (amount: number, options?: { showDecimals?: boolean }): string => {
      const config = CURRENCIES[currency]
      const showDecimals = options?.showDecimals ?? currency !== 'INR'

      if (currency === 'INR') {
        const rounded = roundForCurrency(currency, amount)
        return `${config.symbol}${rounded.toLocaleString('en-IN')}`
      }

      const rounded = roundForCurrency(currency, amount)
      const formatted = showDecimals ? rounded.toFixed(2) : Math.round(rounded).toString()
      return `${config.symbol}${formatted}`
    },
    [currency]
  )

  const priceTable = useMemo(() => {
    const entries = Object.keys(BASE_PRICES_USD).reduce<Record<string, number>>((acc, tierId) => {
      acc[tierId] = getMonthlyPrice(tierId)
      return acc
    }, {})
    return entries
  }, [getMonthlyPrice])

  return {
    currency,
    setCurrency,
    formatPrice,
    getMonthlyPrice,
    getYearlyPrice,
    config: CURRENCIES[currency],
    isInitialized,
    priceTable,
  }
}

export default useCurrency
