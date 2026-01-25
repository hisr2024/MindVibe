/**
 * Enhanced Journeys Service - Multi-journey Wisdom Journey support
 *
 * Provides client-side API calls for the enhanced journey system with:
 * - Multi-journey support
 * - Today's agenda across all active journeys
 * - KIAAN AI-generated step content
 * - Provider tracking
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// =============================================================================
// Types
// =============================================================================

export interface JourneyTemplate {
  id: string
  slug: string
  title: string
  description: string | null
  primary_enemy_tags: string[]
  duration_days: number
  difficulty: number
  is_featured: boolean
  icon_name: string | null
  color_theme: string | null
}

export interface UserJourney {
  id: string
  template_id: string | null
  template_title: string
  template_slug: string | null
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  current_day_index: number
  total_days: number
  progress_percentage: number
  started_at: string
  personalization: Personalization | null
}

export interface Personalization {
  pace?: 'daily' | 'every_other_day' | 'weekly'
  time_budget_minutes?: number
  focus_tags?: string[]
  preferred_tone?: 'gentle' | 'direct' | 'inspiring'
  provider_preference?: 'auto' | 'openai' | 'sarvam' | 'oai_compat'
}

export interface VerseRef {
  chapter: number
  verse: number
}

export interface VerseText {
  chapter: number
  verse: number
  sanskrit?: string
  transliteration?: string
  translation: string
  hindi?: string
  reflection?: string
  themes: string[]
  keywords: string[]
}

export interface Practice {
  name: string
  instructions: string[]
  duration_minutes: number
}

export interface CheckInPrompt {
  scale: string
  label: string
}

export interface KiaanStep {
  step_title: string
  today_focus: string
  verse_refs: VerseRef[]
  teaching: string
  guided_reflection: string[]
  practice: Practice
  micro_commitment: string
  check_in_prompt: CheckInPrompt
  safety_note?: string
  is_safety_response?: boolean
  safety_message?: string
  crisis_resources?: string[]
}

export interface StepState {
  step_state_id: string
  user_journey_id: string
  day_index: number
  kiaan_step: KiaanStep | null
  verse_refs: VerseRef[]
  verse_texts?: VerseText[]
  completed: boolean
  check_in?: { intensity: number; label: string; timestamp: string } | null
  provider_used?: string
  model_used?: string
}

export interface TodayAgendaStep {
  user_journey_id: string
  journey_title: string
  day_index: number
  total_days: number
  step_state_id: string
  kiaan_step: KiaanStep | null
  completed: boolean
  verse_refs: VerseRef[]
  verse_texts?: VerseText[]
}

export interface TodayAgenda {
  steps: TodayAgendaStep[]
  priority_step: TodayAgendaStep | null
  active_journey_count?: number
  message?: string
}

export interface ProviderStatus {
  providers: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
      latency_ms: number | null
      error: string | null
      last_check: string
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try multiple token storage locations
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('mindvibe_token') ||
    sessionStorage.getItem('access_token')
  )
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error ${response.status}`)
  }
  return response.json()
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all available journey templates (catalog)
 */
export async function getCatalog(): Promise<JourneyTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/catalog`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<JourneyTemplate[]>(response)
}

/**
 * Start one or more journeys
 */
export async function startJourneys(
  journeyIds: string[],
  personalization?: Personalization
): Promise<UserJourney[]> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      journey_ids: journeyIds,
      personalization,
    }),
  })
  return handleResponse<UserJourney[]>(response)
}

/**
 * Get all active journeys for the current user
 */
export async function getActiveJourneys(): Promise<UserJourney[]> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/active`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<UserJourney[]>(response)
}

/**
 * Get today's agenda across all active journeys
 */
export async function getTodayAgenda(): Promise<TodayAgenda> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/today`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<TodayAgenda>(response)
}

/**
 * Get or generate today's step for a specific journey
 */
export async function getTodayStep(userJourneyId: string): Promise<StepState> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/${userJourneyId}/today`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<StepState>(response)
}

/**
 * Complete a step with check-in and reflection
 */
export async function completeStep(
  userJourneyId: string,
  dayIndex: number,
  data: {
    check_in?: { intensity: number; label: string }
    reflection_response?: string
  }
): Promise<{
  step_state_id: string
  day_index: number
  completed: boolean
  check_in?: { intensity: number; label: string; timestamp: string }
  journey_completed: boolean
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/journeys/${userJourneyId}/steps/${dayIndex}/complete`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }
  )
  return handleResponse(response)
}

/**
 * Pause a journey
 */
export async function pauseJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/${userJourneyId}/pause`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/**
 * Resume a paused journey
 */
export async function resumeJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/${userJourneyId}/resume`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/**
 * Abandon a journey
 */
export async function abandonJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/${userJourneyId}/abandon`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/**
 * Get journey history (all steps)
 */
export async function getJourneyHistory(
  userJourneyId: string
): Promise<
  {
    day_index: number
    delivered_at: string | null
    completed_at: string | null
    check_in: { intensity: number; label: string; timestamp: string } | null
    verse_refs: VerseRef[]
    provider_used: string | null
  }[]
> {
  const response = await fetch(`${API_BASE_URL}/api/journeys/${userJourneyId}/history`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/**
 * Get AI provider health status (admin)
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch(`${API_BASE_URL}/api/admin/ai/providers/status`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<ProviderStatus>(response)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get enemy tag display name
 */
export function getEnemyDisplayName(tag: string): string {
  const names: Record<string, string> = {
    kama: 'Desire (Kama)',
    krodha: 'Anger (Krodha)',
    lobha: 'Greed (Lobha)',
    moha: 'Attachment (Moha)',
    mada: 'Pride (Mada)',
    matsarya: 'Envy (Matsarya)',
    mixed: 'Mixed Journey',
    general: 'General Wisdom',
  }
  return names[tag.toLowerCase()] || tag
}

/**
 * Get enemy tag color theme
 */
export function getEnemyColor(tag: string): string {
  const colors: Record<string, string> = {
    kama: 'rose',
    krodha: 'red',
    lobha: 'amber',
    moha: 'purple',
    mada: 'orange',
    matsarya: 'emerald',
    mixed: 'indigo',
    general: 'blue',
  }
  return colors[tag.toLowerCase()] || 'gray'
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(level: number): string {
  const labels = ['', 'Beginner', 'Easy', 'Moderate', 'Challenging', 'Advanced']
  return labels[level] || 'Unknown'
}

/**
 * Format duration
 */
export function formatDuration(days: number): string {
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  const weeks = Math.floor(days / 7)
  const remainingDays = days % 7
  if (remainingDays === 0) {
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }
  return `${weeks}w ${remainingDays}d`
}
