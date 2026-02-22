/**
 * Web Vitals API Route
 *
 * Accepts Web Vitals performance metrics from the browser.
 * Returns 200 to prevent 405 console errors on the client.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Accept the payload silently — log in development only
    if (process.env.NODE_ENV === 'development') {
      const body = await request.json().catch(() => null)
      if (body) {
        console.log('[Web Vitals]', JSON.stringify(body).slice(0, 200))
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'ok' })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
