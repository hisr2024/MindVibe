/**
 * lib/consent/consent.ts
 *
 * Single source of truth for Kiaanverse cookie / tracking consent.
 *
 * Cookie & tracking taxonomy (per GDPR analysis):
 *   - Session cookie (Redis-backed): strictly necessary, NO consent required.
 *   - Analytics events (anonymous, aggregated): REQUIRES explicit opt-in.
 *   - Sentry error reports: legitimate interest — no consent gate.
 *   - NO advertising, NO marketing pixels, NO third-party ad networks.
 *
 * This module is UI-agnostic and safe to import from the edge, from server
 * actions, and from the client. Every function is pure except the narrow
 * `read/write/clear` helpers that touch `localStorage` — and those are
 * SSR-safe (return sensible defaults / no-op when `window` is unavailable).
 *
 * Versioning:
 *   The storage key is suffixed `_v1`. If the consent schema ever changes
 *   in a way that invalidates previous decisions (e.g. new tracking
 *   category), bump to `_v2` and ship a corresponding migration. Users
 *   whose record has a mismatching `version` are re-prompted automatically.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key. Spec-mandated; do not rename without a version bump. */
export const CONSENT_STORAGE_KEY = 'kv_consent_v1' as const

/** Schema version — bump when the stored shape changes. */
export const CONSENT_SCHEMA_VERSION = 1

/**
 * Re-prompt interval (GDPR best practice: annual re-confirmation).
 * 12 months in milliseconds. Leap-year safe within ±1 day — acceptable.
 */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

/** Broadcast channel name so multiple tabs/components stay in sync. */
export const CONSENT_STORAGE_EVENT = 'kv-consent-change' as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The user's stated preference.
 *   - 'analytics' → opted in to anonymous analytics.
 *   - 'essential' → essential-only; no analytics firing.
 *   - 'unset'     → no decision yet; banner must be shown.
 */
export type ConsentDecision = 'analytics' | 'essential' | 'unset'

/** Serialised record persisted to localStorage. */
export interface ConsentRecord {
  version: typeof CONSENT_SCHEMA_VERSION
  decision: Exclude<ConsentDecision, 'unset'>
  /** Epoch millis when the user recorded the decision. */
  decidedAt: number
  /** Document origin at time of decision — aids audit & debugging. */
  origin: string
}

/** Normalised state object returned by the reader. */
export interface ConsentState {
  decision: ConsentDecision
  /** True iff the user has opted into analytics (never true on 'unset'). */
  analytics: boolean
  /** True iff the record is present AND still within the 12-month window. */
  isPersisted: boolean
  /** Epoch millis when the banner should be re-shown, or `null` if unset. */
  expiresAt: number | null
  /** The underlying persisted record, or `null` if missing/expired/invalid. */
  record: ConsentRecord | null
}

/** Server-safe default: no decision, no analytics. */
export const DEFAULT_CONSENT_STATE: ConsentState = Object.freeze({
  decision: 'unset',
  analytics: false,
  isPersisted: false,
  expiresAt: null,
  record: null,
})

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isValidRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.version === CONSENT_SCHEMA_VERSION &&
    (v.decision === 'analytics' || v.decision === 'essential') &&
    typeof v.decidedAt === 'number' &&
    Number.isFinite(v.decidedAt) &&
    typeof v.origin === 'string'
  )
}

function isExpired(record: ConsentRecord, now: number): boolean {
  return now - record.decidedAt > CONSENT_MAX_AGE_MS
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

/**
 * Parse a raw localStorage value into a {@link ConsentRecord} or `null`.
 * Exported so that server-rendered diagnostic tools can reuse the logic.
 */
export function parseConsentRecord(raw: string | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isValidRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Cached snapshot returned by {@link readConsent}.
 *
 * React 18's `useSyncExternalStore` invokes `getSnapshot` multiple times per
 * render and requires a stable (`Object.is`) result unless the underlying
 * store actually changed. We achieve that by keeping the previous snapshot
 * here and only allocating a new object when the raw localStorage value
 * differs from the last one we parsed.
 */
let cachedRaw: string | null | undefined
let cachedState: ConsentState = DEFAULT_CONSENT_STATE

/**
 * Internal: invalidate the snapshot cache. Called by the writers so the
 * next `readConsent()` observes the updated value.
 */
function invalidateSnapshotCache(): void {
  cachedRaw = undefined
}

/**
 * Read the current consent state from localStorage.
 *
 * SSR-safe: returns {@link DEFAULT_CONSENT_STATE} when `window` is absent,
 * when the record is missing, malformed, or older than 12 months.
 *
 * Returns the cached instance when the underlying storage has not changed,
 * so `useSyncExternalStore` can use it directly without an infinite loop.
 */
export function readConsent(): ConsentState {
  if (!isBrowser()) return DEFAULT_CONSENT_STATE

  let raw: string | null
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    // Private mode / storage disabled — treat as unset.
    cachedRaw = null
    cachedState = DEFAULT_CONSENT_STATE
    return cachedState
  }

  if (raw === cachedRaw) {
    return cachedState
  }

  const record = parseConsentRecord(raw)
  if (!record) {
    cachedRaw = raw
    cachedState = DEFAULT_CONSENT_STATE
    return cachedState
  }

  const now = Date.now()
  if (isExpired(record, now)) {
    // Stale decision — remove it so we re-prompt. Do not throw if storage
    // suddenly becomes read-only between the read and the remove.
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    cachedRaw = null
    cachedState = DEFAULT_CONSENT_STATE
    return cachedState
  }

  cachedRaw = raw
  cachedState = {
    decision: record.decision,
    analytics: record.decision === 'analytics',
    isPersisted: true,
    expiresAt: record.decidedAt + CONSENT_MAX_AGE_MS,
    record,
  }
  return cachedState
}

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------

/**
 * Persist a decision and broadcast a same-tab + cross-tab event so listeners
 * (hooks, analytics boot, banner close) can react.
 *
 * Returns the new, canonical state.
 */
export function writeConsent(
  decision: Exclude<ConsentDecision, 'unset'>,
): ConsentState {
  if (!isBrowser()) return DEFAULT_CONSENT_STATE

  const record: ConsentRecord = {
    version: CONSENT_SCHEMA_VERSION,
    decision,
    decidedAt: Date.now(),
    origin: window.location.origin,
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Quota exceeded / private mode — return in-memory state so UI still
    // closes the banner. Nothing will be persisted across reloads.
  }

  // Replace the cached snapshot so the next read returns a stable reference.
  invalidateSnapshotCache()
  const state: ConsentState = {
    decision,
    analytics: decision === 'analytics',
    isPersisted: true,
    expiresAt: record.decidedAt + CONSENT_MAX_AGE_MS,
    record,
  }
  cachedState = state
  try {
    cachedRaw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    cachedRaw = null
  }

  dispatchConsentChange(state)
  return state
}

/**
 * Forget the user's decision (e.g. "reset consent" in settings). The banner
 * will reappear on next page load.
 */
export function clearConsent(): ConsentState {
  if (!isBrowser()) return DEFAULT_CONSENT_STATE
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  invalidateSnapshotCache()
  cachedRaw = null
  cachedState = DEFAULT_CONSENT_STATE
  dispatchConsentChange(DEFAULT_CONSENT_STATE)
  return DEFAULT_CONSENT_STATE
}

// ---------------------------------------------------------------------------
// Pub/sub
// ---------------------------------------------------------------------------

export interface ConsentChangeDetail {
  state: ConsentState
}

function dispatchConsentChange(state: ConsentState): void {
  if (!isBrowser()) return
  try {
    const event = new CustomEvent<ConsentChangeDetail>(CONSENT_STORAGE_EVENT, {
      detail: { state },
    })
    window.dispatchEvent(event)
  } catch {
    /* ignore — older browsers without CustomEvent support */
  }
}

/**
 * Subscribe to consent changes (same-tab + cross-tab via storage event).
 * Returns an unsubscribe function.
 */
export function subscribeToConsent(
  listener: (state: ConsentState) => void,
): () => void {
  if (!isBrowser()) return () => {}

  const onCustom = (event: Event): void => {
    const detail = (event as CustomEvent<ConsentChangeDetail>).detail
    if (detail?.state) listener(detail.state)
  }

  const onStorage = (event: StorageEvent): void => {
    if (event.key !== CONSENT_STORAGE_KEY) return
    listener(readConsent())
  }

  window.addEventListener(CONSENT_STORAGE_EVENT, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_STORAGE_EVENT, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

// ---------------------------------------------------------------------------
// Analytics guard — single chokepoint
// ---------------------------------------------------------------------------

/**
 * The one true check any analytics/telemetry call must perform before firing.
 *
 * Usage:
 *   if (!canFireAnalytics()) return
 *   sendAnalyticsEvent(payload)
 *
 * Returns `false` server-side, on 'unset', or on 'essential'. ONLY returns
 * `true` when the user has explicitly opted in AND the decision is fresh.
 */
export function canFireAnalytics(): boolean {
  return readConsent().analytics
}
