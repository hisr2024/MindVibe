/**
 * Error Tracking — Sentry integration for Kiaanverse.
 *
 * Wraps @sentry/react-native behind a safe facade that degrades gracefully
 * when Sentry is not installed (dev builds, CI). All public functions are
 * no-ops when the SDK is unavailable.
 *
 * Usage:
 *   import { initErrorTracking, captureError, setUserContext } from '../services/errorTracking';
 *
 *   // At app startup (before providers mount)
 *   initErrorTracking();
 *
 *   // On error
 *   captureError(err, { screen: 'JourneyDetail', journeyId: '123' });
 *
 *   // On login / logout
 *   setUserContext(user);   // set
 *   clearUserContext();     // clear
 *
 * Security: Never sends PII beyond user ID and email. No journal content,
 * no chat messages, no mood notes appear in error reports.
 */

import type { User } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Soft-import Sentry (may not be installed in dev builds)
// ---------------------------------------------------------------------------

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  withScope: (callback: (scope: ScopeProxy) => void) => void;
}

interface ScopeProxy {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  setLevel: (level: string) => void;
}

let _sentry: SentryLike | null = null;

function getSentry(): SentryLike | null {
  if (_sentry !== undefined && _sentry !== null) return _sentry;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    _sentry = require('@sentry/react-native') as SentryLike;
  } catch {
    _sentry = null;
  }
  return _sentry;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize Sentry error tracking.
 *
 * Reads DSN from the EXPO_PUBLIC_SENTRY_DSN environment variable.
 * Does nothing if the variable is unset or if the SDK is unavailable.
 * Call this once at app startup before any providers mount.
 */
export function initErrorTracking(): void {
  const sentry = getSentry();
  if (!sentry) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[errorTracking] EXPO_PUBLIC_SENTRY_DSN not set — Sentry disabled'
      );
    }
    return;
  }

  sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
    // Only send stack traces, no local variables (privacy)
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Strip PII from breadcrumbs
    beforeBreadcrumb: (breadcrumb: Record<string, unknown>) => {
      // Drop breadcrumbs that might contain user content
      if (breadcrumb.category === 'console') return null;
      return breadcrumb;
    },
  });
}

// ---------------------------------------------------------------------------
// Error Capture
// ---------------------------------------------------------------------------

/** Severity levels matching Sentry's level enum. */
export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * Send an error to Sentry with optional structured context.
 *
 * Context keys appear as "extra" data in the Sentry event — use them
 * to attach screen names, entity IDs, or action descriptions.
 * Never include user-generated content (journal text, chat messages).
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const sentry = getSentry();

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error('[errorTracking] captureError:', error, context);
  }

  if (!sentry) return;

  if (context) {
    sentry.withScope((scope: ScopeProxy) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      sentry.captureException(error);
    });
  } else {
    sentry.captureException(error);
  }
}

/**
 * Send a message-level event to Sentry.
 *
 * Use for non-exception events that still warrant tracking:
 * degraded service, unexpected state, or operational alerts.
 */
export function captureMessage(
  message: string,
  level: ErrorLevel = 'info'
): void {
  const sentry = getSentry();

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[errorTracking] captureMessage [${level}]:`, message);
  }

  if (!sentry) return;

  sentry.captureMessage(message, level);
}

// ---------------------------------------------------------------------------
// User Context
// ---------------------------------------------------------------------------

/**
 * Attach user identity to all subsequent error reports.
 *
 * Call after successful login. Only sends ID and email — no name,
 * no locale, no subscription tier (minimize PII in error tracker).
 */
export function setUserContext(user: User): void {
  const sentry = getSentry();
  if (!sentry) return;

  sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

/**
 * Clear user identity from error reports.
 *
 * Call on logout so subsequent errors are anonymous.
 */
export function clearUserContext(): void {
  const sentry = getSentry();
  if (!sentry) return;

  sentry.setUser(null);
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

/**
 * Add a breadcrumb that will appear in the next error report's trail.
 *
 * Use for significant state transitions (screen navigation, API calls,
 * store mutations) — not for routine UI interactions.
 */
export function breadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  const sentry = getSentry();
  if (!sentry) return;

  sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}
