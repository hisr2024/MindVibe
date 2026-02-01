/**
 * Resume Journey API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildJourneyHeaders } from '../../headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { journeyId } = await params
    const headers = await buildJourneyHeaders(request)

    const response = await fetch(`${BACKEND_URL}/api/journeys/${journeyId}/resume`, {
      method: 'POST',
      headers,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error resuming journey:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resume journey' },
      { status: 500 }
    )
  }
}
