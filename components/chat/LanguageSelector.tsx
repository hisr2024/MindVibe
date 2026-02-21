/**
 * Language Selector Component for KIAAN Chat
 * 
 * Allows users to select their preferred language for responses
 * with visual feedback and language detection hints.
 */

'use client';

import { useState, useEffect } from 'react';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { localeNames } from '@/i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({
  onLanguageChange,
  className = '',
  compact = false
}: LanguageSelectorProps) {
  const { language, setLanguage, config } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter languages based on search
  const filteredLanguages = Object.entries(localeNames).filter(([code, name]) => {
    if (!searchQuery) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as Language);
    onLanguageChange?.(langCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  if (compact) {
    return (
      <div className={`relative language-selector-dropdown ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
          aria-label="Select language"
          title="Select language for responses"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20"></path>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span className="uppercase text-xs font-bold">{language}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-96 overflow-hidden rounded-xl border border-orange-500/30 bg-slate-950 backdrop-blur-sm shadow-xl shadow-orange-500/20">
            {/* Search input */}
            <div className="p-3 border-b border-orange-500/20">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full rounded-lg border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/50 placeholder:text-orange-100/40"
                autoFocus
              />
            </div>

            {/* Language list */}
            <div className="max-h-72 overflow-y-auto">
              {filteredLanguages.map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageSelect(code)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    language === code
                      ? 'bg-orange-500/20 text-orange-50 font-semibold'
                      : 'text-orange-100/80 hover:bg-orange-500/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">{name}</span>
                  </span>
                  {language === code && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
              {filteredLanguages.length === 0 && (
                <div className="px-4 py-6 text-center text-orange-100/60 text-sm">
                  No languages found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className={`language-selector-dropdown ${className}`}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-orange-100/80">
          Response Language
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-50 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
            aria-label="Select language"
          >
            <span className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{config.name}</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-orange-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 w-full max-h-96 overflow-hidden rounded-xl border border-orange-500/30 bg-slate-950 backdrop-blur-sm shadow-xl shadow-orange-500/20">
              {/* Search input */}
              <div className="p-3 border-b border-orange-500/20">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full rounded-lg border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/50 placeholder:text-orange-100/40"
                  autoFocus
                />
              </div>

              {/* Language list */}
              <div className="max-h-72 overflow-y-auto">
                {filteredLanguages.map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageSelect(code)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      language === code
                        ? 'bg-orange-500/20 text-orange-50 font-semibold'
                        : 'text-orange-100/80 hover:bg-orange-500/10'
                    }`}
                  >
                    <span className="text-base">{name}</span>
                    {language === code && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="px-4 py-6 text-center text-orange-100/60 text-sm">
                    No languages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Helper text */}
        <p className="text-xs text-orange-100/60">
          KIAAN will respond in {config.name}. You can type in any language.
        </p>
      </div>
    </div>
  );
}

export default LanguageSelector;
