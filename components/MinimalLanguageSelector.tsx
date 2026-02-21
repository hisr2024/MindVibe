'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { locales, localeNames, type Locale } from '@/i18n';
import { springConfigs } from '@/lib/animations/spring-configs';
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';

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

export function MinimalLanguageSelector() {
  // Use the global LanguageProvider context - single source of truth
  const { language, setLanguage, config } = useLanguage();
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
      {/* Minimalist Globe Icon Button - touch-friendly size */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfigs.smooth}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/30 bg-slate-900/80 text-orange-50 shadow-lg shadow-black/20 backdrop-blur-lg transition-all hover:border-orange-400/50 hover:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95 md:h-10 md:w-10 md:rounded-full md:bg-white/5 md:shadow-none"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={localeNames[currentLocale]}
      >
        <motion.span
          className="text-xl"
          role="img"
          aria-label="Language"
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={springConfigs.smooth}
        >
          🌐
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springConfigs.smooth}
            className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-2xl border border-orange-500/30 bg-slate-950 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:w-56"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-orange-100/70">
              Language
            </div>
            <div className="max-h-[60vh] space-y-0.5 overflow-y-auto overscroll-contain md:max-h-80">
              {locales.map((locale, index) => (
                <motion.button
                  key={locale}
                  onClick={() => switchLocale(locale)}
                  onKeyDown={(e) => handleKeyDown(e, locale)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, ...springConfigs.smooth }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] md:min-h-[40px] md:py-2 ${
                    locale === currentLocale
                      ? 'bg-gradient-to-r from-orange-500/20 via-[#ff9933]/20 to-orange-300/20 text-orange-50 ring-1 ring-orange-400/40'
                      : 'text-orange-100/80 hover:bg-white/10 hover:text-orange-50 active:bg-white/15'
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
                    <motion.svg
                      className="h-5 w-5 text-orange-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springConfigs.bouncy}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="mt-2 border-t border-orange-500/20 px-3 py-2 text-xs text-orange-100/60">
              Saved locally
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
