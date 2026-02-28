/**
 * Journey Engine Templates API Proxy
 * Proxies to backend journey-engine service with graceful fallback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

const FALLBACK_TEMPLATES = {
  templates: [],
  total: 0,
  limit: 20,
  offset: 0,
  _fallback: true,
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryString = url.search

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/templates${queryString}`, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    return forwardCookies(response, NextResponse.json(FALLBACK_TEMPLATES))
  } catch {
    return NextResponse.json(FALLBACK_TEMPLATES)
  }
}
