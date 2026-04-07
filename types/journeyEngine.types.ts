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
  /** Devanagari script name */
  devanagari: string;
  description: string;
  color: string;
  /** RGB triplet for rgba() usage, e.g. '220,38,38' */
  colorRGB: string;
  gradient: string;
  icon: string;
  keyVerse: { chapter: number; verse: number };
  /** Sanskrit verse line for this enemy */
  keyVerseText: string;
  antidote: string;
  /** Which chakra this enemy is associated with */
  chakra: string;
  /** The virtue/practice that conquers this enemy */
  conqueredBy: string;
  /** Modern context examples */
  modernContext: string;
  /** Path to AI-generated hero image */
  heroImage: string;
}

export const ENEMY_INFO: Record<EnemyType, EnemyDisplayInfo> = {
  kama: {
    type: 'kama',
    name: 'Desire',
    sanskrit: 'Kama',
    devanagari: '\u0915\u093E\u092E',
    description: 'The wanting mind that is never satisfied',
    color: '#DC2626',
    colorRGB: '220,38,38',
    gradient: 'from-red-500 to-rose-600',
    icon: 'flame',
    keyVerse: { chapter: 3, verse: 37 },
    keyVerseText: 'k\u0101ma e\u1E63a krodha e\u1E63a rajo-gu\u1E47a-samudbhava\u1E25',
    antidote: 'Contentment (Santosha)',
    chakra: 'Muladhara (Root)',
    conqueredBy: 'Nishkama Karma \u2014 desireless action',
    modernContext: 'Endless scrolling, compulsive shopping, relationship obsession',
    heroImage: '/images/journeys/enemies/kama.webp',
  },
  krodha: {
    type: 'krodha',
    name: 'Anger',
    sanskrit: 'Krodha',
    devanagari: '\u0915\u094D\u0930\u094B\u0927',
    description: 'The reactive fire that destroys wisdom',
    color: '#B45309',
    colorRGB: '180,83,9',
    gradient: 'from-orange-500 to-amber-600',
    icon: 'zap',
    keyVerse: { chapter: 2, verse: 63 },
    keyVerseText: 'krodh\u0101d bhavati sammoha\u1E25',
    antidote: 'Patience (Kshama)',
    chakra: 'Manipura (Solar Plexus)',
    conqueredBy: 'Viveka \u2014 discrimination and pause before reaction',
    modernContext: 'Road rage, social media outrage, reactive arguments',
    heroImage: '/images/journeys/enemies/krodha.webp',
  },
  lobha: {
    type: 'lobha',
    name: 'Greed',
    sanskrit: 'Lobha',
    devanagari: '\u0932\u094B\u092D',
    description: 'The grasping hand that can never hold enough',
    color: '#059669',
    colorRGB: '5,150,105',
    gradient: 'from-green-500 to-emerald-600',
    icon: 'coins',
    keyVerse: { chapter: 14, verse: 17 },
    keyVerseText: 'lobha\u1E25 prav\u1E5Btti\u1E25 \u0101rambha\u1E25 karma\u1E47\u0101m a\u015Bama\u1E25 sp\u1E5Bh\u0101',
    antidote: 'Generosity (Dana)',
    chakra: 'Anahata (Heart)',
    conqueredBy: 'Dana \u2014 generous giving without expectation',
    modernContext: 'Hoarding, financial anxiety, never feeling "enough"',
    heroImage: '/images/journeys/enemies/lobha.webp',
  },
  moha: {
    type: 'moha',
    name: 'Delusion',
    sanskrit: 'Moha',
    devanagari: '\u092E\u094B\u0939',
    description: 'The fog of ego that mistakes the temporary for real',
    color: '#6D28D9',
    colorRGB: '109,40,217',
    gradient: 'from-violet-500 to-purple-600',
    icon: 'cloud',
    keyVerse: { chapter: 2, verse: 52 },
    keyVerseText: 'yad\u0101 te moha-kalila\u1E41 buddhir vyatitari\u1E63yati',
    antidote: 'Wisdom (Viveka)',
    chakra: 'Ajna (Third Eye)',
    conqueredBy: 'Viveka-Vairagya \u2014 discrimination and detachment',
    modernContext: 'Toxic relationships, identity attachment, fear of change',
    heroImage: '/images/journeys/enemies/moha.webp',
  },
  mada: {
    type: 'mada',
    name: 'Pride',
    sanskrit: 'Mada',
    devanagari: '\u092E\u0926',
    description: 'The inflated self that forgets its true nature',
    color: '#1D4ED8',
    colorRGB: '29,78,216',
    gradient: 'from-blue-500 to-indigo-600',
    icon: 'crown',
    keyVerse: { chapter: 16, verse: 4 },
    keyVerseText: 'darpo \'bhim\u0101nat\u0101 krodha\u1E25 p\u0101ru\u1E63yam eva ca',
    antidote: 'Humility (Vinaya)',
    chakra: 'Vishuddha (Throat)',
    conqueredBy: 'Namrata \u2014 genuine humility, seeing self in all',
    modernContext: 'Arrogance, inability to accept feedback, need to be right',
    heroImage: '/images/journeys/enemies/mada.webp',
  },
  matsarya: {
    type: 'matsarya',
    name: 'Envy',
    sanskrit: 'Matsarya',
    devanagari: '\u092E\u093E\u0924\u094D\u0938\u0930\u094D\u092F',
    description: 'The comparing mind that cannot celebrate others',
    color: '#9D174D',
    colorRGB: '157,23,77',
    gradient: 'from-pink-500 to-rose-600',
    icon: 'eye',
    keyVerse: { chapter: 12, verse: 13 },
    keyVerseText: 'adve\u1E63\u1E6D\u0101 sarva-bh\u016Bt\u0101n\u0101\u1E41 maitra\u1E25 karu\u1E47a eva ca',
    antidote: 'Sympathetic Joy (Mudita)',
    chakra: 'Sahasrara (Crown)',
    conqueredBy: 'Mudita \u2014 sympathetic joy in others\' success',
    modernContext: 'Social media comparison, jealousy of colleagues, resentment',
    heroImage: '/images/journeys/enemies/matsarya.webp',
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
  /** Sacred enrichment — derived server-side from the primary enemy tag.
   *  All four are optional so older API deployments keep working. */
  gita_verse_ref?: { chapter: number; verse: number } | null;
  gita_verse_text?: string | null;
  modern_context?: string | null;
  transformation_promise?: string | null;
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

/** Modern real-life example surfaced with a daily step. Mirrors backend
 *  ModernExampleOut. Named StepModernExample to avoid colliding with the
 *  existing ModernExample alias exported below. */
export interface StepModernExample {
  category: string;
  scenario: string;
  how_enemy_manifests: string;
  gita_verse_ref: { chapter: number; verse: number };
  gita_wisdom: string;
  practical_antidote: string;
  reflection_question: string;
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
  available_to_complete: boolean;
  next_available_at: string | null;
  /** Flattened sacred fields — optional because older deployments
   *  won't return them. UI must tolerate absence and fall back to
   *  the existing verses[] array. */
  verse_ref?: { chapter: number; verse: number } | null;
  verse_sanskrit?: string | null;
  verse_transliteration?: string | null;
  verse_translation?: string | null;
  reflection_prompt?: string | null;
  modern_example?: StepModernExample | null;
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
  /** Authoritative active-journey count from the backend. Always prefer
   *  this over `active_journeys.length` for the "N/5" indicator so the
   *  dashboard never disagrees with the start-journey limit check. */
  active_count: number;
  /** Maximum concurrently active journeys allowed (currently 5). */
  max_active: number;
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
