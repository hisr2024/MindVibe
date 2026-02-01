/**
 * Journey Service - Frontend service for Personal Journeys CRUD operations.
 *
 * Provides a clean API for interacting with the journeys backend,
 * including proper error handling and type safety.
 */

import type {
  Journey,
  JourneyListResponse,
  CreateJourneyRequest,
  UpdateJourneyRequest,
  ListJourneysParams,
  ApiError,
} from '@/types/journey.types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const JOURNEYS_ENDPOINT = '/api/journeys';

// Retry configuration for transient failures
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [502, 503, 504]; // Bad Gateway, Service Unavailable, Gateway Timeout

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Custom error class for journey service errors.
 */
export class JourneyServiceError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'JourneyServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }

  /** Check if this error indicates authentication is required */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /** Check if this error indicates forbidden access */
  isForbiddenError(): boolean {
    return this.statusCode === 403;
  }

  /** Check if this error indicates resource not found */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /** Check if this error is a validation error */
  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  /** Check if this error is a server error that might be transient */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Specific error for 404 Not Found.
 */
export class JourneyNotFoundError extends JourneyServiceError {
  constructor(journeyId: string) {
    super(`Journey not found: ${journeyId}`, 'JOURNEY_NOT_FOUND', 404);
    this.name = 'JourneyNotFoundError';
  }
}

/**
 * Specific error for 403 Forbidden.
 */
export class JourneyAuthorizationError extends JourneyServiceError {
  constructor(message: string = 'You are not authorized to access this journey') {
    super(message, 'UNAUTHORIZED', 403);
    this.name = 'JourneyAuthorizationError';
  }
}

/**
 * Specific error for 400 Validation errors.
 */
export class JourneyValidationError extends JourneyServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'JourneyValidationError';
  }
}

/**
 * Parse error response from API and return appropriate error type.
 */
function parseErrorResponse(
  response: Response,
  body: unknown,
  journeyId?: string
): JourneyServiceError {
  let message = 'An unexpected error occurred';
  let code = 'UNKNOWN_ERROR';

  if (typeof body === 'object' && body !== null) {
    const detail = (body as Record<string, unknown>).detail;
    if (typeof detail === 'object' && detail !== null) {
      const apiError = detail as ApiError;
      message = apiError.message || message;
      code = apiError.error || code;
    } else if (typeof detail === 'string') {
      message = detail;
      code = 'API_ERROR';
    }
  }

  // Return specific error types based on status code
  switch (response.status) {
    case 400:
      return new JourneyValidationError(message);
    case 401:
      return new JourneyServiceError(
        'Please sign in to access your journeys',
        'UNAUTHORIZED',
        401
      );
    case 403:
      return new JourneyAuthorizationError(message);
    case 404:
      return new JourneyNotFoundError(journeyId || 'unknown');
    case 405:
      return new JourneyServiceError(
        'This action is not allowed',
        'METHOD_NOT_ALLOWED',
        405
      );
    case 429:
      return new JourneyServiceError(
        'Too many requests. Please wait a moment and try again.',
        'RATE_LIMITED',
        429
      );
    case 500:
      return new JourneyServiceError(
        'Server error. Please try again later.',
        'SERVER_ERROR',
        500
      );
    case 502:
      return new JourneyServiceError(
        'Service temporarily unavailable. Retrying...',
        'BAD_GATEWAY',
        502
      );
    case 503:
      return new JourneyServiceError(
        'Service temporarily unavailable. Retrying...',
        'SERVICE_UNAVAILABLE',
        503
      );
    case 504:
      return new JourneyServiceError(
        'Request timed out. Please try again.',
        'GATEWAY_TIMEOUT',
        504
      );
    default:
      return new JourneyServiceError(message, code, response.status);
  }
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a status code is retryable.
 */
function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(status);
}

// =============================================================================
// HTTP UTILITIES
// =============================================================================

/**
 * Get auth UID from local storage for X-Auth-UID fallback.
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach bearer token from localStorage (fallback for auth cookie)
  if (typeof window !== 'undefined') {
    const accessToken =
      localStorage.getItem('mindvibe_access_token') || localStorage.getItem('access_token');
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Try to get user ID from stored auth user (for X-Auth-UID header)
    const storedUser = localStorage.getItem('mindvibe_auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as { id?: string };
        if (parsedUser.id) {
          headers['X-Auth-UID'] = parsedUser.id;
        }
      } catch {
        // Ignore malformed storage entries
      }
    }

    // Legacy fallback
    const legacyUserId = localStorage.getItem('userId');
    if (!headers['X-Auth-UID'] && legacyUserId) {
      headers['X-Auth-UID'] = legacyUserId;
    }
  }

  return headers;
}

/**
 * Get auth UID from local storage for API fallback.
 */
function getAuthUid(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedUser = localStorage.getItem('mindvibe_auth_user');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser) as { id?: string };
      if (parsedUser.id) {
        return parsedUser.id;
      }
    } catch {
      // Ignore malformed storage entries
    }
  }

  const legacyUserId = localStorage.getItem('userId');
  if (legacyUserId) {
    return legacyUserId;
  }

  return undefined;
}

/**
 * Make an authenticated API request with retry logic for transient failures.
 *
 * Automatically retries on 502, 503, 504 errors with exponential backoff.
 * Maximum 3 retries with delays of 1s, 2s, 4s.
 */
async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: { journeyId?: string }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let lastError: JourneyServiceError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const requestOptions: RequestInit = {
      method,
      headers: getAuthHeaders(),
      credentials: 'include',
    };

    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // Try to parse JSON response
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails on error response, create error with status
        if (!response.ok) {
          throw new JourneyServiceError(
            `Request failed with status ${response.status}`,
            'PARSE_ERROR',
            response.status
          );
        }
        data = {};
      }

      if (!response.ok) {
        const error = parseErrorResponse(response, data, options?.journeyId);

        // Only retry on retryable status codes and if we have retries left
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          lastError = error;
          const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[JourneyService] Request failed with ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await sleep(delayMs);
          continue;
        }

        throw error;
      }

      return data as T;
    } catch (error) {
      if (error instanceof JourneyServiceError) {
        // If it's a retryable error and we have retries left, continue
        if (isRetryableStatus(error.statusCode) && attempt < MAX_RETRIES) {
          lastError = error;
          const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[JourneyService] Request failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await sleep(delayMs);
          continue;
        }
        throw error;
      }

      // Network error - retry with backoff
      if (attempt < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[JourneyService] Network error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(delayMs);
        lastError = new JourneyServiceError(
          'Network error: Please check your connection',
          'NETWORK_ERROR',
          0
        );
        continue;
      }

      // Final attempt failed with network error
      throw new JourneyServiceError(
        'Network error: Please check your connection and try again',
        'NETWORK_ERROR',
        0
      );
    }
  }

  // Should not reach here, but just in case
  throw lastError || new JourneyServiceError(
    'Request failed after multiple retries',
    'MAX_RETRIES_EXCEEDED',
    503
  );
}

// =============================================================================
// JOURNEY CRUD OPERATIONS
// =============================================================================

/**
 * List journeys with optional filters and pagination.
 */
export async function listJourneys(params: ListJourneysParams = {}): Promise<JourneyListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const endpoint = queryString ? `${JOURNEYS_ENDPOINT}?${queryString}` : JOURNEYS_ENDPOINT;

  return apiRequest<JourneyListResponse>('GET', endpoint);
}

/**
 * Get a single journey by ID.
 */
export async function getJourney(id: string): Promise<Journey> {
  return apiRequest<Journey>('GET', `${JOURNEYS_ENDPOINT}/${id}`, undefined, { journeyId: id });
}

/**
 * Create a new journey.
 */
export async function createJourney(data: CreateJourneyRequest): Promise<Journey> {
  return apiRequest<Journey>('POST', JOURNEYS_ENDPOINT, data);
}

/**
 * Update an existing journey.
 */
export async function updateJourney(id: string, data: UpdateJourneyRequest): Promise<Journey> {
  return apiRequest<Journey>('PUT', `${JOURNEYS_ENDPOINT}/${id}`, data, { journeyId: id });
}

/**
 * Delete a journey.
 */
export async function deleteJourney(id: string): Promise<void> {
  await apiRequest<void>('DELETE', `${JOURNEYS_ENDPOINT}/${id}`, undefined, { journeyId: id });
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const journeyService = {
  list: listJourneys,
  get: getJourney,
  create: createJourney,
  update: updateJourney,
  delete: deleteJourney,
};

export default journeyService;
