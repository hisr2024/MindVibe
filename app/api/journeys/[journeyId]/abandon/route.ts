/**
 * Abandon Journey API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId } = await params
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

    const response = await fetch(`${BACKEND_URL}/api/journeys/${journeyId}/abandon`, {
      method: 'POST',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error abandoning journey:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to abandon journey' },
      { status: 500 }
    )
  }
}
