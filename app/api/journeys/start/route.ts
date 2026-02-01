/**
 * Start Journey API Route
 *
 * Proxies requests to the backend API for starting a new journey.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildJourneyHeaders } from '../headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const headers = await buildJourneyHeaders(request)

    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/journeys/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error starting journey:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start journey',
      },
      { status: 500 }
    )
  }
}
