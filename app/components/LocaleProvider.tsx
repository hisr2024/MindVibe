'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { messages, supportedLocales, type SupportedLocale } from '../../lib/i18n/messages'

type I18nContextShape = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextShape | null>(null)

function getCookieLocale() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )mv-locale=([^;]+)/)
  return match?.[1] ?? null
}

export function LocaleProvider({
  initialLocale = 'en',
  children,
}: {
  initialLocale?: SupportedLocale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale)

  useEffect(() => {
    const saved = getCookieLocale()
    if (saved && supportedLocales.includes(saved as SupportedLocale)) {
      setLocaleState(saved as SupportedLocale)
    }
  }, [])

  function setLocale(next: SupportedLocale) {
    setLocaleState(next)
    if (typeof document !== 'undefined') {
      document.cookie = `mv-locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
      window.location.reload()
    }
  }

  const value = useMemo<I18nContextShape>(
    () => ({
      locale,
      setLocale,
      t: key => messages[locale]?.[key] ?? messages.en[key] ?? key,
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}
