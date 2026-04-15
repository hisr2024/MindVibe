'use client'

/**
 * components/legal/PrivacyMobileTOC.tsx
 *
 * Mobile-first collapsible table of contents.
 *
 * Behaviour:
 *   - Collapsed by default to preserve vertical space.
 *   - Tapping the summary toggles the list; the summary button is ≥ 44×44 px.
 *   - Selecting an entry smooth-scrolls, collapses the TOC, and updates the
 *     URL hash without a full page jump.
 *   - Fully keyboard accessible: Enter and Space toggle open; Tab moves
 *     through list entries; Escape collapses.
 *
 * Accessibility:
 *   - aria-expanded reflects current state.
 *   - aria-controls references the list by id.
 *   - <nav aria-label="Table of Contents"> landmark.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { PrivacySection } from '@/lib/mdx/privacy'

interface PrivacyMobileTOCProps {
  sections: PrivacySection[]
  /** Offset from top when jumping to a section (mobile sticky header height). */
  topOffset?: number
  className?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function PrivacyMobileTOC({
  sections,
  topOffset = 72,
  className = '',
}: PrivacyMobileTOCProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeId, setActiveId] = useState<string>(() => sections[0]?.id ?? '')
  const listId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Track the current section as the user scrolls so the dropdown summary
  // reflects where they are even when collapsed.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const visibility = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio)
        }
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
        rootMargin: `-${topOffset + 16}px 0px -60% 0px`,
        threshold: [0, 0.25, 0.5, 1],
      },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections, topOffset])

  // Escape closes an open TOC.
  useEffect(() => {
    if (!isOpen) return
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const jumpTo = useCallback(
    (id: string) => {
      if (typeof window === 'undefined') return
      const target = document.getElementById(id)
      if (!target) return
      const reduced = prefersReducedMotion()
      const y = target.getBoundingClientRect().top + window.scrollY - topOffset
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
      setIsOpen(false)
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    },
    [topOffset],
  )

  const handleItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, id: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        jumpTo(id)
      }
    },
    [jumpTo],
  )

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  return (
    <nav
      ref={containerRef}
      aria-label="Table of Contents"
      className={[
        'mx-4 rounded-2xl border border-[rgba(200,168,75,0.2)]',
        'bg-[rgba(10,10,20,0.85)] backdrop-blur-sm',
        'overflow-hidden',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className={[
          'flex w-full items-center justify-between gap-3',
          'px-4 py-3 min-h-[44px]',
          'text-left font-sans',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C8A84B]',
        ].join(' ')}
      >
        <span className="flex flex-col">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[rgba(232,220,200,0.6)]">
            On this page
          </span>
          {activeSection ? (
            <span className="text-sm text-[#E8DCC8]">
              {activeSection.ordinal ? (
                <span className="mr-1 text-[#C8A84B]">{activeSection.ordinal}.</span>
              ) : null}
              {activeSection.heading}
            </span>
          ) : null}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={[
            'h-5 w-5 shrink-0 text-[#C8A84B] transition-transform',
            isOpen ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <ol
        id={listId}
        hidden={!isOpen}
        className="flex flex-col border-t border-[rgba(200,168,75,0.15)]"
      >
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <li key={section.id} className="list-none">
              <a
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  jumpTo(section.id)
                }}
                onKeyDown={(event) => handleItemKeyDown(event, section.id)}
                aria-current={isActive ? 'location' : undefined}
                className={[
                  'flex items-start gap-3',
                  'min-h-[44px] px-4 py-3',
                  'border-b border-[rgba(200,168,75,0.08)] last:border-b-0',
                  'text-[0.95rem] leading-snug',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C8A84B]',
                  isActive
                    ? 'bg-[rgba(200,168,75,0.1)] text-[#E8DCC8]'
                    : 'text-[rgba(232,220,200,0.82)] active:bg-[rgba(200,168,75,0.06)]',
                ].join(' ')}
              >
                {section.ordinal ? (
                  <span
                    aria-hidden="true"
                    className={[
                      'min-w-[1.75rem] font-semibold',
                      isActive ? 'text-[#C8A84B]' : 'text-[rgba(200,168,75,0.6)]',
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

export default PrivacyMobileTOC
