/**
 * Journey Engine Service - Frontend service for the Six Enemies (Shadripu) Journey System.
 *
 * Provides a clean API for interacting with the journey engine backend,
 * including templates, user journeys, steps, and enemy progress tracking.
 */

import type {
  JourneyTemplate,
  JourneyStats,
  DailyStep,
  EnemyProgress,
  EnemyRadarData,
  JourneyDashboard,
  StartJourneyRequest,
  CompleteStepRequest,
  ListTemplatesParams,
  ListJourneysParams,
  TemplateListResponse,
  JourneyListResponse,
  StepCompletionResponse,
  EnemyType,
  ModernExample,
} from '@/types/journeyEngine.types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const JOURNEY_ENGINE_ENDPOINT = '/api/journey-engine';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [502, 503, 504];

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class JourneyEngineError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'JourneyEngineError';
    this.code = code;
    this.statusCode = statusCode;
  }

  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  isMaxJourneysError(): boolean {
    return this.code === 'MAX_ACTIVE_JOURNEYS';
  }
}

// =============================================================================
// HTTP UTILITIES
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const accessToken =
      localStorage.getItem('mindvibe_access_token') || localStorage.getItem('access_token');
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const storedUser = localStorage.getItem('mindvibe_auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as { id?: string };
        if (parsedUser.id) {
          headers['X-Auth-UID'] = parsedUser.id;
        }
      } catch {
        // Ignore
      }
    }

    const legacyUserId = localStorage.getItem('userId');
    if (!headers['X-Auth-UID'] && legacyUserId) {
      headers['X-Auth-UID'] = legacyUserId;
    }
  }

  return headers;
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new JourneyEngineError(
            `Request failed with status ${response.status}`,
            'PARSE_ERROR',
            response.status
          );
        }
        data = {};
      }

      if (!response.ok) {
        const detail = (data as Record<string, unknown>)?.detail;
        const message = typeof detail === 'string' ? detail : `Error ${response.status}`;
        const code = response.status === 400 && message.includes('5 active')
          ? 'MAX_ACTIVE_JOURNEYS'
          : 'API_ERROR';

        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
          await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        throw new JourneyEngineError(message, code, response.status);
      }

      return data as T;
    } catch (error) {
      if (error instanceof JourneyEngineError) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      throw new JourneyEngineError(
        'Network error: Please check your connection',
        'NETWORK_ERROR',
        0
      );
    }
  }

  throw new JourneyEngineError('Request failed after retries', 'MAX_RETRIES', 503);
}

// =============================================================================
// TEMPLATE OPERATIONS
// =============================================================================

/**
 * List available journey templates.
 */
export async function listTemplates(params: ListTemplatesParams = {}): Promise<TemplateListResponse> {
  const searchParams = new URLSearchParams();

  if (params.enemy) searchParams.set('enemy', params.enemy);
  if (params.difficulty !== undefined) searchParams.set('difficulty', String(params.difficulty));
  if (params.is_free !== undefined) searchParams.set('is_free', String(params.is_free));
  if (params.is_featured !== undefined) searchParams.set('is_featured', String(params.is_featured));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${JOURNEY_ENGINE_ENDPOINT}/templates?${queryString}`
    : `${JOURNEY_ENGINE_ENDPOINT}/templates`;

  return apiRequest<TemplateListResponse>('GET', endpoint);
}

/**
 * Get a specific template by ID.
 */
export async function getTemplate(templateId: string): Promise<JourneyTemplate> {
  return apiRequest<JourneyTemplate>('GET', `${JOURNEY_ENGINE_ENDPOINT}/templates/${templateId}`);
}

/**
 * Get featured templates for home display.
 */
export async function getFeaturedTemplates(): Promise<JourneyTemplate[]> {
  const response = await listTemplates({ is_featured: true, limit: 6 });
  return response.templates;
}

/**
 * Get templates by enemy type.
 */
export async function getTemplatesByEnemy(enemy: EnemyType): Promise<JourneyTemplate[]> {
  const response = await listTemplates({ enemy, limit: 10 });
  return response.templates;
}

// =============================================================================
// JOURNEY OPERATIONS
// =============================================================================

/**
 * List user's journeys.
 */
export async function listJourneys(params: ListJourneysParams = {}): Promise<JourneyListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${JOURNEY_ENGINE_ENDPOINT}/journeys?${queryString}`
    : `${JOURNEY_ENGINE_ENDPOINT}/journeys`;

  return apiRequest<JourneyListResponse>('GET', endpoint);
}

/**
 * Get a specific journey.
 */
export async function getJourney(journeyId: string): Promise<JourneyStats> {
  return apiRequest<JourneyStats>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}`);
}

/**
 * Start a new journey from a template.
 */
export async function startJourney(request: StartJourneyRequest): Promise<JourneyStats> {
  return apiRequest<JourneyStats>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys`, request);
}

/**
 * Pause an active journey.
 */
export async function pauseJourney(journeyId: string): Promise<JourneyStats> {
  return apiRequest<JourneyStats>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/pause`);
}

/**
 * Resume a paused journey.
 */
export async function resumeJourney(journeyId: string): Promise<JourneyStats> {
  return apiRequest<JourneyStats>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/resume`);
}

/**
 * Abandon a journey.
 */
export async function abandonJourney(journeyId: string): Promise<void> {
  await apiRequest<void>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/abandon`);
}

// =============================================================================
// STEP OPERATIONS
// =============================================================================

/**
 * Get the current step for a journey.
 */
export async function getCurrentStep(journeyId: string): Promise<DailyStep | null> {
  return apiRequest<DailyStep | null>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/steps/current`);
}

/**
 * Get a specific step by day index.
 */
export async function getStep(journeyId: string, dayIndex: number): Promise<DailyStep> {
  return apiRequest<DailyStep>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/steps/${dayIndex}`);
}

/**
 * Complete a step.
 */
export async function completeStep(
  journeyId: string,
  dayIndex: number,
  request: CompleteStepRequest = {}
): Promise<StepCompletionResponse> {
  return apiRequest<StepCompletionResponse>(
    'POST',
    `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/steps/${dayIndex}/complete`,
    request
  );
}

// =============================================================================
// DASHBOARD OPERATIONS
// =============================================================================

/**
 * Get the user's journey dashboard.
 */
export async function getDashboard(): Promise<JourneyDashboard> {
  return apiRequest<JourneyDashboard>('GET', `${JOURNEY_ENGINE_ENDPOINT}/dashboard`);
}

// =============================================================================
// ENEMY PROGRESS OPERATIONS
// =============================================================================

/**
 * List all enemies with basic info.
 */
export async function listEnemies(): Promise<Array<{ type: EnemyType; name: string; sanskrit: string; description: string }>> {
  return apiRequest('GET', `${JOURNEY_ENGINE_ENDPOINT}/enemies`);
}

/**
 * Get progress for a specific enemy.
 */
export async function getEnemyProgress(enemy: EnemyType): Promise<EnemyProgress> {
  return apiRequest<EnemyProgress>('GET', `${JOURNEY_ENGINE_ENDPOINT}/enemies/${enemy}`);
}

/**
 * Get radar chart data for all enemies.
 */
export async function getEnemyRadar(): Promise<EnemyRadarData> {
  return apiRequest<EnemyRadarData>('GET', `${JOURNEY_ENGINE_ENDPOINT}/enemies/radar`);
}

// =============================================================================
// EXAMPLES OPERATIONS
// =============================================================================

/**
 * Get modern examples for an enemy.
 */
export async function getExamples(enemy: EnemyType, limit: number = 4): Promise<ModernExample[]> {
  return apiRequest<ModernExample[]>('GET', `${JOURNEY_ENGINE_ENDPOINT}/examples/${enemy}?limit=${limit}`);
}

/**
 * Get a random example for an enemy.
 */
export async function getRandomExample(enemy: EnemyType): Promise<ModernExample> {
  return apiRequest<ModernExample>('GET', `${JOURNEY_ENGINE_ENDPOINT}/examples/${enemy}/random`);
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const journeyEngineService = {
  // Templates
  listTemplates,
  getTemplate,
  getFeaturedTemplates,
  getTemplatesByEnemy,

  // Journeys
  listJourneys,
  getJourney,
  startJourney,
  pauseJourney,
  resumeJourney,
  abandonJourney,

  // Steps
  getCurrentStep,
  getStep,
  completeStep,

  // Dashboard
  getDashboard,

  // Enemies
  listEnemies,
  getEnemyProgress,
  getEnemyRadar,

  // Examples
  getExamples,
  getRandomExample,
};

export default journeyEngineService;
