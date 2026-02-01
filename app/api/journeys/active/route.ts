/**
 * Active Journeys API Route
 *
 * Proxies requests to the backend API for getting user's active journeys.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildJourneyHeaders } from '../headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const headers = await buildJourneyHeaders(request)

    const response = await fetch(`${BACKEND_URL}/api/journeys/active`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching active journeys:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        error: 'Failed to fetch active journeys',
      },
      { status: 500 }
    )
  }
}
