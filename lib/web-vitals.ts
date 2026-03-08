import type { Metric } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'

/**
 * Report Core Web Vitals metrics.
 *
 * In development, logs metrics to the console.
 * In production, sends metrics to Sentry for performance monitoring
 * dashboards and alerting on regressions.
 */
export function reportWebVitals(metric: Metric): void {
  const { name, value, rating } = metric

  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(`[Web Vitals] ${name}: ${Math.round(value)} (${rating})`)
  }

  // Send to Sentry for production monitoring
  Sentry.captureMessage(`Web Vital: ${name}`, {
    level: rating === 'poor' ? 'warning' : 'info',
    tags: {
      webVitalName: name,
      webVitalRating: rating,
    },
    extra: {
      value: Math.round(value),
      rating,
    },
  })
}
