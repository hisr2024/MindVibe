/**
 * Karma Problem Categories API Route
 * Returns all life problem categories mapped to karmic paths
 */

import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${BACKEND_URL}/api/karma-reset/problems/categories`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json(
      { error: 'Failed to load problem categories' },
      { status: response.status }
    )
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
