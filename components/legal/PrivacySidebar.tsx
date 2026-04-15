'use client'

/**
 * components/legal/PrivacySidebar.tsx
 *
 * Desktop sticky table of contents.
 *
 * Behaviour:
 *   - Renders a vertical list of all top-level sections (with ordinal numbers).
 *   - IntersectionObserver tracks which section is currently most-visible and
 *     visually highlights the matching TOC entry.
 *   - Clicks scroll smoothly to the section; `prefers-reduced-motion` disables
 *     the smooth animation and falls back to instant jump.
 *   - Keyboard: native <a> focus is preserved; Enter follows the anchor.
 *
 * Accessibility:
 *   - Wrapped in <nav aria-label="Table of Contents"> landmark.
 *   - Active entry carries aria-current="location".
 *   - Focus ring uses the high-contrast gold accent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrivacySection } from '@/lib/mdx/privacy'

interface PrivacySidebarProps {
  sections: PrivacySection[]
  /** Sticky offset from the top of the viewport. */
  topOffset?: number
  className?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function PrivacySidebar({
  sections,
  topOffset = 96,
  className = '',
}: PrivacySidebarProps) {
  const [activeId, setActiveId] = useState<string>(() => sections[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const visibilityRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    if (targets.length === 0) return

    const visibility = visibilityRef.current
    sections.forEach((s) => visibility.set(s.id, 0))

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          visibility.set(id, entry.intersectionRatio)
        }
        // Pick the section with the greatest visible ratio; tie-break to the
        // first section that is at least partially visible near the top.
        let bestId = sections[0]?.id ?? ''
        let bestRatio = -1
        for (const section of sections) {
          const ratio = visibility.get(section.id) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = section.id
          }
        }
        if (bestRatio > 0) setActiveId(bestId)
      },
      {
        // Only count a section as "active" once its heading clears the nav band.
        rootMargin: `-${topOffset}px 0px -55% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    targets.forEach((target) => observerRef.current?.observe(target))

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [sections, topOffset])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      if (typeof window === 'undefined') return
      const target = document.getElementById(id)
      if (!target) return
      event.preventDefault()
      const reduced = prefersReducedMotion()
      const y = target.getBoundingClientRect().top + window.scrollY - topOffset
      window.scrollTo({
        top: y,
        behavior: reduced ? 'auto' : 'smooth',
      })
      // Update URL hash without jump.
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
      // Move focus to the heading for screen-reader continuity.
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    },
    [topOffset],
  )

  return (
    <nav
      aria-label="Table of Contents"
      className={[
        'sticky hidden lg:block',
        'w-[280px] shrink-0',
        'max-h-[calc(100vh-7rem)] overflow-y-auto',
        'rounded-2xl border border-[rgba(200,168,75,0.15)]',
        'bg-[rgba(10,10,20,0.55)] backdrop-blur-sm',
        'p-5',
        className,
      ].join(' ')}
      style={{ top: `${topOffset}px` }}
    >
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[rgba(232,220,200,0.55)]">
        On this page
      </p>
      <ol className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <li key={section.id} className="list-none">
              <a
                href={`#${section.id}`}
                onClick={(event) => handleClick(event, section.id)}
                aria-current={isActive ? 'location' : undefined}
                className={[
                  'group relative flex items-start gap-2 rounded-lg px-3 py-2',
                  'font-sans text-[0.85rem] leading-snug transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]',
                  isActive
                    ? 'bg-[rgba(200,168,75,0.12)] text-[#E8DCC8]'
                    : 'text-[rgba(232,220,200,0.75)] hover:bg-[rgba(200,168,75,0.06)] hover:text-[#E8DCC8]',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full',
                    isActive ? 'bg-[#C8A84B]' : 'bg-transparent',
                    'transition-colors',
                  ].join(' ')}
                />
                {section.ordinal ? (
                  <span
                    aria-hidden="true"
                    className={[
                      'min-w-[1.5rem] font-semibold',
                      isActive ? 'text-[#C8A84B]' : 'text-[rgba(200,168,75,0.55)]',
                    ].join(' ')}
                  >
                    {section.ordinal}
                  </span>
                ) : null}
                <span className="flex-1">{section.heading}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default PrivacySidebar
