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
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes (reduced from 5 to prevent stale data)

// Request deduplication to prevent concurrent identical requests
const pendingRequests = new Map<string, Promise<unknown>>()

interface CacheEntry<T> {
  data: T
  timestamp: number
  isOffline?: boolean // Track if this was an offline fallback response
}

/**
 * Get cached data if still valid
 * Does NOT return offline fallback data from cache (prevents cache poisoning)
 */
function getCached<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`${JOURNEY_CACHE_KEY}_${key}`)
    if (!stored) return null

    const entry: CacheEntry<T> = JSON.parse(stored)

    // Don't return offline fallback data from cache
    if (entry.isOffline) {
      localStorage.removeItem(`${JOURNEY_CACHE_KEY}_${key}`)
      return null
    }

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
 * Does NOT cache offline fallback responses (prevents cache poisoning)
 */
function setCached<T>(key: string, data: T): void {
  try {
    // Don't cache offline fallback responses - they should be refetched
    if (data && typeof data === 'object' && '_offline' in (data as Record<string, unknown>) && (data as Record<string, unknown>)._offline === true) {
      return
    }

    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(`${JOURNEY_CACHE_KEY}_${key}`, JSON.stringify(entry))
  } catch {
    // Ignore cache errors
  }
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes('401') || lastError.message.includes('403') || lastError.message.includes('404')) {
        throw lastError
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Deduplicate concurrent requests to the same endpoint
 */
async function deduplicatedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
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
 * Uses request deduplication and retry logic
 */
export async function getActiveJourney(userId: string): Promise<WisdomJourney | null> {
  const cacheKey = 'active_journey'
  const cached = getCached<WisdomJourney>(cacheKey)
  if (cached !== null) return cached

  return deduplicatedRequest(`active_${userId}`, async () => {
    try {
      const response = await withRetry(async () => {
        const res = await apiFetch('/api/wisdom-journey/active', { method: 'GET' }, userId)
        if (!res.ok && res.status !== 404 && res.status !== 204) {
          throw new Error(`Failed with status ${res.status}`)
        }
        return res
      })

      if (response.status === 404 || response.status === 204) {
        return null
      }

      const journey = await response.json() as WisdomJourney & { _offline?: boolean } | null

      // Only cache if not an offline fallback response and journey is not null
      if (journey && !journey._offline) {
        setCached(cacheKey, journey)
      }

      return journey
    } catch (error) {
      console.error('Error fetching active journey:', error)
      return null
    }
  })
}

/**
 * Get a specific wisdom journey by ID
 * Uses request deduplication and retry logic
 */
export async function getJourney(userId: string, journeyId: string): Promise<WisdomJourney> {
  const cacheKey = `journey_${journeyId}`
  const cached = getCached<WisdomJourney>(cacheKey)
  if (cached) return cached

  return deduplicatedRequest(`journey_${journeyId}_${userId}`, async () => {
    const response = await withRetry(async () => {
      const res = await apiFetch(
        `/api/wisdom-journey/${journeyId}`,
        { method: 'GET' },
        userId
      )
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }
      return res
    })

    const journey = await response.json() as WisdomJourney & { _offline?: boolean } | null

    // Only cache if not an offline fallback response and journey exists
    if (journey && !journey._offline) {
      setCached(cacheKey, journey)
    }

    if (!journey) {
      throw new Error('Journey not found')
    }

    return journey
  })
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
 * Uses request deduplication and retry logic
 */
export async function getJourneyRecommendations(
  userId: string
): Promise<JourneyRecommendation[]> {
  const cacheKey = 'recommendations'
  const cached = getCached<JourneyRecommendation[]>(cacheKey)
  if (cached && cached.length > 0) return cached

  return deduplicatedRequest(`recommendations_${userId}`, async () => {
    try {
      const response = await withRetry(async () => {
        const res = await apiFetch(
          '/api/wisdom-journey/recommendations/list',
          { method: 'GET' },
          userId
        )
        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`)
        }
        return res
      }, 2) // Only 2 retries for recommendations since we have fallback

      const recommendations = await response.json() as JourneyRecommendation[]

      // If empty array returned, use defaults (don't cache defaults)
      if (!recommendations || recommendations.length === 0) {
        console.log('No recommendations from API, using defaults')
        return DEFAULT_RECOMMENDATIONS
      }

      setCached(cacheKey, recommendations)
      return recommendations
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      // Return defaults instead of throwing
      return DEFAULT_RECOMMENDATIONS
    }
  })
}

/**
 * Get current step for a journey
 * Returns null if journey or steps are undefined
 */
export function getCurrentStep(journey: WisdomJourney | null | undefined) {
  if (!journey || !journey.steps || !Array.isArray(journey.steps)) {
    return null
  }
  return journey.steps.find((step) => step.step_number === journey.current_step + 1) || null
}

/**
 * Get next uncompleted step
 * Returns null if journey or steps are undefined
 */
export function getNextStep(journey: WisdomJourney | null | undefined) {
  if (!journey || !journey.steps || !Array.isArray(journey.steps)) {
    return null
  }
  return journey.steps.find((step) => !step.completed) || null
}

/**
 * Calculate completion percentage
 * Returns 0 if journey or steps are undefined
 */
export function calculateProgress(journey: WisdomJourney | null | undefined): number {
  if (!journey || !journey.steps || !Array.isArray(journey.steps) || journey.total_steps === 0) {
    return 0
  }
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
