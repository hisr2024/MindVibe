'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline'
  className?: string
}

export function LanguageSwitcher({ variant = 'dropdown', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, config, isRTL } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label="Language selector">
        {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              language === lang
                ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-slate-900'
                : 'bg-orange-500/10 text-orange-100/70 hover:bg-orange-500/20 hover:text-orange-50'
            }`}
            aria-pressed={language === lang}
            aria-label={`Select ${LANGUAGES[lang].name}`}
          >
            {LANGUAGES[lang].nativeName}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 transition-all text-sm font-medium text-orange-100"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current language: ${config.name}. Click to change language.`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{config.nativeName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-xl bg-slate-900 border border-orange-500/25 shadow-xl shadow-black/50 overflow-hidden ${
            isRTL ? 'left-0' : 'right-0'
          }`}
          role="listbox"
          aria-label="Select language"
        >
          {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                language === lang
                  ? 'bg-orange-500/20 text-orange-50'
                  : 'text-orange-100/70 hover:bg-orange-500/10 hover:text-orange-50'
              }`}
              role="option"
              aria-selected={language === lang}
            >
              <span className="flex-1 text-left" dir={LANGUAGES[lang].dir}>
                {LANGUAGES[lang].nativeName}
              </span>
              <span className="text-xs text-orange-100/50">{LANGUAGES[lang].name}</span>
              {language === lang && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
