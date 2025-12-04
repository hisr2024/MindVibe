/**
 * Emotional Reset Types
 * Type definitions for MindVibe KIAAN Emotional Reset - 7-Step Guided Wellness Flow
 */

/** Breathing pattern configuration */
export interface BreathingPattern {
  inhale: number
  hold_in: number
  exhale: number
  hold_out: number
}

/** Emotional assessment from AI */
export interface EmotionalAssessment {
  assessment: string
  emotions: string[]
  themes: string[]
}

/** Breathing exercise data */
export interface BreathingExercise {
  pattern: BreathingPattern
  duration_seconds: number
  narration: string[]
  completion_message: string
}

/** Wisdom verse with application */
export interface WisdomVerse {
  wisdom: string
  application: string
}

/** Session summary at completion */
export interface SessionSummary {
  summary: string
  key_insight: string
  affirmation_to_remember: string
  next_steps: string[]
  closing_message: string
}

/** Step content data from API */
export interface StepContent {
  current_step: number
  total_steps: number
  step_title: string
  guidance: string
  progress: string
  assessment?: EmotionalAssessment
  breathing?: BreathingExercise
  visualization?: string
  wisdom?: WisdomVerse[]
  affirmations?: string[]
  summary?: SessionSummary
}

/** Response from starting a new session */
export interface SessionResponse {
  session_id: string
  current_step: number
  total_steps: number
  step_title: string
  guidance: string
  progress: string
}

/** Response from processing a step */
export interface StepResponse extends StepContent {
  crisis_detected?: boolean
  crisis_response?: string
}

/** Response from completing a session */
export interface CompleteResponse {
  status: 'completed'
  session_id: string
  message: string
  duration_minutes: number
}

/** Full session data for resume */
export interface SessionData {
  session_id: string
  user_id: string
  current_step: number
  status: 'active' | 'completed' | 'expired'
  created_at: string
  updated_at: string
  user_input?: string
  emotions?: string[]
  themes?: string[]
}

/** Health check response */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  service: string
  version: string
}

/** Rate limit error response */
export interface RateLimitError {
  detail: string
  sessions_today: number
  max_sessions: number
  reset_time: string
}

/** API error response */
export interface ApiError {
  detail: string
  crisis_detected?: boolean
  crisis_response?: string
}

/** Step identifiers */
export type EmotionalResetStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Step titles mapping */
export const STEP_TITLES: Record<EmotionalResetStep, string> = {
  1: 'Welcome & Intention',
  2: 'Understanding Emotions',
  3: 'Breathing Reset',
  4: 'Release & Let Go',
  5: 'Wisdom Integration',
  6: 'Personal Affirmations',
  7: 'Session Complete',
}

/** Step descriptions mapping */
export const STEP_DESCRIPTIONS: Record<EmotionalResetStep, string> = {
  1: 'Share what\'s weighing on your heart',
  2: 'AI reflects back detected emotions',
  3: 'Guided breathing (4-4-4-4 pattern)',
  4: 'Visualization exercise',
  5: 'Gita wisdom verses',
  6: 'AI-generated affirmations',
  7: 'Summary with insights and journal prompt',
}
