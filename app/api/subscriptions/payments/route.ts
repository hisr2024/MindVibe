import { NextRequest } from 'next/server'
import { BACKEND_URL, proxyHeaders, forwardCookies } from '@/lib/proxy-utils'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('page_size') || '20'

    const backendUrl = `${BACKEND_URL}/api/subscriptions/payments?page=${page}&page_size=${pageSize}`

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(10000),
    })

    const data = await backendResponse.json().catch(() => ({}))

    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch (error) {
    console.error(
      '[Proxy GET /api/subscriptions/payments] Backend unavailable:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { detail: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
