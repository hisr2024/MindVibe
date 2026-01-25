'use client';

import { useState, useEffect, useRef } from 'react';
import { locales, localeNames, type Locale } from '@/i18n';
import { useLanguage, type Language } from '@/hooks/useLanguage';

const flagEmojis: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  ta: '🇮🇳',
  te: '🇮🇳',
  bn: '🇮🇳',
  mr: '🇮🇳',
  gu: '🇮🇳',
  kn: '🇮🇳',
  ml: '🇮🇳',
  pa: '🇮🇳',
  sa: '🇮🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  ja: '🇯🇵',
  'zh-CN': '🇨🇳',
};

export function LanguageSwitcher() {
  // Use the global LanguageProvider context - single source of truth
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map Language type to Locale for display
  const currentLocale = language as Locale;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function switchLocale(newLocale: Locale) {
    // Use the context's setLanguage which handles:
    // - Updating state
    // - Persisting to localStorage
    // - Updating document.lang/dir
    // - Loading translations
    // No page reload needed - React handles re-render
    setLanguage(newLocale as Language);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent, locale: Locale) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switchLocale(locale);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-white/5 px-3 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg" role="img" aria-label={localeNames[currentLocale]}>
          {flagEmojis[currentLocale]}
        </span>
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-orange-500/30 bg-[#0b0b0f]/95 p-2 shadow-2xl shadow-orange-500/20 backdrop-blur-xl"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-orange-100/70">
            Select Language
          </div>
          <div className="space-y-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                onKeyDown={(e) => handleKeyDown(e, locale)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  locale === currentLocale
                    ? 'bg-gradient-to-r from-orange-500/20 via-[#ff9933]/20 to-orange-300/20 text-orange-50 ring-1 ring-orange-400/40'
                    : 'text-orange-100/80 hover:bg-white/10 hover:text-orange-50'
                }`}
                role="menuitem"
                tabIndex={0}
                aria-current={locale === currentLocale ? 'true' : undefined}
              >
                <span className="text-2xl" role="img" aria-label={localeNames[locale]}>
                  {flagEmojis[locale]}
                </span>
                <span className="flex-1">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-orange-500/20 pt-2 px-3 py-2 text-xs text-orange-100/60">
            Your selection is saved locally
          </div>
        </div>
      )}
    </div>
  );
}

