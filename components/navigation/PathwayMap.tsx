'use client'

/**
 * PathwayMap – horizontal stepper showing the five-step healing pathway.
 *
 * Pause → Understand → Converse → Apply → Train
 *
 * Renders as a scrollable row on mobile and a centred row on desktop.
 * Active step gets `aria-current="page"` plus a visual accent.
 * Respects `prefers-reduced-motion` by disabling the connector animation.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import {
  PATHWAY_STEPS,
  PATHWAY_YOU_ARE_HERE_KEY,
  PATHWAY_YOU_ARE_HERE_FALLBACK,
  PATHWAY_NAV_LABEL_KEY,
  PATHWAY_NAV_LABEL_FALLBACK,
} from '@/lib/navigation/pathway'

export function PathwayMap() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navLabel = t(PATHWAY_NAV_LABEL_KEY, PATHWAY_NAV_LABEL_FALLBACK)
  const youAreHere = t(PATHWAY_YOU_ARE_HERE_KEY, PATHWAY_YOU_ARE_HERE_FALLBACK)

  return (
    <nav
      aria-label={navLabel}
      className="w-full overflow-x-auto scrollbar-hide"
    >
      <ol
        className="flex items-center justify-center gap-0 min-w-max px-4 py-3 md:px-0"
        role="list"
      >
        {PATHWAY_STEPS.map((step, index) => {
          const isActive = pathname != null
            && (pathname === step.href
              || (step.href !== '/' && pathname.startsWith(step.href)))
          const isLast = index === PATHWAY_STEPS.length - 1

          return (
            <li
              key={step.id}
              className="flex items-center"
            >
              <Link
                href={step.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={
                  isActive
                    ? `${t(step.labelKey, step.labelFallback)} – ${youAreHere}`
                    : t(step.labelKey, step.labelFallback)
                }
                className={`
                  relative rounded-lg px-3 py-1.5 text-sm font-medium
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]
                  focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                  ${isActive
                    ? 'text-[#f5f0e8] after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#d4a44c]'
                    : 'text-white/50 hover:text-white/80'
                  }
                `}
              >
                {t(step.labelKey, step.labelFallback)}
              </Link>

              {/* Connector between steps */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="mx-1 text-white/20 select-none motion-safe:animate-pulse text-xs"
                >
                  →
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default PathwayMap
