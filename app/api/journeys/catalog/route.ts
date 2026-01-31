/**
 * Journey Catalog API Route
 *
 * Proxies requests to the backend API for getting the journey catalog.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/journeys/catalog`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching journey catalog:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        count: 0,
        error: 'Failed to fetch journey catalog',
      },
      { status: 500 }
    )
  }
}
