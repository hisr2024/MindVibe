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
}

/**
 * Parse error response from API.
 */
function parseErrorResponse(response: Response, body: unknown): JourneyServiceError {
  if (typeof body === 'object' && body !== null) {
    const detail = (body as Record<string, unknown>).detail;
    if (typeof detail === 'object' && detail !== null) {
      const apiError = detail as ApiError;
      return new JourneyServiceError(
        apiError.message || 'An error occurred',
        apiError.error || 'API_ERROR',
        response.status
      );
    }
    if (typeof detail === 'string') {
      return new JourneyServiceError(detail, 'API_ERROR', response.status);
    }
  }

  return new JourneyServiceError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    response.status
  );
}

// =============================================================================
// HTTP UTILITIES
// =============================================================================

/**
 * Get authentication headers.
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Try to get user ID from localStorage (for X-Auth-UID header)
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    if (userId) {
      headers['X-Auth-UID'] = userId;
    }
  }

  return headers;
}

/**
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
    credentials: 'include',
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw parseErrorResponse(response, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof JourneyServiceError) {
      throw error;
    }

    // Network or parsing error
    throw new JourneyServiceError(
      'Network error: Please check your connection',
      'NETWORK_ERROR',
      0
    );
  }
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
  return apiRequest<Journey>('GET', `${JOURNEYS_ENDPOINT}/${id}`);
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
  return apiRequest<Journey>('PUT', `${JOURNEYS_ENDPOINT}/${id}`, data);
}

/**
 * Delete a journey.
 */
export async function deleteJourney(id: string): Promise<void> {
  await apiRequest<void>('DELETE', `${JOURNEYS_ENDPOINT}/${id}`);
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
