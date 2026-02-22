'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/web-vitals'

/**
 * Client component that reports Core Web Vitals.
 * Measures LCP, FID, CLS, INP, TTFB, and FCP.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    import('web-vitals').then(({ onLCP, onFID, onCLS, onINP, onTTFB, onFCP }) => {
      onLCP(reportWebVitals)
      onFID(reportWebVitals)
      onCLS(reportWebVitals)
      onINP(reportWebVitals)
      onTTFB(reportWebVitals)
      onFCP(reportWebVitals)
    })
  }, [])

  return null
}
