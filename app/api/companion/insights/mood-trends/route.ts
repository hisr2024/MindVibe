import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, proxyHeaders, forwardCookies } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryString = url.search

    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/insights/mood-trends${queryString}`, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(8000),
    })

    const data = await backendResponse.json().catch(() => ({}))
    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch {
    return NextResponse.json({ detail: 'Service unavailable' }, { status: 503 })
  }
}
