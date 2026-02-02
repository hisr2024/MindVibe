/**
 * Journey Engine Types - TypeScript definitions for the Six Enemies (Shadripu) Journey System.
 *
 * The Six Enemies (Shadripu) from Bhagavad Gita:
 * - Kama (Desire/Lust)
 * - Krodha (Anger)
 * - Lobha (Greed)
 * - Moha (Attachment/Delusion)
 * - Mada (Pride/Ego)
 * - Matsarya (Jealousy/Envy)
 *
 * NOTE: Types match backend response models in backend/routes/journey_engine.py
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * The Six Inner Enemies (Shadripu)
 */
export type EnemyType = 'kama' | 'krodha' | 'lobha' | 'moha' | 'mada' | 'matsarya';

/**
 * Status of a user's journey
 */
export type UserJourneyStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/**
 * Difficulty level (1-5)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// =============================================================================
// ENEMY METADATA (Frontend Only - for UI display)
// =============================================================================

export interface EnemyDisplayInfo {
  type: EnemyType;
  name: string;
  sanskrit: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  keyVerse: { chapter: number; verse: number };
  antidote: string;
}

export const ENEMY_INFO: Record<EnemyType, EnemyDisplayInfo> = {
  kama: {
    type: 'kama',
    name: 'Desire',
    sanskrit: 'Kama',
    description: 'Uncontrolled desires and cravings that disturb inner peace',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-600',
    icon: 'flame',
    keyVerse: { chapter: 3, verse: 37 },
    antidote: 'Contentment (Santosha)',
  },
  krodha: {
    type: 'krodha',
    name: 'Anger',
    sanskrit: 'Krodha',
    description: 'Destructive anger that clouds judgment and harms relationships',
    color: '#F97316',
    gradient: 'from-orange-500 to-amber-600',
    icon: 'zap',
    keyVerse: { chapter: 2, verse: 63 },
    antidote: 'Patience (Kshama)',
  },
  lobha: {
    type: 'lobha',
    name: 'Greed',
    sanskrit: 'Lobha',
    description: 'Excessive attachment to possessions and accumulation',
    color: '#22C55E',
    gradient: 'from-green-500 to-emerald-600',
    icon: 'coins',
    keyVerse: { chapter: 14, verse: 17 },
    antidote: 'Generosity (Dana)',
  },
  moha: {
    type: 'moha',
    name: 'Delusion',
    sanskrit: 'Moha',
    description: 'Attachment and confusion that veils true understanding',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
    icon: 'cloud',
    keyVerse: { chapter: 2, verse: 52 },
    antidote: 'Wisdom (Viveka)',
  },
  mada: {
    type: 'mada',
    name: 'Pride',
    sanskrit: 'Mada',
    description: 'Ego and arrogance that create separation from others',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-teal-600',
    icon: 'crown',
    keyVerse: { chapter: 16, verse: 4 },
    antidote: 'Humility (Vinaya)',
  },
  matsarya: {
    type: 'matsarya',
    name: 'Envy',
    sanskrit: 'Matsarya',
    description: 'Jealousy of others success and possessions',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
    icon: 'eye',
    keyVerse: { chapter: 12, verse: 13 },
    antidote: 'Sympathetic Joy (Mudita)',
  },
};

export const ENEMY_ORDER: EnemyType[] = ['kama', 'krodha', 'lobha', 'moha', 'mada', 'matsarya'];

// =============================================================================
// TEMPLATE TYPES (matches backend TemplateResponse)
// =============================================================================

export interface JourneyTemplate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  primary_enemy_tags: string[];
  duration_days: number;
  difficulty: number;
  is_featured: boolean;
  is_free: boolean;
  icon_name: string | null;
  color_theme: string | null;
}

// =============================================================================
// USER JOURNEY TYPES (matches backend JourneyResponse)
// =============================================================================

export interface JourneyResponse {
  journey_id: string;
  template_slug: string;
  title: string;
  status: UserJourneyStatus;
  current_day: number;
  total_days: number;
  progress_percentage: number;
  days_completed: number;
  started_at: string | null;
  last_activity: string | null;
  primary_enemies: string[];
  streak_days: number;
}

// Alias for backwards compatibility
export type JourneyStats = JourneyResponse;

// =============================================================================
// STEP TYPES (matches backend StepResponse)
// =============================================================================

export interface VerseContent {
  chapter: number;
  verse: number;
  sanskrit: string | null;
  hindi: string | null;
  english: string;
  transliteration: string | null;
  theme: string | null;
}

export interface StepResponse {
  step_id: string;
  journey_id: string;
  day_index: number;
  step_title: string;
  teaching: string;
  guided_reflection: string[];
  practice: Record<string, unknown>;
  verse_refs: Array<{ chapter: number; verse: number }>;
  verses: VerseContent[];
  micro_commitment: string | null;
  check_in_prompt: Record<string, string> | null;
  safety_note: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

// Alias for backwards compatibility
export type DailyStep = StepResponse;

// =============================================================================
// ENEMY PROGRESS TYPES (matches backend EnemyProgressResponse)
// =============================================================================

export interface EnemyProgressResponse {
  enemy: string;
  enemy_label: string;
  journeys_started: number;
  journeys_completed: number;
  total_days_practiced: number;
  current_streak: number;
  best_streak: number;
  last_practice: string | null;
  mastery_level: number;
}

// Alias for backwards compatibility
export type EnemyProgress = EnemyProgressResponse;

export interface EnemyRadarData {
  kama: number;
  krodha: number;
  lobha: number;
  moha: number;
  mada: number;
  matsarya: number;
}

// =============================================================================
// ENEMY INFO TYPE (matches backend EnemyInfo)
// =============================================================================

export interface EnemyInfoResponse {
  enemy: string;
  sanskrit: string;
  english: string;
  description: string;
  label: string;
  key_verse: { chapter: number; verse: number };
  themes: string[];
  antidotes: string[];
  modern_contexts: string[];
}

// =============================================================================
// DASHBOARD TYPES (matches backend DashboardResponse)
// =============================================================================

export interface DashboardResponse {
  active_journeys: JourneyResponse[];
  completed_journeys: number;
  total_days_practiced: number;
  current_streak: number;
  enemy_progress: EnemyProgressResponse[];
  recommended_templates: Record<string, unknown>[];
  today_steps: StepResponse[];
}

// Alias for backwards compatibility
export type JourneyDashboard = DashboardResponse;

// =============================================================================
// COMPLETION RESPONSE (matches backend CompletionResponse)
// =============================================================================

export interface CompletionResponse {
  success: boolean;
  day_completed: number;
  journey_complete: boolean;
  next_day: number | null;
  progress_percentage: number;
}

// Alias for backwards compatibility
export type StepCompletionResponse = CompletionResponse;

// =============================================================================
// EXAMPLE TYPES (matches backend ExampleResponse)
// =============================================================================

export interface ExampleResponse {
  enemy: string;
  category: string;
  scenario: string;
  how_enemy_manifests: string;
  gita_verse_ref: { chapter: number; verse: number };
  gita_wisdom: string;
  practical_antidote: string;
  reflection_question: string;
}

// Alias for backwards compatibility
export type ModernExample = ExampleResponse;

export interface ExampleListResponse {
  examples: ExampleResponse[];
  total: number;
  enemy: string;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface PersonalizationSettings {
  pace?: string;
  time_budget_minutes?: number;
  focus_tags?: string[];
  preferred_tone?: string;
  provider_preference?: string;
}

export interface StartJourneyRequest {
  template_id: string;
  personalization?: PersonalizationSettings;
}

export interface CompleteStepRequest {
  reflection?: string;
  check_in?: Record<string, unknown>;
}

export interface ListTemplatesParams {
  enemy?: string;
  difficulty_max?: number;
  free_only?: boolean;
  featured_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListJourneysParams {
  status_filter?: UserJourneyStatus;
  limit?: number;
  offset?: number;
}

// =============================================================================
// RESPONSE TYPES (matches backend list responses)
// =============================================================================

export interface TemplateListResponse {
  templates: JourneyTemplate[];
  total: number;
  limit: number;
  offset: number;
}

export interface JourneyListResponse {
  journeys: JourneyResponse[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display label for journey status
 */
export function getJourneyStatusLabel(status: UserJourneyStatus): string {
  const labels: Record<UserJourneyStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    abandoned: 'Abandoned',
  };
  return labels[status];
}

/**
 * Get status color for UI display
 */
export function getJourneyStatusColor(status: UserJourneyStatus): string {
  const colors: Record<UserJourneyStatus, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    abandoned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status];
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    1: 'Beginner',
    2: 'Easy',
    3: 'Moderate',
    4: 'Challenging',
    5: 'Advanced',
  };
  return labels[difficulty] || 'Unknown';
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: number): string {
  const colors: Record<number, string> = {
    1: 'text-green-400',
    2: 'text-emerald-400',
    3: 'text-amber-400',
    4: 'text-orange-400',
    5: 'text-red-400',
  };
  return colors[difficulty] || 'text-gray-400';
}

/**
 * Calculate mastery level description
 */
export function getMasteryDescription(level: number): string {
  if (level >= 80) return 'Mastered';
  if (level >= 60) return 'Proficient';
  if (level >= 40) return 'Developing';
  if (level >= 20) return 'Awakening';
  return 'Beginning';
}
