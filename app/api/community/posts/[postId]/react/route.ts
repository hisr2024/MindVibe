/**
 * Community Post React API Proxy
 *
 * POST /api/community/posts/[postId]/react → React to a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  try {
    const body = await request.text()
    const response = await fetch(
      `${BACKEND_URL}/api/community/posts/${encodeURIComponent(postId)}/react`,
      {
        method: 'POST',
        headers: proxyHeaders(request),
        body: body || undefined,
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json().catch(() => ({}))
    return forwardCookies(
      response,
      NextResponse.json(data, { status: response.status })
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
