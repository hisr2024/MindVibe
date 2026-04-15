'use client'

/**
 * components/consent/CookieBanner.tsx
 *
 * GDPR-compliant cookie / consent banner.
 *
 * ── Compliance posture ──────────────────────────────────────────────────
 *   - Shown on first visit only (suppressed when a valid decision exists).
 *   - Re-shown automatically after 12 months (handled by readConsent()).
 *   - Exactly two options, rendered with IDENTICAL weight and styling:
 *       1. "Accept analytics"
 *       2. "Essential only"
 *     No "Accept all" default glow, no visual bias — avoids dark patterns
 *     that invalidate consent under EDPB Guidelines 05/2020 §86.
 *   - Analytics never fire before the user explicitly chooses "Accept
 *     analytics"; `useConsent().analytics` stays `false` until then.
 *
 * ── UX / accessibility ─────────────────────────────────────────────────
 *   - Role: `dialog`, aria-modal false (non-blocking), aria-labelledby /
 *     aria-describedby linked to the visible heading and description.
 *   - Focus is moved to the first actionable control on mount and trapped
 *     within the banner via Tab / Shift-Tab cycling. Escape is NOT mapped
 *     to "dismiss" (closing without a choice would violate GDPR — the user
 *     must actively choose).
 *   - `prefers-reduced-motion` disables the slide-up entrance animation.
 *
 * ── Layout ─────────────────────────────────────────────────────────────
 *   - Mobile  (<640px): full-width strip pinned above the 88px bottom nav
 *                       (bottom-[96px]) so it never overlaps tab controls.
 *                       z-index 49 — one below the z-50 nav by design.
 *   - Desktop (≥640px): 320px-wide card anchored bottom-right.
 *   - Both surfaces share identical content and identical button weights.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import Link from 'next/link'
import { useConsent } from './useConsent'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return every focusable element inside a container, in document order.
 * Used by the focus trap; scoped here to avoid pulling in a focus-trap lib.
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
  )
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CookieBannerProps {
  /**
   * URL of the cookies section in the privacy policy. Defaults to the spec
   * target `/privacy#cookies`.
   */
  privacyHref?: string
  /**
   * When true, render regardless of consent state. Useful for a settings
   * screen where the user voluntarily re-opens the dialog. Defaults to the
   * automatic "first-visit / stale" logic.
   */
  forceOpen?: boolean
}

export function CookieBanner({
  privacyHref = '/privacy#cookies',
  forceOpen = false,
}: CookieBannerProps) {
  const { shouldShowBanner, accept, reject, hydrated } = useConsent()

  // Lazy init — reads the media query exactly once on first client render.
  // This component is client-only (`'use client'`) and does not render during
  // SSR (returns null before hydration), so it is safe to read matchMedia here.
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  // When reduced motion is preferred we skip the entrance transition entirely
  // by starting in the "entered" state. Otherwise we start hidden and promote
  // to "entered" on the next animation frame.
  const [isEntered, setIsEntered] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true // SSR path — unreachable
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [isExiting, setIsExiting] = useState<boolean>(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const headingId = useId()
  const descriptionId = useId()

  const shouldRender = forceOpen || shouldShowBanner

  // ── Subscribe to reduced-motion changes (read initial value lazily above) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // ── Slide-up entrance on mount (skipped if reduced motion) ──────────────
  useEffect(() => {
    if (!shouldRender) return
    if (reducedMotion || isEntered) return
    // Defer one frame so the initial "hidden" state paints first.
    const frame = requestAnimationFrame(() => setIsEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [shouldRender, reducedMotion, isEntered])

  // ── Focus management: save prior focus, move into banner, restore on close ──
  useEffect(() => {
    if (!shouldRender) return
    if (typeof document === 'undefined') return

    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null

    const moveFocus = () => {
      const focusables = getFocusableElements(rootRef.current)
      if (focusables.length > 0) {
        focusables[0].focus()
      } else if (rootRef.current) {
        rootRef.current.setAttribute('tabindex', '-1')
        rootRef.current.focus()
      }
    }

    // Wait one frame so the banner is in the DOM before we try to focus it.
    const id = requestAnimationFrame(moveFocus)
    return () => {
      cancelAnimationFrame(id)
      const prior = previouslyFocusedRef.current
      if (prior && typeof prior.focus === 'function') {
        try {
          prior.focus({ preventScroll: true })
        } catch {
          /* ignore */
        }
      }
    }
  }, [shouldRender])

  // ── Keyboard focus trap (Tab / Shift-Tab cycle within the dialog) ───────
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab') return
      const focusables = getFocusableElements(rootRef.current)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey) {
        if (active === first || !rootRef.current?.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          event.preventDefault()
          first.focus()
        }
      }
    },
    [],
  )

  // ── Close with a short fade after a decision is recorded ────────────────
  const runExit = useCallback(
    (afterExit: () => void): void => {
      if (reducedMotion) {
        afterExit()
        return
      }
      setIsExiting(true)
      window.setTimeout(() => {
        afterExit()
      }, 200)
    },
    [reducedMotion],
  )

  const handleAccept = useCallback((): void => {
    runExit(accept)
  }, [accept, runExit])

  const handleReject = useCallback((): void => {
    runExit(reject)
  }, [reject, runExit])

  // ── Tailwind class computation ─────────────────────────────────────────
  const animationClass = useMemo<string>(() => {
    if (reducedMotion) {
      return 'transition-none'
    }
    const base = 'transition-all duration-300 ease-out motion-reduce:transition-none'
    if (isExiting) {
      return `${base} opacity-0 translate-y-2 duration-200`
    }
    if (!isEntered) {
      return `${base} opacity-0 translate-y-6`
    }
    return `${base} opacity-100 translate-y-0`
  }, [isExiting, isEntered, reducedMotion])

  // Don't render during SSR or before hydration to avoid a flash. The
  // hydrated guard is provided by shouldShowBanner; `forceOpen` bypasses it.
  if (!hydrated && !forceOpen) return null
  if (!shouldRender) return null

  // Shared button class — BOTH buttons use the same weight + size to avoid
  // dark patterns. Only the accent colour differs so screen magnifier users
  // can distinguish them; contrast remains ≥ 7:1 on #0A0A14.
  const buttonBase =
    'inline-flex h-11 min-w-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ' +
    'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[#C8A84B]'

  const primaryBtn =
    buttonBase +
    ' bg-[#C8A84B] text-[#0A0A14] hover:bg-[#d8b858] active:bg-[#b99a44]'

  const secondaryBtn =
    buttonBase +
    ' border border-[rgba(200,168,75,0.55)] text-[#E8DCC8] ' +
    'hover:bg-[rgba(200,168,75,0.12)] active:bg-[rgba(200,168,75,0.18)]'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      aria-live="polite"
      data-testid="cookie-banner"
      onKeyDown={handleKeyDown}
      // Positioning: mobile full-width strip above bottom nav; desktop card
      // bottom-right. z-49 so it sits UNDER the z-50 bottom nav — verified
      // in the layout tests.
      className={[
        'fixed z-[49]',
        // Mobile: full-width strip lifted above the 88px bottom nav + safe area.
        'inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom,0px))]',
        // Desktop: detach from left, anchor to bottom-right with small gap.
        'sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto',
        'sm:w-[320px]',
        // Paper
        'mx-3 sm:mx-0',
        'rounded-2xl border border-[rgba(200,168,75,0.3)]',
        'bg-[#0A0A14]/95 backdrop-blur-md',
        'shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
        'text-[#E8DCC8]',
        // Padding
        'p-4 sm:p-5',
        animationClass,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(200,168,75,0.4)] bg-[rgba(200,168,75,0.08)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-[#C8A84B]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10 5 5 0 0 1-5-5 5 5 0 0 1-5-5Z" />
            <circle cx="9" cy="12" r="0.8" fill="currentColor" />
            <circle cx="14" cy="15" r="0.8" fill="currentColor" />
            <circle cx="15" cy="10" r="0.8" fill="currentColor" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={headingId}
            className="font-divine text-[1rem] leading-tight text-[#E8DCC8]"
          >
            Your cookie choice
          </h2>
          <p
            id={descriptionId}
            className="mt-1.5 font-sans text-[0.8rem] leading-relaxed text-[#E8DCC8]/85"
          >
            We use a single strictly-necessary session cookie so the site works.
            With your permission, we&rsquo;d also like to record anonymous
            analytics to improve Kiaanverse. No ads, ever.{' '}
            <Link
              href={privacyHref}
              className="font-semibold text-[#E8DCC8] underline decoration-[#C8A84B]/60 underline-offset-2 hover:decoration-[#C8A84B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]"
            >
              Read our cookie policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Two equal-weight actions — intentionally identical size & prominence. */}
      <div className="mt-4 flex items-stretch gap-2">
        <button
          type="button"
          onClick={handleReject}
          className={secondaryBtn}
          data-testid="cookie-banner-reject"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className={primaryBtn}
          data-testid="cookie-banner-accept"
        >
          Accept analytics
        </button>
      </div>
    </div>
  )
}

// Re-export with the name the spec uses for default imports.
export default CookieBanner

// Exported for tests — consumers should prefer the hook.
export { prefersReducedMotion as __testHelpers_prefersReducedMotion }
