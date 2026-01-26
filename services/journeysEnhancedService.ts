/**
 * Enhanced Journeys Service - Multi-journey Wisdom Journey support
 *
 * Provides client-side API calls for the enhanced journey system with:
 * - Multi-journey support
 * - Today's agenda across all active journeys
 * - KIAAN AI-generated step content
 * - Provider tracking
 */

// Use relative path for Vercel proxy (avoids CORS), direct URL only for local dev
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || ''
  }

  const isLocalDev = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1'

  if (isLocalDev && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Production - use relative path for Vercel proxy
  return ''
}

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

/**
 * Journey access information for premium gating
 */
export interface JourneyAccess {
  has_access: boolean
  tier: 'free' | 'trial' | 'basic' | 'premium' | 'enterprise' | 'developer'
  active_journeys: number
  journey_limit: number
  remaining: number
  is_unlimited: boolean
  can_start_more: boolean
  // Trial info
  is_trial: boolean
  trial_days_limit: number  // 0 = no limit, 3 = trial limited to 3 days
  // Upgrade prompts
  upgrade_url: string | null
  upgrade_cta: string | null
}

/**
 * Premium feature error response
 */
export interface PremiumError {
  error: 'feature_not_available' | 'journey_limit_reached' | 'quota_exceeded'
  feature: string
  message: string
  tier: string
  upgrade_url: string
  upgrade_cta: string
  active_count?: number
  journey_limit?: number
}

// =============================================================================
// Helper Functions
// =============================================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try multiple token storage locations (matching lib/api.ts pattern)
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('mindvibe_access_token') ||
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

/**
 * Custom error class for premium feature errors
 */
export class PremiumFeatureError extends Error {
  public readonly isPremiumError = true
  public readonly errorCode: string
  public readonly feature: string
  public readonly tier: string
  public readonly upgradeUrl: string
  public readonly upgradeCta: string
  public readonly activeCount?: number
  public readonly journeyLimit?: number

  constructor(data: PremiumError) {
    super(data.message)
    this.name = 'PremiumFeatureError'
    this.errorCode = data.error
    this.feature = data.feature
    this.tier = data.tier
    this.upgradeUrl = data.upgrade_url
    this.upgradeCta = data.upgrade_cta
    this.activeCount = data.active_count
    this.journeyLimit = data.journey_limit
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))

    // Check for premium feature errors (403 Forbidden)
    if (response.status === 403 && error.detail?.error) {
      const detail = error.detail as PremiumError
      if (
        detail.error === 'feature_not_available' ||
        detail.error === 'journey_limit_reached'
      ) {
        throw new PremiumFeatureError(detail)
      }
    }

    // Check for service unavailable / preview mode (503)
    if (response.status === 503 && error.detail?.error) {
      const detail = error.detail
      // Throw with the error code so frontend can detect it
      throw new Error(`[${detail.error}] ${detail.message}`)
    }

    throw new Error(
      typeof error.detail === 'string'
        ? error.detail
        : error.detail?.message || `HTTP error ${response.status}`
    )
  }
  return response.json()
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Check the current user's access to Wisdom Journeys (premium feature)
 */
export async function getJourneyAccess(): Promise<JourneyAccess> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/access`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<JourneyAccess>(response)
}

// Default journey templates for when backend is unavailable
const DEFAULT_CATALOG_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'tpl_inner_peace',
    slug: 'inner-peace',
    title: 'Journey to Inner Peace',
    description: 'A transformative 7-day exploration of tranquility and letting go of anxiety.',
    primary_enemy_tags: ['krodha', 'moha'],
    duration_days: 7,
    difficulty: 1,
    is_featured: true,
    icon_name: 'peace',
    color_theme: 'emerald',
  },
  {
    id: 'tpl_conquering_desire',
    slug: 'conquering-desire',
    title: 'Conquering Desire (Kama)',
    description: 'Learn to master desires and attachments through ancient wisdom.',
    primary_enemy_tags: ['kama'],
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    icon_name: 'heart',
    color_theme: 'rose',
  },
  {
    id: 'tpl_anger_mastery',
    slug: 'anger-mastery',
    title: 'Mastering Anger (Krodha)',
    description: 'Transform reactive anger into mindful responses.',
    primary_enemy_tags: ['krodha'],
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    icon_name: 'flame',
    color_theme: 'red',
  },
  {
    id: 'tpl_balanced_action',
    slug: 'balanced-action',
    title: 'Wisdom of Balanced Action',
    description: 'Learn Karma Yoga - the art of action without attachment to results.',
    primary_enemy_tags: ['mixed'],
    duration_days: 7,
    difficulty: 1,
    is_featured: true,
    icon_name: 'sparkles',
    color_theme: 'blue',
  },
]

/**
 * Get all available journey templates (catalog)
 */
export async function getCatalog(): Promise<JourneyTemplate[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/journeys/catalog`, {
      method: 'GET',
      headers: getHeaders(),
    })
    // If the response is a server error, return default templates
    if (!response.ok && response.status >= 500) {
      console.warn('Catalog endpoint returned error, using default templates')
      return DEFAULT_CATALOG_TEMPLATES
    }
    const data = await handleResponse<JourneyTemplate[]>(response)
    // If empty array, return defaults
    if (!data || data.length === 0) {
      return DEFAULT_CATALOG_TEMPLATES
    }
    return data
  } catch (error) {
    console.warn('Failed to fetch catalog:', error)
    return DEFAULT_CATALOG_TEMPLATES // Return default templates on errors
  }
}

/**
 * Start one or more journeys
 */
export async function startJourneys(
  journeyIds: string[],
  personalization?: Personalization
): Promise<UserJourney[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/start`, {
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/active`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<UserJourney[]>(response)
}

/**
 * Get today's agenda across all active journeys
 */
export async function getTodayAgenda(): Promise<TodayAgenda> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/today`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse<TodayAgenda>(response)
}

/**
 * Get or generate today's step for a specific journey
 */
export async function getTodayStep(userJourneyId: string): Promise<StepState> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/today`, {
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
    `${getApiBaseUrl()}/api/journeys/${userJourneyId}/steps/${dayIndex}/complete`,
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/pause`, {
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/resume`, {
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/abandon`, {
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/history`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/**
 * Get AI provider health status (admin)
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/ai/providers/status`, {
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

/**
 * Check if an error is a premium feature error
 */
export function isPremiumError(error: unknown): error is PremiumFeatureError {
  return error instanceof PremiumFeatureError
}

/**
 * Get tier badge display info
 */
export function getTierBadge(tier: string): { label: string; color: string; icon: string } {
  switch (tier.toLowerCase()) {
    case 'basic':
      return { label: 'Basic', color: 'blue', icon: 'star' }
    case 'premium':
      return { label: 'Premium', color: 'orange', icon: 'crown' }
    case 'enterprise':
      return { label: 'Enterprise', color: 'purple', icon: 'building' }
    default:
      return { label: 'Free', color: 'gray', icon: 'user' }
  }
}
