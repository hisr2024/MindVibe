'use client'

/**
 * components/consent/useConsent.ts
 *
 * Thin hook that exposes the consent context value. Shape matches the spec:
 *
 *   const { analytics, setConsent } = useConsent()
 *
 * But we also return every useful field from the underlying context so
 * callers can build richer UIs (settings screen, audit log, telemetry guard)
 * without needing to re-import the lower-level helpers.
 *
 * **SSR-safe contract:**
 *   - During server rendering and before the provider has hydrated, every
 *     boolean is `false` and `setConsent` is a safe no-op.
 *   - Analytics code MUST gate on `analytics === true`. Because that field
 *     is `false` until an explicit opt-in is read from storage, analytics
 *     can never fire before consent — even momentarily.
 */

import { useContext } from 'react'
import { ConsentContext, type ConsentContextValue } from './ConsentProvider'
import type { ConsentDecision, ConsentState } from '@/lib/consent/consent'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseConsentReturn {
  /** True iff the user explicitly opted in to analytics. */
  analytics: boolean
  /** Current raw state (decision, persisted flag, expiry, record). */
  state: ConsentState
  /** Was the provider able to hydrate from storage yet? */
  hydrated: boolean
  /** Should the banner render? True only after hydration with no decision. */
  shouldShowBanner: boolean
  /**
   * Persist the user's decision. Writing triggers a cross-tab broadcast so
   * every other open tab updates without a reload.
   */
  setConsent: (decision: Exclude<ConsentDecision, 'unset'>) => void
  /** Convenience — `setConsent('analytics')`. */
  accept: () => void
  /** Convenience — `setConsent('essential')`. */
  reject: () => void
  /** Forget the decision (re-open the banner). */
  reset: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to the current consent state.
 *
 * Returned identity is stable across renders for a given provider instance;
 * pass individual fields (not the whole object) into `useEffect` deps if
 * that matters for your use case.
 */
export function useConsent(): UseConsentReturn {
  const ctx: ConsentContextValue = useContext(ConsentContext)
  return {
    analytics: ctx.analytics,
    state: ctx.state,
    hydrated: ctx.hydrated,
    shouldShowBanner: ctx.shouldShowBanner,
    setConsent: ctx.setConsent,
    accept: ctx.accept,
    reject: ctx.reject,
    reset: ctx.reset,
  }
}

export default useConsent
