/**
 * RTLProvider — Wraps children with correct text direction based on locale.
 *
 * Automatically sets `dir="rtl"` or `dir="ltr"` on a container element
 * based on the user's current language. Also applies CSS logical property
 * overrides for RTL-safe layouts.
 *
 * Usage:
 *   <RTLProvider>
 *     <App />
 *   </RTLProvider>
 */

'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

/* ------------------------------------------------------------------ */
/*  RTL locale detection                                               */
/* ------------------------------------------------------------------ */

/** Locales that use right-to-left script direction. */
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur'])

export type TextDirection = 'ltr' | 'rtl'

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface RTLContextValue {
  /** Current text direction based on active locale */
  direction: TextDirection
  /** Whether the current locale is RTL */
  isRTL: boolean
}

const RTLContext = createContext<RTLContextValue>({
  direction: 'ltr',
  isRTL: false,
})

/** Hook to access RTL state in child components. */
export function useRTL(): RTLContextValue {
  return useContext(RTLContext)
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

interface RTLProviderProps {
  children: ReactNode
  /** Force a specific direction (overrides locale detection) */
  forceDirection?: TextDirection
}

export function RTLProvider({ children, forceDirection }: RTLProviderProps) {
  const { language } = useLanguage()

  const value = useMemo<RTLContextValue>(() => {
    if (forceDirection) {
      return { direction: forceDirection, isRTL: forceDirection === 'rtl' }
    }

    const locale = (language as string).split('-')[0].toLowerCase()
    const isRTL = RTL_LOCALES.has(locale)
    return { direction: isRTL ? 'rtl' : 'ltr', isRTL }
  }, [language, forceDirection])

  return (
    <RTLContext.Provider value={value}>
      <div dir={value.direction} className={value.isRTL ? 'rtl-layout' : ''}>
        {children}
      </div>
    </RTLContext.Provider>
  )
}

export default RTLProvider
