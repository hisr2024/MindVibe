'use client';

import { useState, useEffect, useRef } from 'react';
import { locales, localeNames, type Locale, defaultLocale } from '@/i18n';

const flagEmojis: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  ja: '🇯🇵',
  'zh-CN': '🇨🇳',
};

export function MinimalLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved locale preference
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('preferredLocale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setCurrentLocale(savedLocale);
        updateHtmlLang(savedLocale);
      }
    }
  }, []);

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

  function updateHtmlLang(locale: Locale) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      // No RTL support needed as Arabic is removed
      document.documentElement.dir = 'ltr';
    }
  }

  function switchLocale(newLocale: Locale) {
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', newLocale);
    }

    setCurrentLocale(newLocale);
    updateHtmlLang(newLocale);
    setIsOpen(false);

    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: newLocale } }));
    
    // Reload page to apply new translations
    window.location.reload();
  }

  function handleKeyDown(event: React.KeyboardEvent, locale: Locale) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switchLocale(locale);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Minimalist Globe Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-white/5 text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={localeNames[currentLocale]}
      >
        <span className="text-xl" role="img" aria-label="Language">
          🌐
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-orange-500/30 bg-[#0b0b0f]/98 p-2 shadow-2xl shadow-orange-500/20 backdrop-blur-xl"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-orange-100/70">
            Language
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                onKeyDown={(e) => handleKeyDown(e, locale)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all ${
                  locale === currentLocale
                    ? 'bg-gradient-to-r from-orange-500/20 via-[#ff9933]/20 to-orange-300/20 text-orange-50 ring-1 ring-orange-400/40'
                    : 'text-orange-100/80 hover:bg-white/10 hover:text-orange-50'
                }`}
                role="menuitem"
                tabIndex={0}
                aria-current={locale === currentLocale ? 'true' : undefined}
              >
                <span className="text-xl" role="img" aria-label={localeNames[locale]}>
                  {flagEmojis[locale]}
                </span>
                <span className="flex-1">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <svg className="h-4 w-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="mt-2 border-t border-orange-500/20 px-3 py-2 pt-2 text-xs text-orange-100/60">
            Saved locally
          </div>
        </div>
      )}
    </div>
  );
}
