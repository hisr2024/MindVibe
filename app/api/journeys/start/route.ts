/**
 * Journey Start API Route
 * Proxies to backend with proper error handling, retry logic, and offline fallback
 *
 * This route handles POST /api/journeys/start
 * - Forwards auth headers to backend
 * - Implements retry with exponential backoff for transient failures
 * - Provides graceful degradation when backend is unavailable
 * - Returns proper error responses for auth failures
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Default timeout for backend requests (10 seconds)
const BACKEND_TIMEOUT_MS = 10000

// Retry configuration for transient failures
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500 // Start with 500ms, then 1000ms, then 2000ms

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if an error is retryable (transient)
 */
function isRetryableError(status: number): boolean {
  // Retry on 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
  return status === 502 || status === 503 || status === 504
}

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

function createQueueResponse(
  message: string,
  error = 'service_unavailable',
  retryAfter = 30
): NextResponse<ErrorResponse & { _can_queue?: boolean; _retry_after?: number }> {
  return NextResponse.json(
    {
      error,
      message,
      _offline: true,
      _can_queue: true,
      _retry_after: retryAfter,
    },
    { status: 202 }
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

    // Retry loop with exponential backoff for transient failures
    let lastError: Error | null = null
    let lastStatus = 0

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Wait before retry (skip on first attempt)
      if (attempt > 0) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
        console.log(`[journeys/start] Retry attempt ${attempt}/${MAX_RETRIES} after ${backoffMs}ms`)
        await sleep(backoffMs)
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
        lastStatus = response.status

        // Handle specific error codes from backend (non-retryable)
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

        // Check if this is a retryable error and we have retries left
        if (isRetryableError(response.status) && attempt < MAX_RETRIES) {
          console.warn(`[journeys/start] Retryable error ${response.status}, will retry...`)
          continue // Try again
        }

        // No more retries for 503 - return queue-friendly response
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}))
          return createQueueResponse(
            errorData.message || 'Wisdom Journeys is being set up. Please try again in a moment.',
            'service_unavailable',
            30
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

          if (response.status >= 500) {
            return createQueueResponse(errorMessage, 'backend_error', 60)
          }

          return createErrorResponse(
            response.status,
            'backend_error',
            errorMessage
          )
        }

        // Success - forward the response
        const data = await response.json()
        if (attempt > 0) {
          console.log(`[journeys/start] Success after ${attempt + 1} attempts`)
        }
        return NextResponse.json(data, { status: 200 })

      } catch (error) {
        lastError = error as Error

        // Network/timeout errors - potentially retryable
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`[journeys/start] Request timeout on attempt ${attempt + 1}`)
            // Timeouts are retryable
            if (attempt < MAX_RETRIES) {
              continue
            }
            return createQueueResponse(
              'Request timed out. The server may be busy. Please try again.',
              'timeout',
              30
            )
          }

          console.warn(`[journeys/start] Network error on attempt ${attempt + 1}:`, error.message)
          // Network errors are retryable
          if (attempt < MAX_RETRIES) {
            continue
          }
        }
      }
    }

    // All retries exhausted
    console.error(`[journeys/start] All ${MAX_RETRIES + 1} attempts failed. Last status: ${lastStatus}, Last error: ${lastError?.message}`)

    // Return offline-compatible error response with queue capability
    return createQueueResponse(
      'Unable to connect to the server after multiple attempts. Your journey will be queued and started when connection is restored.',
      'network_error',
      60
    )
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
