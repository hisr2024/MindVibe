/**
 * Journey Engine Service - Frontend service for the Six Enemies (Shadripu) Journey System.
 *
 * Provides a clean API for interacting with the journey engine backend.
 * All types match backend response models in backend/routes/journey_engine.py
 */

import type {
  JourneyTemplate,
  JourneyResponse,
  StepResponse,
  EnemyProgressResponse,
  EnemyRadarData,
  DashboardResponse,
  StartJourneyRequest,
  CompleteStepRequest,
  ListTemplatesParams,
  ListJourneysParams,
  TemplateListResponse,
  JourneyListResponse,
  CompletionResponse,
  ExampleResponse,
  ExampleListResponse,
  EnemyInfoResponse,
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
    return this.code === 'MAX_ACTIVE_JOURNEYS' || this.message.includes('5 active');
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
 * GET /api/journey-engine/templates
 */
export async function listTemplates(params: ListTemplatesParams = {}): Promise<TemplateListResponse> {
  const searchParams = new URLSearchParams();

  if (params.enemy) searchParams.set('enemy', params.enemy);
  if (params.difficulty_max !== undefined) searchParams.set('difficulty_max', String(params.difficulty_max));
  if (params.free_only !== undefined) searchParams.set('free_only', String(params.free_only));
  if (params.featured_only !== undefined) searchParams.set('featured_only', String(params.featured_only));
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
 * GET /api/journey-engine/templates/{template_id}
 */
export async function getTemplate(templateId: string): Promise<JourneyTemplate> {
  return apiRequest<JourneyTemplate>('GET', `${JOURNEY_ENGINE_ENDPOINT}/templates/${templateId}`);
}

/**
 * Get featured templates for home display.
 */
export async function getFeaturedTemplates(): Promise<JourneyTemplate[]> {
  const response = await listTemplates({ featured_only: true, limit: 6 });
  return response.templates;
}

/**
 * Get templates by enemy type.
 */
export async function getTemplatesByEnemy(enemy: string): Promise<JourneyTemplate[]> {
  const response = await listTemplates({ enemy, limit: 10 });
  return response.templates;
}

// =============================================================================
// JOURNEY OPERATIONS
// =============================================================================

/**
 * List user's journeys.
 * GET /api/journey-engine/journeys
 */
export async function listJourneys(params: ListJourneysParams = {}): Promise<JourneyListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status_filter) searchParams.set('status_filter', params.status_filter);
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
 * GET /api/journey-engine/journeys/{journey_id}
 */
export async function getJourney(journeyId: string): Promise<JourneyResponse> {
  return apiRequest<JourneyResponse>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}`);
}

/**
 * Start a new journey from a template.
 * POST /api/journey-engine/journeys
 */
export async function startJourney(request: StartJourneyRequest): Promise<JourneyResponse> {
  return apiRequest<JourneyResponse>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys`, request);
}

/**
 * Pause an active journey.
 * POST /api/journey-engine/journeys/{journey_id}/pause
 */
export async function pauseJourney(journeyId: string): Promise<JourneyResponse> {
  return apiRequest<JourneyResponse>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/pause`);
}

/**
 * Resume a paused journey.
 * POST /api/journey-engine/journeys/{journey_id}/resume
 */
export async function resumeJourney(journeyId: string): Promise<JourneyResponse> {
  return apiRequest<JourneyResponse>('POST', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/resume`);
}

/**
 * Abandon a journey.
 * DELETE /api/journey-engine/journeys/{journey_id}
 */
export async function abandonJourney(journeyId: string): Promise<JourneyResponse> {
  return apiRequest<JourneyResponse>('DELETE', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}`);
}

// =============================================================================
// STEP OPERATIONS
// =============================================================================

/**
 * Get the current step for a journey.
 * GET /api/journey-engine/journeys/{journey_id}/steps/current
 */
export async function getCurrentStep(journeyId: string): Promise<StepResponse | null> {
  return apiRequest<StepResponse | null>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/steps/current`);
}

/**
 * Get a specific step by day index.
 * GET /api/journey-engine/journeys/{journey_id}/steps/{day_index}
 */
export async function getStep(journeyId: string, dayIndex: number): Promise<StepResponse> {
  return apiRequest<StepResponse>('GET', `${JOURNEY_ENGINE_ENDPOINT}/journeys/${journeyId}/steps/${dayIndex}`);
}

/**
 * Complete a step.
 * POST /api/journey-engine/journeys/{journey_id}/steps/{day_index}/complete
 */
export async function completeStep(
  journeyId: string,
  dayIndex: number,
  request: CompleteStepRequest = {}
): Promise<CompletionResponse> {
  return apiRequest<CompletionResponse>(
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
 * GET /api/journey-engine/dashboard
 */
export async function getDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>('GET', `${JOURNEY_ENGINE_ENDPOINT}/dashboard`);
}

// =============================================================================
// ENEMY PROGRESS OPERATIONS
// =============================================================================

/**
 * List all enemies with basic info.
 * GET /api/journey-engine/enemies
 */
export async function listEnemies(): Promise<EnemyInfoResponse[]> {
  return apiRequest<EnemyInfoResponse[]>('GET', `${JOURNEY_ENGINE_ENDPOINT}/enemies`);
}

/**
 * Get progress for a specific enemy.
 * GET /api/journey-engine/enemies/{enemy}
 */
export async function getEnemyProgress(enemy: string): Promise<EnemyProgressResponse | null> {
  return apiRequest<EnemyProgressResponse | null>('GET', `${JOURNEY_ENGINE_ENDPOINT}/enemies/${enemy}`);
}

/**
 * Get radar chart data for all enemies.
 * GET /api/journey-engine/enemies/{enemy}/radar
 * Note: Backend route is /enemies/{enemy}/radar - we call it for each enemy
 * and aggregate, OR we can call dashboard which includes enemy_progress
 */
export async function getEnemyRadar(): Promise<EnemyRadarData> {
  // The dashboard endpoint includes enemy_progress with mastery_level
  // We can extract radar data from there
  const dashboard = await getDashboard();

  const radarData: EnemyRadarData = {
    kama: 0,
    krodha: 0,
    lobha: 0,
    moha: 0,
    mada: 0,
    matsarya: 0,
  };

  for (const progress of dashboard.enemy_progress) {
    const enemy = progress.enemy as keyof EnemyRadarData;
    if (enemy in radarData) {
      radarData[enemy] = progress.mastery_level;
    }
  }

  return radarData;
}

// =============================================================================
// EXAMPLES OPERATIONS
// =============================================================================

/**
 * Get modern examples for an enemy.
 * GET /api/journey-engine/examples/{enemy}
 */
export async function getExamples(enemy: string, limit: number = 4): Promise<ExampleListResponse> {
  return apiRequest<ExampleListResponse>('GET', `${JOURNEY_ENGINE_ENDPOINT}/examples/${enemy}?limit=${limit}`);
}

/**
 * Get a random example for an enemy.
 * GET /api/journey-engine/examples/{enemy}/random
 */
export async function getRandomExample(enemy: string): Promise<ExampleResponse | null> {
  return apiRequest<ExampleResponse | null>('GET', `${JOURNEY_ENGINE_ENDPOINT}/examples/${enemy}/random`);
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
