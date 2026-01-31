/**
 * Journey Access Check API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
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

    const response = await fetch(`${BACKEND_URL}/api/journeys/access`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error checking journey access:', error)
    return NextResponse.json(
      {
        success: true,
        data: {
          has_access: true,
          active_count: 0,
          limit: 5,
          remaining_slots: 5,
          is_trial: false,
        },
      },
      { status: 200 }
    )
  }
}
