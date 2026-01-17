'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { locales, localeNames, type Locale, defaultLocale } from '@/i18n';
import { springConfigs } from '@/lib/animations/spring-configs';

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

    // Trigger a custom event that LanguageProvider listens to
    window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: newLocale } }));
    
    // No need to reload - React will handle the re-render
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfigs.smooth}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-white/5 text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
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
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-orange-500/30 bg-[#0b0b0f]/98 p-2 shadow-2xl shadow-orange-500/20 backdrop-blur-xl"
            role="menu"
            aria-orientation="vertical"
          >
          <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-orange-100/70">
            Language
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {locales.map((locale, index) => (
              <motion.button
                key={locale}
                onClick={() => switchLocale(locale)}
                onKeyDown={(e) => handleKeyDown(e, locale)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, ...springConfigs.smooth }}
                whileHover={{ 
                  scale: 1.02,
                  x: 4,
                  transition: { duration: 0.2 } 
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all ${
                  locale === currentLocale
                    ? 'bg-gradient-to-r from-orange-500/20 via-[#ff9933]/20 to-orange-300/20 text-orange-50 ring-1 ring-orange-400/40'
                    : 'text-orange-100/80 hover:bg-white/10 hover:text-orange-50'
                }`}
                role="menuitem"
                tabIndex={0}
                aria-current={locale === currentLocale ? 'true' : undefined}
              >
                <motion.span 
                  className="text-xl" 
                  role="img" 
                  aria-label={localeNames[locale]}
                  whileHover={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  {flagEmojis[locale]}
                </motion.span>
                <span className="flex-1">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <motion.svg 
                    className="h-4 w-4 text-orange-400" 
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
          <div className="mt-2 border-t border-orange-500/20 px-3 py-2 pt-2 text-xs text-orange-100/60">
            Saved locally
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
