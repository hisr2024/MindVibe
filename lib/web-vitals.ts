import type { Metric } from 'web-vitals'

/**
 * Report Core Web Vitals metrics.
 * In production, these would be sent to an analytics endpoint.
 */
export function reportWebVitals(metric: Metric): void {
  const { name, value, rating } = metric

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(`[Web Vitals] ${name}: ${Math.round(value)} (${rating})`)
  }

  // In production, send to analytics endpoint
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_URL) {
    const body = JSON.stringify({
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      page: window.location.pathname,
      timestamp: Date.now(),
    })

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/web-vitals`, body)
    }
  }
}
