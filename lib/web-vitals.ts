import type { Metric } from 'web-vitals'

/**
 * Report Core Web Vitals metrics.
 * Logs metrics locally in development. In production, metrics are collected
 * client-side only to avoid 405 errors from the backend analytics endpoint.
 */
export function reportWebVitals(metric: Metric): void {
  const { name, value, rating } = metric

  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(`[Web Vitals] ${name}: ${Math.round(value)} (${rating})`)
  }
}
