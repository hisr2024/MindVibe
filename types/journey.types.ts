/**
 * Journey Types - TypeScript definitions for the Wisdom Journeys feature.
 *
 * These types map to the backend API responses and are used throughout
 * the frontend for type safety.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Status of a user's journey instance.
 */
export type JourneyStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/**
 * Pace preference for journey steps.
 */
export type JourneyPace = 'daily' | 'every_other_day' | 'weekly';

/**
 * Tone preference for KIAAN responses.
 */
export type JourneyTone = 'gentle' | 'direct' | 'inspiring';

/**
 * Inner enemy tags (Sad-Ripu).
 */
export type InnerEnemyTag =
  | 'kama'      // Desire/Lust
  | 'krodha'    // Anger
  | 'lobha'     // Greed
  | 'moha'      // Attachment/Delusion
  | 'mada'      // Ego/Pride
  | 'matsarya'  // Envy/Jealousy
  | 'mixed'     // Combined journey
  | 'general';  // General wisdom

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/**
 * A journey template from the catalog.
 */
export interface JourneyTemplate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_days: number;
  difficulty: number;
  difficulty_label: string;
  primary_enemy_tags: InnerEnemyTag[];
  is_featured: boolean;
  is_free: boolean;
  icon_name: string | null;
  color_theme: string | null;
  step_count: number;
}

// =============================================================================
// JOURNEY TYPES
// =============================================================================

/**
 * Personalization settings for a journey.
 */
export interface JourneyPersonalization {
  pace?: JourneyPace;
  time_budget_minutes?: number;
  focus_tags?: InnerEnemyTag[];
  preferred_tone?: JourneyTone;
  provider_preference?: 'auto' | 'openai' | 'sarvam' | 'oai_compat';
}

/**
 * A user's journey instance.
 */
export interface Journey {
  id: string;
  status: JourneyStatus;
  current_day_index: number;
  total_days: number;
  completed_days: number;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  paused_at: string | null;
  personalization: JourneyPersonalization;
  template: JourneyTemplate | null;
  steps?: JourneyStep[];
}

/**
 * Check-in data for a step.
 */
export interface StepCheckIn {
  intensity?: number;
  label?: string;
  timestamp?: string;
}

/**
 * Verse reference for a step.
 */
export interface VerseRef {
  chapter: number;
  verse: number;
}

/**
 * Practice instructions for a step.
 */
export interface StepPractice {
  name: string;
  instructions: string[];
  duration_minutes: number;
}

/**
 * Check-in prompt configuration.
 */
export interface CheckInPrompt {
  scale: string;
  label: string;
}

/**
 * AI-generated step content from KIAAN.
 */
export interface StepContent {
  step_title: string;
  today_focus: InnerEnemyTag;
  verse_refs: VerseRef[];
  teaching: string;
  guided_reflection: string[];
  practice: StepPractice;
  micro_commitment: string;
  check_in_prompt: CheckInPrompt;
  safety_note?: string;
}

/**
 * A journey step with state and content.
 */
export interface JourneyStep {
  id: string;
  day_index: number;
  is_completed: boolean;
  completed_at: string | null;
  delivered_at: string | null;
  verse_refs: VerseRef[];
  content: StepContent | null;
  check_in: StepCheckIn | null;
  has_reflection: boolean;
  template_info: {
    step_title: string | null;
    teaching_hint: string | null;
  } | null;
}

// =============================================================================
// AGENDA TYPES
// =============================================================================

/**
 * A single item in the today's agenda.
 */
export interface AgendaItem {
  journey: Journey;
  today_step: JourneyStep | null;
  error?: string;
}

// =============================================================================
// ACCESS TYPES
// =============================================================================

/**
 * User's journey access information.
 */
export interface JourneyAccess {
  has_access: boolean;
  active_count: number;
  limit: number;
  remaining_slots: number;
  is_trial: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

/**
 * List response with count.
 */
export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}

// Specific response types
export type CatalogResponse = ListResponse<JourneyTemplate>;
export type ActiveJourneysResponse = ListResponse<Journey>;
export type TodayAgendaResponse = ListResponse<AgendaItem>;
export type JourneyResponse = ApiResponse<Journey>;
export type StepResponse = ApiResponse<JourneyStep>;
export type AccessResponse = ApiResponse<JourneyAccess>;

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request to start a new journey.
 */
export interface StartJourneyRequest {
  template_slug: string;
  personalization?: JourneyPersonalization;
}

/**
 * Request to complete a journey step.
 */
export interface CompleteStepRequest {
  reflection?: string;
  check_in?: StepCheckIn;
}
