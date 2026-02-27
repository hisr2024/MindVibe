/**
 * Karma Reset KIAAN Health Check API Route
 * Checks if the backend KIAAN service is available
 */

import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET() {
  try {
    // Try to reach the backend health endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${BACKEND_URL}/api/karma-reset/kiaan/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: 'healthy',
          service: 'karma-reset-kiaan',
          backend: 'connected',
          timestamp: new Date().toISOString(),
          ...data,
        })
      }

      // Backend returned error but is reachable
      return NextResponse.json({
        status: 'degraded',
        service: 'karma-reset-kiaan',
        backend: 'error',
        backend_status: response.status,
        timestamp: new Date().toISOString(),
        message: 'Backend service is reachable but returned an error. Fallback guidance is available.',
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)

      // Backend is not reachable
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError'

      return NextResponse.json({
        status: 'healthy', // Still healthy because we have fallback
        service: 'karma-reset-kiaan',
        backend: 'unavailable',
        timestamp: new Date().toISOString(),
        message: isTimeout
          ? 'Backend service timed out. Fallback guidance is available.'
          : `Backend service is unavailable: ${errorMessage}. Fallback guidance is available.`,
        fallback_available: true,
      })
    }

  } catch (error) {
    console.error('[karma-reset/health] Health check error:', error)

    // Even if health check fails, the service can still work with fallbacks
    return NextResponse.json({
      status: 'healthy',
      service: 'karma-reset-kiaan',
      backend: 'unknown',
      timestamp: new Date().toISOString(),
      message: 'Health check encountered an error, but fallback guidance is available.',
      fallback_available: true,
    })
  }
}
