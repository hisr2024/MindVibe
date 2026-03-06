'use client'

/**
 * Unified Language Selector Component
 *
 * Desktop/Tablet (>= 768 px) — compact gold-pill dropdown.
 * Mobile (< 768 px) — fully opaque bottom sheet with region groups.
 *
 * Consumes LanguageProvider context. No extra state management.
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

const MOBILE_BREAKPOINT = 768

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
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
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
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
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
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
      className="text-white/60"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Language row — shared by dropdown and sheet                        */
/* ------------------------------------------------------------------ */

interface LanguageRowProps {
  code: string
  nativeName: string
  name: string
  isSelected: boolean
  onSelect: () => void
  mobile?: boolean
}

function LanguageRow({ code, nativeName, name, isSelected, onSelect, mobile }: LanguageRowProps) {
  return (
    <button
      key={code}
      onClick={onSelect}
      className={`
        w-full flex items-center justify-between text-left
        transition-all active:scale-[0.98]
        ${mobile
          ? 'px-4 py-3.5 min-h-[56px] rounded-2xl'
          : 'px-4 py-3 min-h-[48px]'
        }
        ${isSelected
          ? 'bg-[#d4a44c]/15 text-[#f5f0e8] ring-1 ring-[#d4a44c]/25'
          : 'text-white/80 hover:bg-white/[0.04] active:bg-white/[0.08]'
        }
      `}
      role="option"
      aria-selected={isSelected}
    >
      <span className="flex flex-col min-w-0 gap-0.5">
        <span className={`truncate ${mobile ? 'text-[15px]' : 'text-sm'} font-medium`}>
          {nativeName}
        </span>
        <span className={`text-xs truncate ${isSelected ? 'text-[#e8b54a]/60' : 'text-white/35'}`}>
          {name}
        </span>
      </span>
      {isSelected && (
        <CheckIcon className="text-[#d4a44c] flex-shrink-0 ml-3" />
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  useIsMobile hook                                                   */
/* ------------------------------------------------------------------ */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

/* ------------------------------------------------------------------ */
/*  No-results helper                                                  */
/* ------------------------------------------------------------------ */

function hasNoGroupedResults(
  grouped: Record<string, { code: string; nativeName: string; name: string }[]>,
  search: string,
): boolean {
  if (!search) return false
  const q = search.toLowerCase()
  return Object.values(grouped).every((langs) =>
    langs.every(
      (l) =>
        !l.nativeName.toLowerCase().includes(q) &&
        !l.name.toLowerCase().includes(q) &&
        !l.code.toLowerCase().includes(q),
    ),
  )
}

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */

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

  /* ---- Filtered language entries (dropdown) ---- */
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

  /* ---- Grouped entries (sheet) ---- */
  const grouped = useMemo(() => getLanguagesByRegion(), [])

  /* ---- Select ---- */
  const select = useCallback(
    (code: Language) => {
      setLanguage(code)
      setIsOpen(false)
      setSearch('')
      triggerHaptic('selection')
      playSound('select')
      onLanguageChange?.(code)
      setTimeout(() => triggerRef.current?.focus(), 120)
    },
    [setLanguage, onLanguageChange, triggerHaptic, playSound],
  )

  /* ---- Open / close ---- */
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

  /* ---- Outside click (dropdown only) ---- */
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

  /* ---- Escape (dropdown only; sheet has its own) ---- */
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

  /* ---- Auto-focus search (dropdown) ---- */
  useEffect(() => {
    if (isOpen && resolvedVariant === 'dropdown') {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, resolvedVariant])

  /* ================================================================ */
  /*  Trigger                                                          */
  /* ================================================================ */

  const trigger = (
    <motion.button
      ref={triggerRef}
      onClick={() => (isOpen ? close() : open())}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`
        flex items-center gap-2 rounded-full
        border border-[#d4a44c]/40 bg-[#d4a44c]/15
        px-3 py-2 text-sm font-medium text-[#f5f0e8]
        shadow-sm shadow-black/20
        transition-all duration-200
        hover:bg-[#d4a44c]/25 hover:border-[#d4a44c]/55 hover:text-white
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]
        focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${className}
      `}
      aria-label={`Current language: ${config.nativeName}. Click to change language.`}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <GlobeIcon className="text-[#e8b54a] drop-shadow-[0_0_4px_rgba(212,164,76,0.35)]" />
      <span className="hidden sm:inline">{config.nativeName}</span>
      <span className="sm:hidden uppercase text-xs font-bold tracking-wide">{language}</span>
      <ChevronIcon isOpen={isOpen} />
    </motion.button>
  )

  if (triggerOnly) return trigger

  /* ================================================================ */
  /*  Dropdown (desktop / tablet)                                      */
  /* ================================================================ */

  if (resolvedVariant === 'dropdown') {
    return (
      <div ref={dropdownRef} className="relative">
        {trigger}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="
                absolute right-0 top-full mt-2 z-50 w-72
                overflow-hidden rounded-2xl
                border border-white/[0.08]
                bg-[#0a0a0f] shadow-2xl shadow-black/60
              "
              role="listbox"
              aria-label="Select language"
            >
              {/* Header */}
              <div className="border-b border-white/[0.06] px-4 py-3 bg-gradient-to-r from-[#d4a44c]/[0.06] to-transparent">
                <h3 className="text-sm font-semibold text-white/90">Select Language</h3>
                <p className="text-xs text-white/40 mt-0.5">Choose your preferred language</p>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-white/[0.04]">
                <div className="relative">
                  <SearchIcon />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="
                      w-full rounded-xl border border-white/[0.08]
                      bg-white/[0.03] pl-10 pr-3 py-2.5
                      text-sm text-white outline-none
                      placeholder:text-white/25
                      focus:border-[#d4a44c]/40 focus:bg-white/[0.05]
                      transition-all
                    "
                    role="searchbox"
                    aria-label="Search languages"
                  />
                </div>
              </div>

              {/* Language list */}
              <div className="max-h-72 overflow-y-auto overscroll-contain">
                {filtered.length > 0 ? (
                  filtered.map(([code, cfg]) => (
                    <LanguageRow
                      key={code}
                      code={code}
                      nativeName={cfg.nativeName}
                      name={cfg.name}
                      isSelected={language === code}
                      onSelect={() => select(code as Language)}
                    />
                  ))
                ) : (
                  <div className="px-4 py-10 text-center">
                    <p className="text-white/40 text-sm">No languages found</p>
                    <p className="text-white/25 text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.04] px-4 py-2.5 bg-white/[0.01]">
                <p className="text-xs text-white/30 text-center">
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
  /*  Bottom sheet (mobile) — fully opaque, sleek                      */
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
        className="!bg-[#08080c]"
        zIndex={80}
      >
        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="
                w-full rounded-2xl
                border border-white/[0.08] bg-white/[0.04]
                pl-11 pr-4 py-3.5
                text-[15px] text-white outline-none
                placeholder:text-white/25
                focus:border-[#d4a44c]/35 focus:bg-white/[0.06]
                transition-all
              "
              role="searchbox"
              aria-label="Search languages"
            />
          </div>
        </div>

        {/* Grouped list */}
        <div className="space-y-5 pb-6" role="listbox" aria-label="Select language">
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
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 px-2 mb-2">
                  {region}
                </h3>
                <div className="space-y-1">
                  {visible.map((lang) => (
                    <LanguageRow
                      key={lang.code}
                      code={lang.code}
                      nativeName={lang.nativeName}
                      name={lang.name}
                      isSelected={lang.code === language}
                      onSelect={() => select(lang.code as Language)}
                      mobile
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* No results */}
          {hasNoGroupedResults(grouped, search) && (
            <div className="px-4 py-10 text-center">
              <p className="text-white/40 text-sm">No languages found</p>
              <p className="text-white/25 text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.04] -mx-5 px-5 pt-3 pb-1">
          <p className="text-[11px] text-white/25 text-center tracking-wide">
            Preference saved locally
          </p>
        </div>
      </MobileBottomSheet>
    </>
  )
}

export default LanguageSelector
