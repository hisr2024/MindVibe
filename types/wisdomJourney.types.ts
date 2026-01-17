/**
 * Wisdom Journey Types
 * Type definitions for AI-powered personalized wisdom journeys
 */

export type JourneyStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export interface JourneyStep {
  id: string
  step_number: number
  verse_id: number | null
  verse_text: string | null
  verse_translation: string | null
  verse_chapter: number | null
  verse_number: number | null
  reflection_prompt: string | null
  ai_insight: string | null
  completed: boolean
  completed_at: string | null
  time_spent_seconds: number | null
  user_notes: string | null
  user_rating: number | null
}

export interface WisdomJourney {
  id: string
  user_id: string
  title: string
  description: string | null
  total_steps: number
  current_step: number
  status: JourneyStatus
  progress_percentage: number
  recommended_by: string | null
  recommendation_score: number | null
  recommendation_reason: string | null
  created_at: string
  updated_at: string | null
  completed_at: string | null
  steps: JourneyStep[]
}

export interface JourneyRecommendation {
  template: string
  title: string
  description: string
  score: number
  reason: string
}

export interface GenerateJourneyRequest {
  duration_days: number
  custom_title?: string
}

export interface MarkStepCompleteRequest {
  step_number: number
  time_spent_seconds?: number
  user_notes?: string
  user_rating?: number
}

export interface JourneyStepWithVerse extends JourneyStep {
  verse: {
    text: string
    translation: string
    transliteration?: string
    chapter: number
    verse: number
  } | null
}
