/**
 * Sentry Server-Side Configuration
 *
 * Initializes Sentry error tracking on the Next.js server. Captures
 * server-side rendering errors, API route failures, and middleware
 * exceptions with privacy-safe defaults.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    environment: process.env.NODE_ENV,

    // Sample 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Strip request body data that might contain user content
      if (event.request?.data) {
        const sanitizedData =
          typeof event.request.data === 'object'
            ? { ...event.request.data }
            : event.request.data

        if (typeof sanitizedData === 'object' && sanitizedData !== null) {
          const obj = sanitizedData as Record<string, unknown>
          delete obj['encrypted_data']
          delete obj['content']
          delete obj['message']
          delete obj['reflection']
          delete obj['journal']
          delete obj['password']
          event.request.data = obj
        }
      }

      // Strip authorization headers
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['x-csrf-token']
      }

      return event
    },
  })
}
