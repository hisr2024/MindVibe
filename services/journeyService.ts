/**
 * Journey Service - Frontend service for the Wisdom Journeys feature.
 *
 * Provides a clean API for interacting with the journey backend,
 * including proper error handling, caching, and offline support.
 */

import type {
  JourneyTemplate,
  Journey,
  JourneyStep,
  AgendaItem,
  JourneyAccess,
  CatalogResponse,
  ActiveJourneysResponse,
  TodayAgendaResponse,
  JourneyResponse,
  StepResponse,
  AccessResponse,
  StartJourneyRequest,
  CompleteStepRequest,
  JourneyPersonalization,
} from '@/types/journey.types';
import { apiFetch } from '@/lib/api';

// =============================================================================
// CONFIGURATION
// =============================================================================
const JOURNEYS_ENDPOINT = '/api/journeys';

// Cache duration in milliseconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

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
function parseErrorResponse(response: Response, body: Record<string, unknown>): JourneyServiceError {
  const detail = body.detail as { error?: string; message?: string } | string | undefined;

  if (typeof detail === 'object' && detail !== null) {
    return new JourneyServiceError(
      detail.message || 'An error occurred',
      detail.error || 'API_ERROR',
      response.status
    );
  }

  if (typeof detail === 'string') {
    return new JourneyServiceError(detail, 'API_ERROR', response.status);
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
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await apiFetch(endpoint, options, getAuthUid());
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

/**
 * Get cached data or fetch from API.
 */
async function cachedRequest<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  skipCache: boolean = false
): Promise<T> {
  // Check cache first
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Update cache
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear cache for a specific pattern or all cache.
 */
function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// =============================================================================
// CATALOG METHODS
// =============================================================================

/**
 * Get all available journey templates.
 */
export async function getCatalog(skipCache: boolean = false): Promise<JourneyTemplate[]> {
  return cachedRequest<JourneyTemplate[]>(
    'catalog',
    async () => {
      const response = await apiRequest<CatalogResponse>('GET', `${JOURNEYS_ENDPOINT}/catalog`);
      return response.data;
    },
    skipCache
  );
}

/**
 * Get a specific template by slug.
 */
export async function getTemplateBySlug(slug: string): Promise<JourneyTemplate | null> {
  const catalog = await getCatalog();
  return catalog.find(t => t.slug === slug) || null;
}

/**
 * Get featured templates.
 */
export async function getFeaturedTemplates(): Promise<JourneyTemplate[]> {
  const catalog = await getCatalog();
  return catalog.filter(t => t.is_featured);
}

/**
 * Get free templates.
 */
export async function getFreeTemplates(): Promise<JourneyTemplate[]> {
  const catalog = await getCatalog();
  return catalog.filter(t => t.is_free);
}

// =============================================================================
// USER JOURNEY METHODS
// =============================================================================

/**
 * Get user's active journeys.
 */
export async function getActiveJourneys(skipCache: boolean = false): Promise<Journey[]> {
  return cachedRequest<Journey[]>(
    'active-journeys',
    async () => {
      const response = await apiRequest<ActiveJourneysResponse>('GET', `${JOURNEYS_ENDPOINT}/active`);
      return response.data;
    },
    skipCache
  );
}

/**
 * Get a specific journey by ID.
 */
export async function getJourney(journeyId: string): Promise<Journey> {
  const response = await apiRequest<JourneyResponse>('GET', `${JOURNEYS_ENDPOINT}/${journeyId}`);
  if (!response.data) {
    throw new JourneyServiceError('Journey not found', 'JOURNEY_NOT_FOUND', 404);
  }
  return response.data;
}

/**
 * Start a new journey.
 */
export async function startJourney(
  templateSlug: string,
  personalization?: JourneyPersonalization
): Promise<Journey> {
  const request: StartJourneyRequest = {
    template_slug: templateSlug,
    personalization,
  };

  const response = await apiRequest<JourneyResponse>('POST', `${JOURNEYS_ENDPOINT}/start`, request);

  // Clear cache since journeys changed
  clearCache('active-journeys');

  if (!response.data) {
    throw new JourneyServiceError('Failed to start journey', 'START_ERROR', 500);
  }

  return response.data;
}

/**
 * Pause a journey.
 */
export async function pauseJourney(journeyId: string): Promise<Journey> {
  const response = await apiRequest<JourneyResponse>('POST', `${JOURNEYS_ENDPOINT}/${journeyId}/pause`);

  // Clear cache since journey status changed
  clearCache('active-journeys');

  if (!response.data) {
    throw new JourneyServiceError('Failed to pause journey', 'PAUSE_ERROR', 500);
  }

  return response.data;
}

/**
 * Resume a paused journey.
 */
export async function resumeJourney(journeyId: string): Promise<Journey> {
  const response = await apiRequest<JourneyResponse>('POST', `${JOURNEYS_ENDPOINT}/${journeyId}/resume`);

  // Clear cache since journey status changed
  clearCache('active-journeys');

  if (!response.data) {
    throw new JourneyServiceError('Failed to resume journey', 'RESUME_ERROR', 500);
  }

  return response.data;
}

/**
 * Abandon a journey.
 */
export async function abandonJourney(journeyId: string): Promise<Journey> {
  const response = await apiRequest<JourneyResponse>('POST', `${JOURNEYS_ENDPOINT}/${journeyId}/abandon`);

  // Clear cache since journey status changed
  clearCache('active-journeys');

  if (!response.data) {
    throw new JourneyServiceError('Failed to abandon journey', 'ABANDON_ERROR', 500);
  }

  return response.data;
}

// =============================================================================
// STEP METHODS
// =============================================================================

/**
 * Get today's step for a journey.
 */
export async function getTodayStep(journeyId: string): Promise<JourneyStep> {
  const response = await apiRequest<StepResponse>('GET', `${JOURNEYS_ENDPOINT}/${journeyId}/today`);

  if (!response.data) {
    throw new JourneyServiceError('Failed to get today\'s step', 'FETCH_ERROR', 500);
  }

  return response.data;
}

/**
 * Complete a journey step.
 */
export async function completeStep(
  journeyId: string,
  dayIndex: number,
  reflection?: string,
  checkIn?: { intensity?: number; label?: string }
): Promise<Journey> {
  const request: CompleteStepRequest = {
    reflection,
    check_in: checkIn,
  };

  const response = await apiRequest<JourneyResponse>(
    'POST',
    `${JOURNEYS_ENDPOINT}/${journeyId}/steps/${dayIndex}/complete`,
    request
  );

  // Clear cache since journey progress changed
  clearCache('active-journeys');

  if (!response.data) {
    throw new JourneyServiceError('Failed to complete step', 'COMPLETE_ERROR', 500);
  }

  return response.data;
}

// =============================================================================
// AGENDA METHODS
// =============================================================================

/**
 * Get today's agenda for all active journeys.
 */
export async function getTodayAgenda(skipCache: boolean = false): Promise<AgendaItem[]> {
  return cachedRequest<AgendaItem[]>(
    'today-agenda',
    async () => {
      const response = await apiRequest<TodayAgendaResponse>('GET', `${JOURNEYS_ENDPOINT}/today`);
      return response.data;
    },
    skipCache
  );
}

// =============================================================================
// ACCESS METHODS
// =============================================================================

/**
 * Check user's journey access and limits.
 */
export async function checkAccess(): Promise<JourneyAccess> {
  const response = await apiRequest<AccessResponse>('GET', `${JOURNEYS_ENDPOINT}/access`);

  if (!response.data) {
    throw new JourneyServiceError('Failed to check access', 'ACCESS_ERROR', 500);
  }

  return response.data;
}

/**
 * Check if user can start a new journey.
 */
export async function canStartJourney(): Promise<boolean> {
  try {
    const access = await checkAccess();
    return access.has_access && access.remaining_slots > 0;
  } catch {
    return false;
  }
}

// =============================================================================
// UTILITY METHODS
// =============================================================================

/**
 * Get the icon for an inner enemy tag.
 */
export function getInnerEnemyIcon(tag: string): string {
  const icons: Record<string, string> = {
    kama: '❤️',      // Desire
    krodha: '🔥',    // Anger
    lobha: '💰',     // Greed
    moha: '🌀',      // Attachment
    mada: '👑',      // Ego
    matsarya: '👀',  // Envy
    mixed: '🔄',     // Mixed
    general: '🕉️',   // General
  };
  return icons[tag] || '🧘';
}

/**
 * Get the display name for an inner enemy tag.
 */
export function getInnerEnemyName(tag: string): string {
  const names: Record<string, string> = {
    kama: 'Desire (Kama)',
    krodha: 'Anger (Krodha)',
    lobha: 'Greed (Lobha)',
    moha: 'Attachment (Moha)',
    mada: 'Ego (Mada)',
    matsarya: 'Envy (Matsarya)',
    mixed: 'Combined Journey',
    general: 'General Wisdom',
  };
  return names[tag] || tag;
}

/**
 * Calculate estimated completion date for a journey.
 */
export function getEstimatedCompletionDate(journey: Journey): Date | null {
  if (!journey.started_at || journey.status !== 'active') {
    return null;
  }

  const startDate = new Date(journey.started_at);
  const remainingDays = journey.total_days - journey.completed_days;
  const completionDate = new Date(startDate);
  completionDate.setDate(completionDate.getDate() + remainingDays);

  return completionDate;
}

/**
 * Format progress percentage for display.
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

/**
 * Get progress color based on percentage.
 */
export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'text-green-500';
  if (progress >= 50) return 'text-yellow-500';
  if (progress >= 25) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Clear all journey cache.
 */
export function clearJourneyCache(): void {
  clearCache();
}

// =============================================================================
// EXPORTS
// =============================================================================

export const journeyService = {
  // Catalog
  getCatalog,
  getTemplateBySlug,
  getFeaturedTemplates,
  getFreeTemplates,

  // User journeys
  getActiveJourneys,
  getJourney,
  startJourney,
  pauseJourney,
  resumeJourney,
  abandonJourney,

  // Steps
  getTodayStep,
  completeStep,

  // Agenda
  getTodayAgenda,

  // Access
  checkAccess,
  canStartJourney,

  // Utilities
  getInnerEnemyIcon,
  getInnerEnemyName,
  getEstimatedCompletionDate,
  formatProgress,
  getProgressColor,
  clearJourneyCache,
};

export default journeyService;
