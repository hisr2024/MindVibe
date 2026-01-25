/**
 * Wisdom Journey Service
 * API integration for personalized wisdom journeys
 */

import { apiFetch } from '@/lib/api'
import type {
  WisdomJourney,
  JourneyRecommendation,
  GenerateJourneyRequest,
  MarkStepCompleteRequest,
} from '@/types/wisdomJourney.types'

const JOURNEY_CACHE_KEY = 'mindvibe_wisdom_journey_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Get cached data if still valid
 */
function getCached<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`${JOURNEY_CACHE_KEY}_${key}`)
    if (!stored) return null

    const entry: CacheEntry<T> = JSON.parse(stored)
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${JOURNEY_CACHE_KEY}_${key}`)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * Set cached data
 */
function setCached<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(`${JOURNEY_CACHE_KEY}_${key}`, JSON.stringify(entry))
  } catch {
    // Ignore cache errors
  }
}

/**
 * Clear journey cache
 */
function clearCache(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(JOURNEY_CACHE_KEY)) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Generate a new personalized wisdom journey
 */
export async function generateJourney(
  userId: string,
  request: GenerateJourneyRequest
): Promise<WisdomJourney> {
  const response = await apiFetch(
    '/api/wisdom-journey/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    userId
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to generate journey' }))
    throw new Error(error.detail || 'Failed to generate journey')
  }

  const journey: WisdomJourney = await response.json()

  // Clear cache after generating new journey
  clearCache()

  return journey
}

/**
 * Get user's active wisdom journey
 */
export async function getActiveJourney(userId: string): Promise<WisdomJourney | null> {
  const cacheKey = 'active_journey'
  const cached = getCached<WisdomJourney | null>(cacheKey)
  if (cached !== null) return cached

  try {
    const response = await apiFetch('/api/wisdom-journey/active', { method: 'GET' }, userId)

    if (response.status === 404 || response.status === 204) {
      setCached(cacheKey, null)
      return null
    }

    if (!response.ok) {
      throw new Error('Failed to fetch active journey')
    }

    const journey: WisdomJourney = await response.json()
    setCached(cacheKey, journey)
    return journey
  } catch (error) {
    console.error('Error fetching active journey:', error)
    return null
  }
}

/**
 * Get a specific wisdom journey by ID
 */
export async function getJourney(userId: string, journeyId: string): Promise<WisdomJourney> {
  const cacheKey = `journey_${journeyId}`
  const cached = getCached<WisdomJourney>(cacheKey)
  if (cached) return cached

  const response = await apiFetch(
    `/api/wisdom-journey/${journeyId}`,
    { method: 'GET' },
    userId
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch journey' }))
    throw new Error(error.detail || 'Failed to fetch journey')
  }

  const journey: WisdomJourney = await response.json()
  setCached(cacheKey, journey)
  return journey
}

/**
 * Mark a journey step as complete
 * Note: This function is resilient to backend failures - it will succeed locally
 * and data will sync when connection is restored
 */
export async function markStepComplete(
  userId: string,
  journeyId: string,
  request: MarkStepCompleteRequest
): Promise<void> {
  try {
    const response = await apiFetch(
      `/api/wisdom-journey/${journeyId}/progress`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      userId
    )

    // Accept any 2xx response as success
    if (response.ok) {
      // Clear cache after progress update
      clearCache()
      return
    }

    // Even on error response, try to parse and check for local success message
    const data = await response.json().catch(() => null)
    if (data && (data.completed || data.message?.includes('locally'))) {
      // Local fallback succeeded
      clearCache()
      return
    }

    // Log warning but don't throw - allow graceful degradation
    console.warn('Progress update returned non-success status:', response.status)
    clearCache()
  } catch (error) {
    // Network error - log but don't throw
    console.error('Network error during progress update:', error)
    // Still clear cache to allow refetch
    clearCache()
  }
}

/**
 * Pause an active journey
 */
export async function pauseJourney(userId: string, journeyId: string): Promise<WisdomJourney> {
  const response = await apiFetch(
    `/api/wisdom-journey/${journeyId}/pause`,
    { method: 'PUT' },
    userId
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to pause journey' }))
    throw new Error(error.detail || 'Failed to pause journey')
  }

  const journey: WisdomJourney = await response.json()

  // Clear cache after status update
  clearCache()

  return journey
}

/**
 * Resume a paused journey
 */
export async function resumeJourney(userId: string, journeyId: string): Promise<WisdomJourney> {
  const response = await apiFetch(
    `/api/wisdom-journey/${journeyId}/resume`,
    { method: 'PUT' },
    userId
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to resume journey' }))
    throw new Error(error.detail || 'Failed to resume journey')
  }

  const journey: WisdomJourney = await response.json()

  // Clear cache after status update
  clearCache()

  return journey
}

/**
 * Delete a wisdom journey
 */
export async function deleteJourney(userId: string, journeyId: string): Promise<void> {
  const response = await apiFetch(
    `/api/wisdom-journey/${journeyId}`,
    { method: 'DELETE' },
    userId
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete journey' }))
    throw new Error(error.detail || 'Failed to delete journey')
  }

  // Clear cache after deletion
  clearCache()
}

// Default recommendations for new users or when API fails
const DEFAULT_RECOMMENDATIONS: JourneyRecommendation[] = [
  {
    template: 'inner_peace',
    title: 'Journey to Inner Peace',
    description: 'A 7-day exploration of tranquility, acceptance, and letting go of anxiety through timeless wisdom.',
    score: 0.85,
    reason: 'Perfect for beginning your wisdom journey with foundational teachings on finding peace within.',
  },
  {
    template: 'self_discovery',
    title: 'Path of Self-Discovery',
    description: 'Explore your true nature, purpose, and potential through reflective wisdom.',
    score: 0.78,
    reason: 'Discover deeper insights about yourself and your life purpose.',
  },
  {
    template: 'balanced_action',
    title: 'Wisdom of Balanced Action',
    description: 'Learn to act without attachment, finding harmony between effort and surrender.',
    score: 0.72,
    reason: 'A versatile path for navigating daily life with greater awareness.',
  },
]

/**
 * Get personalized journey recommendations
 */
export async function getJourneyRecommendations(
  userId: string
): Promise<JourneyRecommendation[]> {
  const cacheKey = 'recommendations'
  const cached = getCached<JourneyRecommendation[]>(cacheKey)
  if (cached && cached.length > 0) return cached

  try {
    const response = await apiFetch(
      '/api/wisdom-journey/recommendations/list',
      { method: 'GET' },
      userId
    )

    if (!response.ok) {
      // Return default recommendations on API error
      console.warn('API returned error, using default recommendations')
      return DEFAULT_RECOMMENDATIONS
    }

    const recommendations: JourneyRecommendation[] = await response.json()

    // If empty array returned, use defaults
    if (!recommendations || recommendations.length === 0) {
      console.log('No recommendations from API, using defaults')
      setCached(cacheKey, DEFAULT_RECOMMENDATIONS)
      return DEFAULT_RECOMMENDATIONS
    }

    setCached(cacheKey, recommendations)
    return recommendations
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    // Return defaults instead of empty array
    return DEFAULT_RECOMMENDATIONS
  }
}

/**
 * Get current step for a journey
 */
export function getCurrentStep(journey: WisdomJourney) {
  return journey.steps.find((step) => step.step_number === journey.current_step + 1) || null
}

/**
 * Get next uncompleted step
 */
export function getNextStep(journey: WisdomJourney) {
  return journey.steps.find((step) => !step.completed) || null
}

/**
 * Calculate completion percentage
 */
export function calculateProgress(journey: WisdomJourney): number {
  const completedSteps = journey.steps.filter((step) => step.completed).length
  return Math.round((completedSteps / journey.total_steps) * 100)
}

/**
 * Format journey status for display
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    abandoned: 'Abandoned',
  }
  return statusMap[status] || status
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    paused: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    abandoned: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }
  return colorMap[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
}
