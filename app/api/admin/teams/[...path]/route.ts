import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL, proxyHeaders, forwardCookies } from '@/lib/proxy-utils'

async function proxyAdminTeams(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const backendPath = `/api/admin/teams/${path.join('/')}`
  const queryString = new URL(request.url).search
  const targetUrl = `${BACKEND_URL}${backendPath}${queryString}`

  const method = request.method
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)
  const body = hasBody ? await request.text() : undefined

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers: proxyHeaders(request, method),
      body: body && body.length > 0 ? body : undefined,
      signal: AbortSignal.timeout(15000),
    })

    if (backendResponse.status === 204) {
      return forwardCookies(backendResponse, new NextResponse(null, { status: 204 }))
    }

    const data = await backendResponse.json().catch(() => ({}))
    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch {
    return NextResponse.json(
      { detail: 'Unable to connect to the server. Please try again shortly.' },
      { status: 503 }
    )
  }
}

export const GET = proxyAdminTeams
export const POST = proxyAdminTeams
export const PUT = proxyAdminTeams
export const PATCH = proxyAdminTeams
export const DELETE = proxyAdminTeams
