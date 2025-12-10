/**
 * Centralized API client with error handling and retry logic
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
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
  const url = `${API_BASE_URL}${endpoint}`
  const { timeout = 30000, ...fetchOptions } = options

  // Get current language preference
  const locale = getCurrentLocale();

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
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
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Enhanced error detection
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      
      // Detect specific error scenarios
      if (response.status === 405) {
        errorMessage = 'Method not allowed. The endpoint may not be properly configured.'
      } else if (response.status === 404) {
        errorMessage = 'Endpoint not found. Please check the API configuration.'
      } else if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.'
      } else if (response.status === 0) {
        errorMessage = 'CORS error or network failure. Cannot reach the backend.'
      }
      
      throw new APIError(
        errorMessage,
        response.status,
        response.statusText
      )
    }

    return response
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      // Network errors are typically TypeErrors from fetch
      // Check for CORS-specific errors
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        throw new APIError(
          'CORS error: The backend server is not allowing requests from this origin. Please check CORS configuration.'
        )
      }
      throw new APIError(
        'Cannot connect to KIAAN. Please check your internet connection and ensure the backend server is running.'
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
    // Check for specific error codes
    if (error.status === 405) {
      return 'This feature is not available right now. Our team has been notified.'
    }
    
    if (error.status === 404) {
      return 'The requested service could not be found. Please try again later.'
    }
    
    if (error.status === 503) {
      return 'The service is temporarily unavailable. Please try again in a few moments.'
    }
    
    // Check for CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      const messages = [
        'Cannot reach KIAAN due to configuration issues.',
        '• This is a technical problem on our end',
        '• Please try again later or contact support',
      ]
      return messages.join('\n')
    }
    
    // Check for connection-related errors
    if (error.message.includes('connect') || error.message.includes('network')) {
      const messages = [
        'Cannot reach KIAAN. Please check:',
        '• Your internet connection',
        '• Try refreshing the page',
        '• If the problem persists, the service may be temporarily down',
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
