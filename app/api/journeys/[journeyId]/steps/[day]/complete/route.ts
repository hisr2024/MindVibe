/**
 * Complete Step API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface RouteParams {
  params: Promise<{ journeyId: string; day: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId, day } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const xAuthUid = request.headers.get('X-Auth-UID')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (accessToken) {
      headers['Cookie'] = `access_token=${accessToken}`
    }

    if (xAuthUid) {
      headers['X-Auth-UID'] = xAuthUid
    }

    const body = await request.json()

    const response = await fetch(
      `${BACKEND_URL}/api/journeys/${journeyId}/steps/${day}/complete`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error completing step:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}
