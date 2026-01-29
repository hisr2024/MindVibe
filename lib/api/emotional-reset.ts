/**
 * Emotional Reset API Service
 * Client-side API integration for KIAAN Emotional Reset feature
 */

import type {
  SessionResponse,
  StepResponse,
  SessionData,
  CompleteResponse,
  HealthCheckResponse,
} from '@/types/emotional-reset.types'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Get CSRF token from cookie.
 * The CSRF token is set by the backend on GET requests and must be included
 * in the X-CSRF-Token header for state-changing requests (POST, PUT, PATCH, DELETE).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Start a new emotional reset session
 * @param token - Optional authentication token
 * @returns Promise with session data
 */
export async function startEmotionalReset(token?: string): Promise<SessionResponse> {
  const csrfToken = getCsrfToken()
  const response = await fetch(`${getApiUrl()}/api/emotional-reset/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.detail || 'Failed to start session')
  }

  return response.json()
}

/**
 * Process a step in the emotional reset flow
 * @param sessionId - Current session ID
 * @param step - Current step number (1-7)
 * @param input - Optional user input (required for step 1)
 * @param token - Optional authentication token
 * @returns Promise with step response data
 */
export async function processStep(
  sessionId: string,
  step: number,
  input?: string,
  token?: string
): Promise<StepResponse> {
  const csrfToken = getCsrfToken()
  const response = await fetch(`${getApiUrl()}/api/emotional-reset/step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    credentials: 'include',
    body: JSON.stringify({
      session_id: sessionId,
      current_step: step,
      user_input: step === 1 ? input : null,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    
    // Check for crisis detection
    if (data.crisis_detected) {
      return {
        ...data,
        crisis_detected: true,
        crisis_response: data.crisis_response,
      } as StepResponse
    }
    
    throw new Error(data.detail || 'Failed to process step')
  }

  return response.json()
}

/**
 * Get existing session data for resume
 * @param sessionId - Session ID to retrieve
 * @param token - Optional authentication token
 * @returns Promise with session data
 */
export async function getSession(
  sessionId: string,
  token?: string
): Promise<SessionData> {
  const response = await fetch(
    `${getApiUrl()}/api/emotional-reset/session/${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.detail || 'Failed to get session')
  }

  return response.json()
}

/**
 * Complete the emotional reset session
 * @param sessionId - Session ID to complete
 * @param token - Optional authentication token
 * @returns Promise with completion response
 */
export async function completeSession(
  sessionId: string,
  token?: string
): Promise<CompleteResponse> {
  const csrfToken = getCsrfToken()
  const response = await fetch(`${getApiUrl()}/api/emotional-reset/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    credentials: 'include',
    body: JSON.stringify({
      session_id: sessionId,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.detail || 'Failed to complete session')
  }

  return response.json()
}

/**
 * Check the health of the emotional reset service
 * @returns Promise with health check response
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${getApiUrl()}/api/emotional-reset/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Health check failed')
  }

  return response.json()
}
