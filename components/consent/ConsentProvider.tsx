'use client'

/**
 * components/consent/ConsentProvider.tsx
 *
 * React context that exposes the current consent state to the whole tree.
 *
 * Design goals:
 *   - **SSR-safe:** the server render always returns the "unset / essential"
 *     defaults. Analytics therefore *cannot* fire during SSR even by accident.
 *   - **One source of truth:** all persistence is delegated to
 *     `lib/consent/consent.ts` — the provider is a thin reactive wrapper.
 *   - **Multi-tab sync:** re-hydrates on `storage` events so a decision taken
 *     in one tab propagates to the banner in every other open tab.
 *   - **Idempotent:** mount / unmount leaks nothing (single listener,
 *     cleaned up on unmount).
 *
 * The provider also exposes a small, stable imperative API via the context
 * value so callers can `accept()`, `reject()`, or `reset()` without having
 * to import the helpers separately.
 */

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  DEFAULT_CONSENT_STATE,
  readConsent,
  subscribeToConsent,
  writeConsent,
  clearConsent,
  type ConsentDecision,
  type ConsentState,
} from '@/lib/consent/consent'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface ConsentContextValue {
  /** Current decision + analytics flag. */
  state: ConsentState
  /** Convenience — equivalent to `state.analytics`. */
  analytics: boolean
  /**
   * Has the provider finished hydrating from localStorage?
   *
   * During SSR and the initial client render this is `false`; after the
   * first `useEffect` it flips to `true`. Use it to avoid flashing UI that
   * depends on the persisted state.
   */
  hydrated: boolean
  /** True when there is no stored decision — i.e. the banner must show. */
  shouldShowBanner: boolean
  /** Explicit setter. Writes to storage + fan-out to other tabs. */
  setConsent: (decision: Exclude<ConsentDecision, 'unset'>) => void
  /** Convenience — `setConsent('analytics')`. */
  accept: () => void
  /** Convenience — `setConsent('essential')`. */
  reject: () => void
  /** Forget the decision (re-open the banner). */
  reset: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const noop = (): void => {
  /* consumers may legitimately call setters from outside a provider during
     tests or one-off render trees; silently no-op in those cases. */
}

const DEFAULT_CONTEXT: ConsentContextValue = Object.freeze({
  state: DEFAULT_CONSENT_STATE,
  analytics: false,
  hydrated: false,
  shouldShowBanner: false, // intentionally false until hydrated — avoids flash
  setConsent: noop,
  accept: noop,
  reject: noop,
  reset: noop,
})

export const ConsentContext = createContext<ConsentContextValue>(DEFAULT_CONTEXT)
ConsentContext.displayName = 'ConsentContext'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ConsentProviderProps {
  children: ReactNode
  /**
   * Testing hook — when provided, overrides the initial client-side state.
   * Ignored in production unless the caller really wants to short-circuit
   * localStorage (e.g. Storybook mocks).
   */
  initialState?: ConsentState
}

// A no-op subscriber used to detect "are we hydrated on the client yet?" —
// pairs with a snapshot that returns `true` on client and `false` on server.
const neverSubscribe = (): (() => void) => () => {}
const getTrueSnapshot = (): boolean => true
const getFalseSnapshot = (): boolean => false

export function ConsentProvider({
  children,
  initialState,
}: ConsentProviderProps) {
  // `useSyncExternalStore` is the React-18 blessed way to subscribe to an
  // external store that is unsafe to read during SSR. The `getServerSnapshot`
  // arg guarantees the server and the first client render produce identical
  // markup (the safe default), eliminating hydration warnings.
  const state: ConsentState = useSyncExternalStore(
    subscribeToConsent,
    initialState ? () => initialState : readConsent,
    () => DEFAULT_CONSENT_STATE,
  )

  // True only after the client has completed its first commit. Computed via
  // a second useSyncExternalStore so it flips in the same render as the
  // state hydration, without an explicit setState-in-effect.
  const hydrated: boolean = useSyncExternalStore(
    neverSubscribe,
    getTrueSnapshot,
    getFalseSnapshot,
  )

  const setConsent = useCallback(
    (decision: Exclude<ConsentDecision, 'unset'>): void => {
      writeConsent(decision)
    },
    [],
  )

  const accept = useCallback((): void => setConsent('analytics'), [setConsent])
  const reject = useCallback((): void => setConsent('essential'), [setConsent])

  const reset = useCallback((): void => {
    clearConsent()
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      state,
      analytics: state.analytics,
      hydrated,
      // Only show the banner after hydration to avoid SSR flash. Any time
      // `isPersisted` is false post-hydration, we know the user has no
      // valid decision (fresh, cleared, or expired).
      shouldShowBanner: hydrated && !state.isPersisted,
      setConsent,
      accept,
      reject,
      reset,
    }),
    [state, hydrated, setConsent, accept, reject, reset],
  )

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}

export default ConsentProvider
