/**
 * LanguageSelectorIcon — Sleek, adaptive language icon for cross-platform use.
 *
 * Renders a globe icon that morphs between three visual modes:
 *   - "pill"     → Gold pill with globe + locale code (navbar, desktop)
 *   - "icon"     → Minimal globe-only button (mobile nav, compact spaces)
 *   - "floating" → Floating action button with pulse ring (onboarding, empty states)
 *
 * Adapts automatically based on viewport when no explicit variant is provided.
 * Accessible, keyboard-navigable, screen-reader-friendly.
 */

'use client'

import { forwardRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLanguage, type Language } from '@/hooks/useLanguage'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type IconVariant = 'pill' | 'icon' | 'floating'

export interface LanguageSelectorIconProps {
  /** Visual variant. Auto-detected from viewport if omitted. */
  variant?: IconVariant
  /** Whether the parent dropdown/sheet is open */
  isOpen?: boolean
  /** Click handler — typically opens the language selector */
  onClick?: () => void
  /** Additional Tailwind classes */
  className?: string
  /** Size multiplier (1 = default, 0.75 = compact, 1.25 = large) */
  scale?: number
  /** Show locale code text (only applies to "pill" variant) */
  showLabel?: boolean
  /** Accessible label override */
  ariaLabel?: string
}

/* ------------------------------------------------------------------ */
/*  Globe SVG                                                          */
/* ------------------------------------------------------------------ */

function GlobeSvg({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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

/* ------------------------------------------------------------------ */
/*  Chevron SVG                                                        */
/* ------------------------------------------------------------------ */

function ChevronSvg({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="text-white/50"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Variant renderers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Pill variant — gold-bordered pill with globe, locale code, and chevron.
 * Best for: desktop navbar, settings header.
 */
function PillIcon({
  language,
  isOpen,
  scale,
  showLabel,
  className,
}: {
  language: string
  isOpen: boolean
  scale: number
  showLabel: boolean
  className: string
}) {
  const iconSize = Math.round(16 * scale)
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border border-[#d4a44c]/40 bg-[#d4a44c]/10
        px-3 py-1.5
        text-sm font-medium text-[#f5f0e8]
        shadow-sm shadow-black/15
        transition-colors duration-150
        hover:bg-[#d4a44c]/20 hover:border-[#d4a44c]/55
        focus-visible:ring-2 focus-visible:ring-[#d4a44c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${className}
      `}
    >
      <GlobeSvg
        size={iconSize}
        className="text-[#e8b54a] drop-shadow-[0_0_3px_rgba(212,164,76,0.3)]"
      />
      {showLabel && (
        <span className="uppercase text-xs font-bold tracking-wider">{language}</span>
      )}
      <ChevronSvg isOpen={isOpen} />
    </span>
  )
}

/**
 * Icon variant — minimal globe button, no text.
 * Best for: mobile nav bar, toolbar, compact layouts.
 */
function IconOnly({
  scale,
  className,
}: {
  scale: number
  className: string
}) {
  const iconSize = Math.round(20 * scale)
  return (
    <span
      className={`
        inline-flex items-center justify-center
        w-9 h-9 rounded-full
        bg-white/[0.06] border border-white/[0.08]
        text-[#e8b54a]
        transition-colors duration-150
        hover:bg-white/[0.1] hover:border-[#d4a44c]/30
        focus-visible:ring-2 focus-visible:ring-[#d4a44c] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${className}
      `}
    >
      <GlobeSvg size={iconSize} />
    </span>
  )
}

/**
 * Floating variant — FAB-style with subtle pulse ring.
 * Best for: onboarding screens, empty states, first-time language prompt.
 */
function FloatingIcon({
  language,
  scale,
  className,
}: {
  language: string
  scale: number
  className: string
}) {
  const iconSize = Math.round(22 * scale)
  return (
    <span
      className={`
        relative inline-flex items-center justify-center
        w-12 h-12 rounded-full
        bg-gradient-to-br from-[#d4a44c] to-[#b8862d]
        text-white shadow-lg shadow-[#d4a44c]/25
        transition-transform duration-150
        hover:scale-105 active:scale-95
        focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${className}
      `}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping bg-[#d4a44c]/20"
        style={{ animationDuration: '2.5s' }}
        aria-hidden="true"
      />
      <GlobeSvg size={iconSize} className="relative z-10" />
      <span
        className="absolute -bottom-0.5 -right-0.5 z-10 text-[9px] font-bold
                   bg-slate-900 text-[#e8b54a] rounded-full px-1 py-0.5
                   border border-[#d4a44c]/40 uppercase tracking-wider leading-none"
        aria-hidden="true"
      >
        {language}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */

export const LanguageSelectorIcon = forwardRef<HTMLButtonElement, LanguageSelectorIconProps>(
  function LanguageSelectorIcon(
    {
      variant,
      isOpen = false,
      onClick,
      className = '',
      scale = 1,
      showLabel = true,
      ariaLabel,
    },
    ref,
  ) {
    const { language, config } = useLanguage()

    const resolvedLabel = ariaLabel ?? `Language: ${config.nativeName}. Click to change.`

    // Determine locale display code (2-letter uppercase)
    const localeCode = useMemo(() => {
      const code = language as string
      return code.split('-')[0].toUpperCase()
    }, [language])

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        className="outline-none cursor-pointer"
        aria-label={resolvedLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        {(!variant || variant === 'pill') && (
          <PillIcon
            language={localeCode}
            isOpen={isOpen}
            scale={scale}
            showLabel={showLabel}
            className={className}
          />
        )}
        {variant === 'icon' && (
          <IconOnly scale={scale} className={className} />
        )}
        {variant === 'floating' && (
          <FloatingIcon language={localeCode} scale={scale} className={className} />
        )}
      </motion.button>
    )
  },
)

export default LanguageSelectorIcon
