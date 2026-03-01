'use client'

/**
 * Unified Language Selector Component
 *
 * Renders a compact dropdown on desktop/tablet (>= 768 px) and a
 * full-width bottom sheet on mobile (< 768 px). Consumes the global
 * LanguageProvider context — no additional state management introduced.
 *
 * Replaces: GlobalLanguageSelector, MinimalLanguageSelector (for nav use).
 * Does NOT replace: components/chat/LanguageSelector (KIAAN-specific).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage'
import { getLanguagesByRegion } from '@/config/translation'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useUISound } from '@/hooks/useUISound'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LanguageSelectorProps {
  /** Additional CSS classes for the outer wrapper */
  className?: string
  /** Force a specific variant regardless of viewport */
  variant?: 'dropdown' | 'sheet'
  /** Render only the trigger button (for embedding in menus) */
  triggerOnly?: boolean
  /** Callback after language is changed */
  onLanguageChange?: (language: Language) => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Breakpoint below which the bottom-sheet variant is used by default */
const MOBILE_BREAKPOINT = 768

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (avoids extra dependencies)                       */
/* ------------------------------------------------------------------ */

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
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
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function SearchIcon() {
  return (
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
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
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
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </motion.svg>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
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
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared language row used by both dropdown and sheet                 */
/* ------------------------------------------------------------------ */

interface LanguageRowProps {
  code: string
  nativeName: string
  name: string
  isSelected: boolean
  onSelect: () => void
  /** min-height class (48 px dropdown, 52 px sheet) */
  heightClass: string
}

function LanguageRow({ code, nativeName, name, isSelected, onSelect, heightClass }: LanguageRowProps) {
  return (
    <button
      key={code}
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${heightClass} ${
        isSelected
          ? 'bg-[#d4a44c]/20 text-[#f5f0e8]'
          : 'text-white/80 hover:bg-white/5'
      }`}
      role="option"
      aria-selected={isSelected}
    >
      <span className="flex flex-col min-w-0">
        <span className="font-medium truncate">{nativeName}</span>
        <span className={`text-xs truncate ${isSelected ? 'text-[#e8b54a]/70' : 'text-white/40'}`}>
          {name}
        </span>
      </span>
      {isSelected && <CheckIcon className="text-[#d4a44c] flex-shrink-0 ml-2" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  useIsMobile hook (self-contained, no external dep needed)          */
/* ------------------------------------------------------------------ */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // SSR-safe: default to false, then correct on mount
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function LanguageSelector({
  className = '',
  variant,
  triggerOnly = false,
  onLanguageChange,
}: LanguageSelectorProps) {
  const { language, setLanguage, config } = useLanguage()
  const isMobile = useIsMobile()
  const resolvedVariant = variant ?? (isMobile ? 'sheet' : 'dropdown')

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { triggerHaptic } = useHapticFeedback()
  const { playSound } = useUISound()

  /* ---- Filtered language entries ---- */
  const allEntries = useMemo(() => Object.entries(LANGUAGES), [])

  const filtered = useMemo(() => {
    if (!search) return allEntries
    const q = search.toLowerCase()
    return allEntries.filter(([code, cfg]) =>
      cfg.name.toLowerCase().includes(q) ||
      cfg.nativeName.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q),
    )
  }, [allEntries, search])

  /* ---- Grouped language entries for the sheet ---- */
  const grouped = useMemo(() => getLanguagesByRegion(), [])

  /* ---- Select handler ---- */
  const select = useCallback(
    (code: Language) => {
      setLanguage(code)
      setIsOpen(false)
      setSearch('')
      triggerHaptic('selection')
      playSound('select')
      onLanguageChange?.(code)
      // Return focus to trigger after close
      setTimeout(() => triggerRef.current?.focus(), 100)
    },
    [setLanguage, onLanguageChange, triggerHaptic, playSound],
  )

  /* ---- Open/close helpers ---- */
  const open = useCallback(() => {
    setIsOpen(true)
    triggerHaptic('light')
    playSound('open')
  }, [triggerHaptic, playSound])

  const close = useCallback(() => {
    setIsOpen(false)
    setSearch('')
    playSound('close')
  }, [playSound])

  /* ---- Close dropdown on outside click ---- */
  useEffect(() => {
    if (!isOpen || resolvedVariant !== 'dropdown') return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, resolvedVariant, close])

  /* ---- Close on Escape (dropdown only; sheet handles its own) ---- */
  useEffect(() => {
    if (!isOpen || resolvedVariant !== 'dropdown') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, resolvedVariant, close])

  /* ---- Auto-focus search when dropdown opens ---- */
  useEffect(() => {
    if (isOpen && resolvedVariant === 'dropdown') {
      // Small delay to let AnimatePresence render the content
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, resolvedVariant])

  /* ================================================================ */
  /*  Trigger button                                                   */
  /* ================================================================ */

  const trigger = (
    <motion.button
      ref={triggerRef}
      onClick={() => (isOpen ? close() : open())}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-2 rounded-full border border-[#d4a44c]/50 bg-[#d4a44c]/20 px-3 py-2 text-sm font-medium text-[#f5f0e8] shadow-sm shadow-[#d4a44c]/8 transition-all hover:bg-[#d4a44c]/30 hover:border-[#d4a44c]/65 hover:shadow-md hover:shadow-[#d4a44c]/12 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${className}`}
      aria-label={`Current language: ${config.nativeName}. Click to change language.`}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <GlobeIcon className="text-[#e8b54a] drop-shadow-[0_0_3px_rgba(212,164,76,0.4)]" />
      {/* Desktop: show native name; small screens: 2-letter code */}
      <span className="hidden sm:inline">{config.nativeName}</span>
      <span className="sm:hidden uppercase text-xs font-bold">{language}</span>
      <ChevronIcon isOpen={isOpen} />
    </motion.button>
  )

  if (triggerOnly) return trigger

  /* ================================================================ */
  /*  Dropdown variant (desktop / tablet)                              */
  /* ================================================================ */

  if (resolvedVariant === 'dropdown') {
    return (
      <div ref={dropdownRef} className="relative">
        {trigger}

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

              {/* Search */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <SearchIcon />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d4a44c]/50 focus:ring-1 focus:ring-[#d4a44c]/30 transition-all"
                    role="searchbox"
                    aria-label="Search languages"
                  />
                </div>
              </div>

              {/* Language list */}
              <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {filtered.length > 0 ? (
                  filtered.map(([code, cfg]) => (
                    <LanguageRow
                      key={code}
                      code={code}
                      nativeName={cfg.nativeName}
                      name={cfg.name}
                      isSelected={language === code}
                      onSelect={() => select(code as Language)}
                      heightClass="min-h-[48px]"
                    />
                  ))
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
    )
  }

  /* ================================================================ */
  /*  Bottom sheet variant (mobile)                                    */
  /* ================================================================ */

  return (
    <>
      {trigger}

      <MobileBottomSheet
        isOpen={isOpen}
        onClose={close}
        title="Select Language"
        subtitle="Choose your preferred language"
        height="auto"
      >
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d4a44c]/50 focus:ring-1 focus:ring-[#d4a44c]/30 transition-all"
              role="searchbox"
              aria-label="Search languages"
            />
          </div>
        </div>

        {/* Grouped list */}
        <div className="space-y-4 pb-4" role="listbox" aria-label="Select language">
          {Object.entries(grouped).map(([region, langs]) => {
            const visible = search
              ? langs.filter((l) => {
                  const q = search.toLowerCase()
                  return (
                    l.nativeName.toLowerCase().includes(q) ||
                    l.name.toLowerCase().includes(q) ||
                    l.code.toLowerCase().includes(q)
                  )
                })
              : langs

            if (visible.length === 0) return null

            return (
              <div key={region}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 mb-2">
                  {region}
                </h3>
                {visible.map((lang) => (
                  <LanguageRow
                    key={lang.code}
                    code={lang.code}
                    nativeName={lang.nativeName}
                    name={lang.name}
                    isSelected={lang.code === language}
                    onSelect={() => select(lang.code as Language)}
                    heightClass="min-h-[52px] rounded-xl"
                  />
                ))}
              </div>
            )
          })}

          {/* No results state */}
          {search &&
            Object.values(grouped).every((langs) =>
              langs.every(
                (l) =>
                  !l.nativeName.toLowerCase().includes(search.toLowerCase()) &&
                  !l.name.toLowerCase().includes(search.toLowerCase()) &&
                  !l.code.toLowerCase().includes(search.toLowerCase()),
              ),
            ) && (
              <div className="px-4 py-8 text-center">
                <p className="text-white/50 text-sm">No languages found</p>
                <p className="text-white/30 text-xs mt-1">Try a different search term</p>
              </div>
            )}
        </div>

        <p className="text-xs text-white/40 text-center pb-2">Saved locally</p>
      </MobileBottomSheet>
    </>
  )
}

export default LanguageSelector
