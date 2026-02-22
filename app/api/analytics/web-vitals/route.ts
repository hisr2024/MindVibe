import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, value, rating, page, timestamp } = body

    if (!name || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Log metrics server-side for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Web Vitals] ${name}: ${value} (${rating}) on ${page}`)
    }

    // In production, forward to external analytics if configured
    if (process.env.ANALYTICS_ENDPOINT) {
      fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value, rating, page, timestamp }),
      }).catch(() => {
        // Fire-and-forget: don't block the response
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
