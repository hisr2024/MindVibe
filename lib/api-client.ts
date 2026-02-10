/**
 * Centralized API client with error handling and retry logic
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public errorCode?: string,
    public upgradeUrl?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface APICallOptions extends RequestInit {
  timeout?: number
}

/**
 * Get current locale from localStorage
 */
export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('preferredLocale') || 'en';
}

/**
 * Get CSRF token from cookie for state-changing requests.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Make an API call with proper error handling
 * @param endpoint API endpoint (e.g., '/api/chat/message')
 * @param options Request options
 * @returns Response object
 * @throws APIError with descriptive message
 */
export async function apiCall(
  endpoint: string,
  options: APICallOptions = {}
): Promise<Response> {
  // Use relative URL for local Next.js API routes, backend URL for others
  // This ensures /api/* paths are handled by local Next.js routes
  const isLocalApiRoute = endpoint.startsWith('/api/')
  const url = isLocalApiRoute ? endpoint : `${API_BASE_URL}${endpoint}`
  const { timeout = 30000, ...fetchOptions } = options

  // Get current language preference
  const locale = getCurrentLocale();

  // Add CSRF token for state-changing requests
  const csrfHeaders: Record<string, string> = {}
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      csrfHeaders['X-CSRF-Token'] = csrfToken
    }
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      ...csrfHeaders,
      ...options.headers,
    },
    ...fetchOptions,
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      ...defaultOptions,
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Enhanced error detection
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      let errorCode: string | undefined
      let upgradeUrl: string | undefined

      // Try to parse response body for structured error details
      try {
        const errorBody = await response.json()
        const detail = errorBody?.detail
        if (typeof detail === 'object' && detail !== null) {
          errorMessage = detail.message || errorMessage
          errorCode = detail.error
          upgradeUrl = detail.upgrade_url
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else if (errorBody?.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // JSON parsing failed, use status-based messages
      }

      // Detect specific error scenarios
      if (response.status === 429 && !errorCode) {
        errorMessage = errorMessage.includes('quota')
          ? errorMessage
          : "You've reached your usage limit. Please upgrade your plan or wait for your quota to reset."
        errorCode = errorCode || 'quota_exceeded'
      } else if (response.status === 403 && !errorCode) {
        errorMessage = errorMessage.includes('feature')
          ? errorMessage
          : 'This feature is not available on your current plan. Upgrade to unlock it.'
        errorCode = errorCode || 'feature_locked'
      } else if (response.status === 405) {
        errorMessage = 'Method not allowed. The endpoint may not be properly configured.'
      } else if (response.status === 404) {
        errorMessage = 'Endpoint not found. Please check the API configuration.'
      } else if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.'
      }

      throw new APIError(
        errorMessage,
        response.status,
        response.statusText,
        errorCode,
        upgradeUrl
      )
    }

    return response
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      // TypeError from fetch typically indicates network failures (e.g., no internet, DNS failure, connection refused)
      throw new APIError(
        'Cannot connect to KIAAN. Please check your internet connection or try again in a few moments.'
      )
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timed out after 30 seconds. The server may be overloaded or unreachable.')
    }

    // Re-throw APIError as-is
    if (error instanceof APIError) {
      throw error
    }

    // Handle unknown errors
    throw new APIError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    )
  }
}

/**
 * Make an API call with automatic retry logic
 * @param endpoint API endpoint
 * @param options Request options
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @returns Response object
 * @throws APIError after all retries exhausted
 */
export async function apiCallWithRetry(
  endpoint: string,
  options: APICallOptions = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: APIError | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall(endpoint, options)
    } catch (error) {
      lastError = error instanceof APIError ? error : new APIError(
        error instanceof Error ? error.message : 'Unknown error'
      )

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
        if (lastError.status !== 408 && lastError.status !== 429) {
          throw lastError
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new APIError('All retry attempts failed')
}

/**
 * Helper to get user-friendly error messages
 * @param error Error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    // Quota exceeded (429)
    if (error.status === 429 || error.errorCode === 'quota_exceeded') {
      return error.message
    }

    // Feature locked (403)
    if (error.status === 403 || error.errorCode === 'feature_locked') {
      return error.message
    }

    // Check for specific error codes
    if (error.status === 405) {
      return 'This operation is not supported. Please try a different action.'
    }

    if (error.status === 404) {
      return 'The requested service could not be found. Please try again later.'
    }

    if (error.status === 503) {
      return 'The service is temporarily unavailable. Please try again in a few moments.'
    }

    // Check for connection-related errors
    if (error.message.includes('connect') || error.message.includes('network')) {
      const messages = [
        'Cannot reach KIAAN.',
        '• Check your internet connection',
        '• Try again in a few moments',
        '• If the problem persists, the service may be down',
      ]
      return messages.join('\n')
    }

    // Check for timeout errors
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      return 'The request is taking longer than expected. The service may be busy. Please try again.'
    }

    // Return the error message directly for other API errors
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if an error is a quota exceeded error
 */
export function isQuotaExceeded(error: unknown): boolean {
  return error instanceof APIError && (error.status === 429 || error.errorCode === 'quota_exceeded')
}

/**
 * Check if an error is a feature locked error
 */
export function isFeatureLocked(error: unknown): boolean {
  return error instanceof APIError && (error.status === 403 || error.errorCode === 'feature_locked')
}

/**
 * Get the upgrade URL from an error, if available
 */
export function getUpgradeUrl(error: unknown): string | undefined {
  return error instanceof APIError ? error.upgradeUrl : undefined
}

/**
 * Get a brief error message from an error object for inline display
 * @param error Error object
 * @returns Brief error message suitable for UI display
 */
export function getBriefErrorMessage(error: unknown): string {
  // For APIError, use the status code directly
  if (error instanceof APIError) {
    if (error.status === 405) {
      return 'This operation is not supported. Please try a different action.'
    }
    if (error.status === 404) {
      return 'Service not found. Please try again later.'
    }
    if (error.status === 503) {
      return 'Service temporarily unavailable. Please try again in a few moments.'
    }
  }
  
  // For Error instances, check message content
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    
    // Check for timeout
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'Request taking too long. Service may be busy. Please try again.'
    }
    
    // Check for network/connection
    if (msg.includes('network') || msg.includes('connect')) {
      return 'Cannot reach service. Please check your connection and try again.'
    }
    
    // Return original message if no pattern matched
    return error.message
  }
  
  return 'An error occurred'
}
