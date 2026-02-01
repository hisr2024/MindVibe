/**
 * Today's Step API Route
 *
 * Proxies requests to the backend API for getting today's journey step.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildJourneyHeaders } from '../../headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId } = await params
    const headers = await buildJourneyHeaders(request)

    const response = await fetch(`${BACKEND_URL}/api/journeys/${journeyId}/today`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching today\'s step:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch today\'s step',
      },
      { status: 500 }
    )
  }
}
