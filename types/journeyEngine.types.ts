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
// ENEMY METADATA
// =============================================================================

export interface EnemyInfo {
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

export const ENEMY_INFO: Record<EnemyType, EnemyInfo> = {
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
// TEMPLATE TYPES
// =============================================================================

export interface JourneyTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  primary_enemy_tags: EnemyType[];
  duration_days: number;
  difficulty: DifficultyLevel;
  is_active: boolean;
  is_featured: boolean;
  is_free: boolean;
  icon_name: string | null;
  color_theme: string | null;
  steps_count: number;
}

export interface JourneyTemplateStep {
  id: string;
  day_index: number;
  step_title: string | null;
  teaching_hint: string | null;
  reflection_prompt: string | null;
  practice_prompt: string | null;
  verse_selector: Record<string, unknown> | null;
  static_verse_refs: Array<{ chapter: number; verse: number }> | null;
  safety_notes: string | null;
}

// =============================================================================
// USER JOURNEY TYPES
// =============================================================================

export interface UserJourney {
  id: string;
  template_id: string;
  template_title: string;
  template_slug: string;
  status: UserJourneyStatus;
  current_day_index: number;
  duration_days: number;
  progress_percent: number;
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  enemy_tags: EnemyType[];
}

export interface JourneyStats {
  id: string;
  template_id: string;
  template_title: string;
  template_slug: string;
  status: UserJourneyStatus;
  current_day_index: number;
  duration_days: number;
  progress_percent: number;
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  completed_steps: number;
  enemy_tags: EnemyType[];
}

// =============================================================================
// STEP TYPES
// =============================================================================

export interface DailyStep {
  day_index: number;
  step_title: string;
  teaching_hint: string;
  reflection_prompt: string;
  practice_prompt: string;
  verse: GitaVerse | null;
  modern_example: ModernExample | null;
  is_completed: boolean;
  completed_at: string | null;
  user_reflection: string | null;
  safety_notes: string | null;
}

export interface GitaVerse {
  chapter: number;
  verse: number;
  sanskrit: string | null;
  transliteration: string | null;
  english: string;
}

export interface ModernExample {
  category: string;
  scenario: string;
  how_enemy_manifests: string;
  gita_verse_ref: string;
  gita_wisdom: string;
  practical_antidote: string;
  reflection_question: string;
}

// =============================================================================
// ENEMY PROGRESS TYPES
// =============================================================================

export interface EnemyProgress {
  enemy: EnemyType;
  enemy_label: string;
  total_journeys: number;
  completed_journeys: number;
  active_journeys: number;
  total_steps_completed: number;
  mastery_level: number; // 0-100
}

export interface EnemyRadarData {
  kama: number;
  krodha: number;
  lobha: number;
  moha: number;
  mada: number;
  matsarya: number;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface JourneyDashboard {
  active_journeys: JourneyStats[];
  todays_steps: TodayStep[];
  enemy_progress: Record<EnemyType, EnemyProgress>;
  recommendations: JourneyTemplate[];
  stats: DashboardStats;
}

export interface TodayStep {
  journey_id: string;
  journey_title: string;
  day_index: number;
  step_title: string;
  is_completed: boolean;
}

export interface DashboardStats {
  total_journeys_started: number;
  total_journeys_completed: number;
  current_streak_days: number;
  total_steps_completed: number;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface StartJourneyRequest {
  template_id: string;
  personalization?: {
    focus_area?: string;
    preferred_time?: string;
    notification_enabled?: boolean;
  };
}

export interface CompleteStepRequest {
  reflection?: string;
  mood_after?: number;
  insights?: string[];
}

export interface ListTemplatesParams {
  enemy?: EnemyType;
  difficulty?: DifficultyLevel;
  is_free?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListJourneysParams {
  status?: UserJourneyStatus;
  limit?: number;
  offset?: number;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface TemplateListResponse {
  templates: JourneyTemplate[];
  total: number;
}

export interface JourneyListResponse {
  journeys: JourneyStats[];
  total: number;
}

export interface StepCompletionResponse {
  success: boolean;
  message: string;
  new_progress: number;
  journey_completed: boolean;
  next_step: DailyStep | null;
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
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    1: 'Beginner',
    2: 'Easy',
    3: 'Moderate',
    4: 'Challenging',
    5: 'Advanced',
  };
  return labels[difficulty];
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  const colors: Record<DifficultyLevel, string> = {
    1: 'text-green-400',
    2: 'text-emerald-400',
    3: 'text-amber-400',
    4: 'text-orange-400',
    5: 'text-red-400',
  };
  return colors[difficulty];
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
