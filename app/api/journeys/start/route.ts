/**
 * Journey Start API Route
 * Proxies to backend with proper error handling and offline fallback
 *
 * This route handles POST /api/journeys/start
 * - Forwards auth headers to backend
 * - Provides graceful degradation when backend is unavailable
 * - Returns proper error responses for auth failures
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Default timeout for backend requests (10 seconds)
const BACKEND_TIMEOUT_MS = 10000

interface StartJourneysRequest {
  journey_ids: string[]
  personalization?: {
    pace?: 'daily' | 'every_other_day' | 'weekly'
    time_budget_minutes?: number
    preferred_tone?: string
    provider_preference?: string
  }
}

interface UserJourney {
  id: string
  template_id: string | null
  template_title: string
  template_slug: string | null
  status: string
  current_day_index: number
  total_days: number
  progress_percentage: number
  started_at: string
  personalization: Record<string, unknown> | null
}

interface ErrorResponse {
  error: string
  message: string
  detail?: string
  _offline?: boolean
}

function createErrorResponse(
  status: number,
  error: string,
  message: string,
  detail?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { error, message, detail },
    { status }
  )
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: StartJourneysRequest
    try {
      body = await request.json()
    } catch {
      return createErrorResponse(400, 'invalid_request', 'Invalid JSON in request body')
    }

    // Validate request
    if (!body.journey_ids || !Array.isArray(body.journey_ids) || body.journey_ids.length === 0) {
      return createErrorResponse(
        400,
        'validation_error',
        'journey_ids must be a non-empty array'
      )
    }

    if (body.journey_ids.length > 5) {
      return createErrorResponse(
        400,
        'validation_error',
        'Maximum 5 journeys can be started at once'
      )
    }

    // Build headers to forward
    const headers = new Headers({
      'Content-Type': 'application/json',
    })

    // Forward authentication headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    const uidHeader = request.headers.get('X-Auth-UID')
    if (uidHeader) {
      headers.set('X-Auth-UID', uidHeader)
    }

    // Forward cookies for httpOnly auth
    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader)
    }

    // Forward CSRF token if present
    const csrfToken = request.headers.get('X-CSRF-Token')
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS)

      const response = await fetch(`${BACKEND_URL}/api/journeys/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      // Handle specific error codes from backend
      if (response.status === 401) {
        return createErrorResponse(
          401,
          'authentication_required',
          'Please log in to start a journey'
        )
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          {
            error: 'premium_feature',
            message: errorData.message || 'This feature requires a premium subscription',
            detail: errorData.detail,
          },
          { status: 403 }
        )
      }

      if (response.status === 404) {
        return createErrorResponse(
          404,
          'templates_not_found',
          'The selected journey templates were not found. Please try selecting different journeys.'
        )
      }

      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          {
            error: 'service_unavailable',
            message: errorData.message || 'Wisdom Journeys is being set up. Please try again in a moment.',
            _offline: true,
          },
          { status: 503 }
        )
      }

      if (!response.ok) {
        // Try to get error details from backend
        let errorMessage = 'Failed to start journeys'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          // Use default message
        }

        console.error(`[journeys/start] Backend error: ${response.status} - ${errorMessage}`)

        return createErrorResponse(
          response.status >= 500 ? 503 : response.status,
          'backend_error',
          errorMessage
        )
      }

      // Success - forward the response
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })

    } catch (error) {
      // Network/timeout errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[journeys/start] Request timeout')
          return NextResponse.json(
            {
              error: 'timeout',
              message: 'Request timed out. The server may be busy. Please try again.',
              _offline: true,
            },
            { status: 504 }
          )
        }

        console.error('[journeys/start] Network error:', error.message)
      }

      // Return offline-compatible error response
      return NextResponse.json(
        {
          error: 'network_error',
          message: 'Unable to connect to the server. Please check your connection and try again.',
          _offline: true,
        },
        { status: 503 }
      )
    }
  } catch (outerError) {
    console.error('[journeys/start] Unexpected error:', outerError)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
