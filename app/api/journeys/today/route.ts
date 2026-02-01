/**
 * Today's Agenda API Route
 *
 * Gets today's agenda for all active journeys.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildJourneyHeaders } from '../headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const headers = await buildJourneyHeaders(request)

    const response = await fetch(`${BACKEND_URL}/api/journeys/today`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching today\'s agenda:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        error: 'Failed to fetch today\'s agenda',
      },
      { status: 500 }
    )
  }
}
