/**
 * Nityam Sadhana Types
 * Type definitions for MindVibe's adaptive daily sacred practice experience.
 */

/** Phases of the Sadhana practice */
export type SadhanaPhase =
  | 'loading'
  | 'arrival'
  | 'breathwork'
  | 'verse'
  | 'reflection'
  | 'intention'
  | 'complete'

/** Mood options for the arrival phase */
export type SadhanaMood =
  | 'radiant'
  | 'peaceful'
  | 'grateful'
  | 'seeking'
  | 'heavy'
  | 'wounded'

/** Mood configuration for display */
export interface MoodOption {
  id: SadhanaMood
  label: string
  emoji: string
  color: string
  description: string
}

/** Breathing pattern for pranayama phase */
export interface BreathingPattern {
  name: string
  inhale: number
  holdIn: number
  exhale: number
  holdOut: number
  cycles: number
  description: string
}

/** Gita verse selected for meditation */
export interface SadhanaVerse {
  chapter: number
  verse: number
  verseId: string
  sanskrit?: string
  transliteration?: string
  english: string
  modernInsight: string
  personalInterpretation: string
  chapterName?: string
}

/** Reflection prompt for journaling */
export interface ReflectionPrompt {
  prompt: string
  guidingQuestion: string
}

/** Dharma intention suggestion */
export interface DharmaIntention {
  suggestion: string
  category: string
}

/** Full AI-composed practice for the day */
export interface SadhanaComposition {
  greeting: string
  breathingPattern: BreathingPattern
  verse: SadhanaVerse
  reflectionPrompt: ReflectionPrompt
  dharmaIntention: DharmaIntention
  durationEstimateMinutes: number
  timeOfDay: 'morning' | 'afternoon' | 'evening'
}

/** Request to compose a practice */
export interface ComposeRequest {
  mood: SadhanaMood
  timeOfDay: string
}

/** Request to record completion */
export interface CompleteRequest {
  mood: SadhanaMood
  reflectionText?: string
  intentionText?: string
  durationSeconds: number
  verseId: string
}

/** Response from completion endpoint */
export interface CompleteResponse {
  success: boolean
  xpAwarded: number
  streakCount: number
  message: string
}

/** API error shape */
export interface SadhanaApiError {
  detail: string
  code?: string
}

/** Sadhana store state */
export interface SadhanaState {
  phase: SadhanaPhase
  mood: SadhanaMood | null
  composition: SadhanaComposition | null
  reflectionText: string
  intentionText: string
  startedAt: number | null
  isComposing: boolean
  error: string | null
}

/** Sadhana store actions */
export interface SadhanaActions {
  setPhase: (phase: SadhanaPhase) => void
  setMood: (mood: SadhanaMood) => void
  setComposition: (composition: SadhanaComposition) => void
  setReflectionText: (text: string) => void
  setIntentionText: (text: string) => void
  setIsComposing: (loading: boolean) => void
  setError: (error: string | null) => void
  nextPhase: () => void
  reset: () => void
}
