/**
 * Sentry Client-Side Configuration
 *
 * Initializes Sentry error tracking in the browser. Captures unhandled
 * exceptions, performance traces, and session replays to provide
 * production visibility without exposing sensitive user data.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    environment: process.env.NODE_ENV,

    // Sample 10% of transactions for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay for debugging production issues
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.1,

    integrations: [
      Sentry.replayIntegration({
        // Mask all text and block all media to protect user privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out sensitive data before sending to Sentry
    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.url) {
            // Remove query parameters that might contain tokens
            try {
              const url = new URL(breadcrumb.data.url, window.location.origin)
              url.searchParams.delete('token')
              url.searchParams.delete('session')
              breadcrumb.data.url = url.toString()
            } catch {
              // Keep original URL if parsing fails
            }
          }
          return breadcrumb
        })
      }

      // Never send journal content, chat messages, or other spiritual wellness data
      if (event.extra) {
        delete event.extra['journalContent']
        delete event.extra['chatMessage']
        delete event.extra['reflection']
      }

      return event
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      // Network errors
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      // User navigation
      'AbortError',
      'ResizeObserver loop',
    ],
  })
}
