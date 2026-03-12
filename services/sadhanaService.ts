/**
 * Sadhana Service — Frontend API client for Nityam Sadhana.
 * Uses apiFetch for automatic CSRF + token refresh handling.
 */

import { apiFetch } from '@/lib/api'
import type {
  ComposeRequest,
  CompleteRequest,
  SadhanaComposition,
  CompleteResponse,
} from '@/types/sadhana.types'

const COMPOSE_ENDPOINT = '/api/sadhana/compose'
const COMPLETE_ENDPOINT = '/api/sadhana/complete'

export class SadhanaServiceError extends Error {
  public statusCode: number
  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'SadhanaServiceError'
    this.statusCode = statusCode
  }
}

/**
 * Compose a personalized daily practice based on mood.
 */
export async function composeSadhana(request: ComposeRequest): Promise<SadhanaComposition> {
  const response = await apiFetch(COMPOSE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to compose practice' }))
    throw new SadhanaServiceError(
      errorData.detail || 'Failed to compose practice',
      response.status
    )
  }

  const raw = await response.json()

  /* Backend wraps response in { success, composition } */
  const data = raw.composition || raw

  /* Map snake_case backend response to camelCase frontend types */
  return {
    greeting: data.greeting,
    breathingPattern: {
      name: data.breathing_pattern.name,
      inhale: data.breathing_pattern.inhale,
      holdIn: data.breathing_pattern.hold_in,
      exhale: data.breathing_pattern.exhale,
      holdOut: data.breathing_pattern.hold_out,
      cycles: data.breathing_pattern.cycles,
      description: data.breathing_pattern.description,
    },
    verse: {
      chapter: data.verse.chapter,
      verse: data.verse.verse,
      verseId: data.verse.verse_id,
      sanskrit: data.verse.sanskrit,
      transliteration: data.verse.transliteration,
      english: data.verse.english,
      modernInsight: data.verse.modern_insight,
      personalInterpretation: data.verse.personal_interpretation,
    },
    reflectionPrompt: {
      prompt: data.reflection_prompt.prompt,
      guidingQuestion: data.reflection_prompt.guiding_question,
    },
    dharmaIntention: {
      suggestion: data.dharma_intention.suggestion,
      category: data.dharma_intention.category,
    },
    durationEstimateMinutes: data.duration_estimate_minutes,
    timeOfDay: data.time_of_day,
  }
}

/**
 * Record Sadhana completion and receive XP.
 */
export async function completeSadhana(request: CompleteRequest): Promise<CompleteResponse> {
  const response = await apiFetch(COMPLETE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood: request.mood,
      reflection_text: request.reflectionText,
      intention_text: request.intentionText,
      duration_seconds: request.durationSeconds,
      verse_id: request.verseId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to record completion' }))
    throw new SadhanaServiceError(
      errorData.detail || 'Failed to record completion',
      response.status
    )
  }

  const data = await response.json()
  return {
    success: data.success,
    xpAwarded: data.xp_awarded,
    streakCount: data.streak_count,
    message: data.message,
  }
}
