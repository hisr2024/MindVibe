'use client';

/**
 * Global Language Selector Component for Navigation
 *
 * A compact language selector for the main navigation bar.
 * Supports all 17 languages with search functionality.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';

interface GlobalLanguageSelectorProps {
  className?: string;
}

export function GlobalLanguageSelector({ className = '' }: GlobalLanguageSelectorProps) {
  const { language, setLanguage, config } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter languages based on search
  const filteredLanguages = Object.entries(LANGUAGES).filter(([code, langConfig]) => {
    if (!searchQuery) return true;
    return (
      langConfig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      langConfig.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button - Sleek, solid presence with gold accent */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-[#d4a44c]/50 bg-[#d4a44c]/20 px-3 py-2 text-sm font-medium text-[#f5f0e8] shadow-sm shadow-[#d4a44c]/8 transition-all hover:bg-[#d4a44c]/30 hover:border-[#d4a44c]/65 hover:shadow-md hover:shadow-[#d4a44c]/12 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d4a44c] focus:ring-offset-2 focus:ring-offset-slate-900"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Current language: ${config.name}. Click to change language.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Globe icon - solid gold, no transparency */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#e8b54a] drop-shadow-[0_0_3px_rgba(212,164,76,0.4)]"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M2 12h20"></path>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span className="hidden sm:inline">{config.nativeName}</span>
        <span className="sm:hidden uppercase text-xs font-bold">{language}</span>
        {/* Chevron */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/70"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-slate-950 backdrop-blur-xl shadow-2xl shadow-black/50"
            role="listbox"
            aria-label="Select language"
          >
            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-r from-[#d4a44c]/10 to-purple-500/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white/90">Select Language</h3>
              <p className="text-xs text-white/50 mt-0.5">Choose your preferred language</p>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d4a44c]/50 focus:ring-1 focus:ring-[#d4a44c]/30 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(([code, langConfig]) => {
                  const isSelected = language === code;
                  return (
                    <motion.button
                      key={code}
                      onClick={() => handleLanguageSelect(code as Language)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'bg-[#d4a44c]/20 text-[#f5f0e8]'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                      whileHover={{ x: 2 }}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{langConfig.nativeName}</span>
                        <span className={`text-xs ${isSelected ? 'text-[#e8b54a]/70' : 'text-white/40'}`}>
                          {langConfig.name}
                        </span>
                      </span>
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[#d4a44c]"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </motion.svg>
                      )}
                    </motion.button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-white/50 text-sm">No languages found</p>
                  <p className="text-white/30 text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 bg-white/[0.02] px-4 py-2">
              <p className="text-xs text-white/40 text-center">
                {Object.keys(LANGUAGES).length} languages available
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GlobalLanguageSelector;
