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
  is_free: boolean  // Free access for all users (one journey should be free for testing)
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

/**
 * A reference to a Gita verse (chapter and verse number only).
 * Matches Python: backend/services/gita_corpus_adapter.py::VerseReference
 */
export interface VerseReference {
  chapter: number
  verse: number
}

// Alias for backward compatibility
export type VerseRef = VerseReference

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
    localStorage.getItem('mindvibe_access_token') ||  // Primary - set by useAuth hook
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('mindvibe_token') ||
    sessionStorage.getItem('access_token')
  )
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null

  // Try to get user ID from stored auth data
  const userJson = localStorage.getItem('mindvibe_auth_user')
  if (userJson) {
    try {
      const user = JSON.parse(userJson)
      return user.id || null
    } catch {
      return null
    }
  }
  return null
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Backward compatibility: Also check localStorage for tokens during migration
  // Note: httpOnly cookies are sent automatically with credentials: 'include'
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Also add X-Auth-UID as fallback (backend supports both methods)
  const userId = getUserId()
  if (userId) {
    headers['X-Auth-UID'] = userId
  }

  return headers
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
 * Standard fetch options with credentials for httpOnly cookie authentication
 * and CSRF protection for state-changing requests.
 */
function getFetchOptions(options: RequestInit = {}): RequestInit {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers as HeadersInit || {})

  // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }
  }

  return {
    ...options,
    headers,
    credentials: 'include', // Required for httpOnly cookie authentication
  }
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

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  public readonly isAuthError = true
  public readonly statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = statusCode
  }
}

/**
 * Custom error class for service unavailable errors
 */
export class ServiceUnavailableError extends Error {
  public readonly isServiceError = true
  public readonly errorCode: string

  constructor(errorCode: string, message: string) {
    super(message)
    this.name = 'ServiceUnavailableError'
    this.errorCode = errorCode
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))

    // Check for authentication errors (401 Unauthorized)
    if (response.status === 401) {
      const message = typeof error.detail === 'string'
        ? error.detail
        : error.detail?.message || 'Authentication required. Please log in.'

      console.warn('[JourneysService] Authentication error:', message)

      // Dispatch event so other components can react (e.g., show login modal)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-required', {
          detail: { message, redirectTo: window.location.pathname }
        }))
      }

      throw new AuthenticationError(message)
    }

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
    if (response.status === 503) {
      const detail = error.detail || {}
      const errorCode = detail.error || 'service_unavailable'
      const message = detail.message || 'Service temporarily unavailable. Please try again.'

      console.warn('[JourneysService] Service unavailable:', errorCode, message)

      throw new ServiceUnavailableError(errorCode, message)
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/access`, getFetchOptions({
    method: 'GET',
    headers: getHeaders(),
  }))
  return handleResponse<JourneyAccess>(response)
}

// Default journey templates - MUST MATCH backend/routes/journeys_enhanced.py DEMO_JOURNEY_TEMPLATES
// This ensures frontend/backend consistency when database is not seeded
const DEFAULT_CATALOG_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'demo-krodha-001',
    slug: 'transform-anger-demo',
    title: 'Transform Anger (Krodha)',
    description: 'A 14-day journey to transform destructive anger into constructive energy through Gita wisdom. Learn to recognize triggers, practice patience, and cultivate inner peace.',
    primary_enemy_tags: ['krodha'],
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    is_free: true,  // FREE for all users to test the journey feature
    icon_name: 'flame',
    color_theme: 'red',
  },
  {
    id: 'demo-kama-001',
    slug: 'master-desire-demo',
    title: 'Mastering Desire (Kama)',
    description: 'A 21-day journey to understand and master desires. Transform cravings into purposeful aspirations aligned with your dharma.',
    primary_enemy_tags: ['kama'],
    duration_days: 21,
    difficulty: 3,
    is_featured: true,
    is_free: false,
    icon_name: 'heart',
    color_theme: 'pink',
  },
  {
    id: 'demo-lobha-001',
    slug: 'overcome-greed-demo',
    title: 'Contentment Over Greed (Lobha)',
    description: 'A 14-day journey to cultivate santosha (contentment) and release the grip of greed. Find abundance in simplicity.',
    primary_enemy_tags: ['lobha'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'coins',
    color_theme: 'amber',
  },
  {
    id: 'demo-moha-001',
    slug: 'clarity-attachment-demo',
    title: 'Clarity Over Attachment (Moha)',
    description: 'A 21-day journey to see through delusion and attachment. Develop viveka (discrimination) and find clarity.',
    primary_enemy_tags: ['moha'],
    duration_days: 21,
    difficulty: 3,
    is_featured: false,
    is_free: false,
    icon_name: 'cloud',
    color_theme: 'purple',
  },
  {
    id: 'demo-mada-001',
    slug: 'humility-pride-demo',
    title: 'Humility Over Ego (Mada)',
    description: 'A 14-day journey to dissolve ego and cultivate true humility. Recognize the Self beyond the small self.',
    primary_enemy_tags: ['mada'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'crown',
    color_theme: 'orange',
  },
  {
    id: 'demo-matsarya-001',
    slug: 'joy-envy-demo',
    title: 'Joy Over Envy (Matsarya)',
    description: 'A 14-day journey to transform envy into mudita (sympathetic joy). Celebrate others\' success as your own.',
    primary_enemy_tags: ['matsarya'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'eye',
    color_theme: 'emerald',
  },
  {
    id: 'demo-complete-001',
    slug: 'complete-transformation-demo',
    title: 'Complete Inner Transformation',
    description: 'A comprehensive 30-day journey addressing all six inner enemies. The ultimate path to self-mastery and liberation.',
    primary_enemy_tags: ['kama', 'krodha', 'lobha', 'moha', 'mada', 'matsarya'],
    duration_days: 30,
    difficulty: 4,
    is_featured: true,
    is_free: false,
    icon_name: 'sparkles',
    color_theme: 'indigo',
  },
]

/**
 * Get all available journey templates (catalog)
 *
 * CACHING NOTE: If backend returns X-MindVibe-Fallback header (demo templates),
 * we mark the data as fallback to prevent caching stale demo data.
 */
export async function getCatalog(): Promise<JourneyTemplate[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/journeys/catalog`, getFetchOptions({
      method: 'GET',
      headers: getHeaders(),
    }))

    // If the response is a server error, return default templates
    if (!response.ok && response.status >= 500) {
      console.warn('[getCatalog] Server error, using default templates')
      return DEFAULT_CATALOG_TEMPLATES
    }

    // Check if this is fallback/demo data from backend
    const isFallback = response.headers.get('X-MindVibe-Fallback') === 'demo-templates'
    if (isFallback) {
      console.warn('[getCatalog] Backend returned demo templates - database may not be seeded')
    }

    const data = await handleResponse<JourneyTemplate[]>(response)

    // If empty array, return defaults
    if (!data || data.length === 0) {
      console.warn('[getCatalog] Empty catalog, using default templates')
      return DEFAULT_CATALOG_TEMPLATES
    }

    return data
  } catch (error) {
    console.warn('[getCatalog] Failed to fetch catalog:', error)
    return DEFAULT_CATALOG_TEMPLATES // Return default templates on errors
  }
}

/**
 * Start one or more journeys
 *
 * Handles various error cases:
 * - 401: Not authenticated - dispatches auth-required event
 * - 403: Premium feature not available or journey limit reached
 * - 503: Service unavailable (database not ready/seeded)
 */
export async function startJourneys(
  journeyIds: string[],
  personalization?: Personalization
): Promise<UserJourney[]> {
  // Verify auth token exists before making request
  const token = getAuthToken()
  const userId = getUserId()

  if (!token && !userId) {
    console.warn('[JourneysService] No auth credentials found for startJourneys')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-required', {
        detail: { message: 'Please log in to start a journey', redirectTo: window.location.pathname }
      }))
    }
    throw new AuthenticationError('Authentication required. Please log in to start a journey.')
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/journeys/start`, getFetchOptions({
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        journey_ids: journeyIds,
        personalization,
      }),
    }))
    return handleResponse<UserJourney[]>(response)
  } catch (error) {
    // Re-throw known error types with additional context
    if (error instanceof AuthenticationError) {
      throw error
    }
    if (error instanceof ServiceUnavailableError) {
      console.error('[JourneysService] Service unavailable when starting journeys:', error.errorCode)
      throw error
    }
    if (error instanceof PremiumFeatureError) {
      throw error
    }
    // Wrap unknown errors
    console.error('[JourneysService] Failed to start journeys:', error)
    throw error
  }
}

/**
 * Get all active journeys for the current user
 */
export async function getActiveJourneys(): Promise<UserJourney[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/active`, getFetchOptions({
    method: 'GET',
    headers: getHeaders(),
  }))
  return handleResponse<UserJourney[]>(response)
}

/**
 * Get today's agenda across all active journeys
 */
export async function getTodayAgenda(): Promise<TodayAgenda> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/today`, getFetchOptions({
    method: 'GET',
    headers: getHeaders(),
  }))
  return handleResponse<TodayAgenda>(response)
}

/**
 * Get or generate today's step for a specific journey
 */
export async function getTodayStep(userJourneyId: string): Promise<StepState> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/today`, getFetchOptions({
    method: 'POST',
    headers: getHeaders(),
  }))
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
    getFetchOptions({
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
  )
  return handleResponse(response)
}

/**
 * Pause a journey
 */
export async function pauseJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/pause`, getFetchOptions({
    method: 'POST',
    headers: getHeaders(),
  }))
  return handleResponse(response)
}

/**
 * Resume a paused journey
 */
export async function resumeJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/resume`, getFetchOptions({
    method: 'POST',
    headers: getHeaders(),
  }))
  return handleResponse(response)
}

/**
 * Abandon a journey
 */
export async function abandonJourney(
  userJourneyId: string
): Promise<{ status: string; journey_id: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/abandon`, getFetchOptions({
    method: 'POST',
    headers: getHeaders(),
  }))
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
  const response = await fetch(`${getApiBaseUrl()}/api/journeys/${userJourneyId}/history`, getFetchOptions({
    method: 'GET',
    headers: getHeaders(),
  }))
  return handleResponse(response)
}

/**
 * Get AI provider health status (admin)
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/ai/providers/status`, getFetchOptions({
    method: 'GET',
    headers: getHeaders(),
  }))
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
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

/**
 * Check if an error is a service unavailable error
 */
export function isServiceError(error: unknown): error is ServiceUnavailableError {
  return error instanceof ServiceUnavailableError
}

/**
 * Check if the error indicates database is not seeded
 */
export function isDatabaseNotSeeded(error: unknown): boolean {
  if (error instanceof ServiceUnavailableError) {
    return error.errorCode === 'database_not_seeded' || error.errorCode === 'database_not_ready'
  }
  if (error instanceof Error) {
    return error.message.includes('database_not_seeded') || error.message.includes('database_not_ready')
  }
  return false
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
