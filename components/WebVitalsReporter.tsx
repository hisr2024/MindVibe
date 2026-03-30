'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/web-vitals'

/**
 * Client component that reports Core Web Vitals.
 * Measures LCP, CLS, INP, TTFB, and FCP.
 * Note: FID was removed in web-vitals v5 — INP is the replacement metric.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    import('web-vitals').then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
      onLCP(reportWebVitals)
      onCLS(reportWebVitals)
      onINP(reportWebVitals)
      onTTFB(reportWebVitals)
      onFCP(reportWebVitals)
    }).catch(() => {
      // Non-critical: web vitals reporting unavailable
    })
  }, [])

  return null
}
