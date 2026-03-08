/**
 * TranslationStatus — Dev-mode indicator for missing translations.
 *
 * In development, renders a small floating badge showing the count of
 * missing translation keys on the current page. Clicking it logs the
 * missing keys to the console for easy debugging.
 *
 * Hidden in production builds.
 *
 * Usage: Mount once in your root layout:
 *   {process.env.NODE_ENV === 'development' && <TranslationStatus />}
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

/** Track missing translations reported by next-intl's onError. */
const missingKeys = new Set<string>()

/**
 * Call this from your next-intl onError handler to register missing keys.
 * Example in i18n.ts:
 *   onError(error) { reportMissingTranslation(error.message) }
 */
export function reportMissingTranslation(key: string): void {
  missingKeys.add(key)
  window.dispatchEvent(new CustomEvent('i18n-missing-key', { detail: key }))
}

export function TranslationStatus() {
  const { language } = useLanguage()
  const [count, setCount] = useState(0)
  const [expanded, setExpanded] = useState(false)

  // Listen for new missing keys
  useEffect(() => {
    const handler = () => setCount(missingKeys.size)
    window.addEventListener('i18n-missing-key', handler)
    return () => window.removeEventListener('i18n-missing-key', handler)
  }, [])

  // Reset missing keys when language changes
  const prevLanguage = useRef(language)
  useEffect(() => {
    if (prevLanguage.current !== language) {
      prevLanguage.current = language
      missingKeys.clear()
    }
  }, [language])

  const logMissingKeys = useCallback(() => {
    if (missingKeys.size > 0) {
      console.warn(`Missing translations for locale "${language}" (${missingKeys.size}):`)
      for (const key of missingKeys) {
        console.warn(`  - ${key}`)
      }
    }
    setExpanded((prev) => !prev)
  }, [language])

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null
  if (count === 0) return null

  return (
    <button
      onClick={logMissingKeys}
      className="
        fixed bottom-4 left-4 z-[9999]
        flex items-center gap-2
        rounded-full px-3 py-1.5
        bg-amber-500/90 text-black text-xs font-bold
        shadow-lg cursor-pointer
        hover:bg-amber-400 transition-colors
      "
      title="Click to log missing translation keys to console"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      {count} missing key{count !== 1 ? 's' : ''}
      {expanded && (
        <span className="text-[10px] opacity-75 ml-1">(see console)</span>
      )}
    </button>
  )
}

export default TranslationStatus
