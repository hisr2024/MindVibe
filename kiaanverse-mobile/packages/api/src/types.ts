/**
 * Core API types for Kiaanverse
 *
 * Types match the actual backend Pydantic schemas in backend/routes/auth.py.
 * Field names are snake_case to match the API contract exactly.
 */

// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  locale: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export type SubscriptionTier = 'FREE' | 'BHAKTA' | 'SADHAK' | 'SIDDHA';

/**
 * POST /api/auth/login response (LoginOut).
 *
 * The refresh_token is NOT in the response body — it is set as an
 * httpOnly cookie by the backend. Mobile clients must extract it from
 * the Set-Cookie header or rely on native cookie storage.
 */
export interface LoginResponseUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_onboarded: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_in: number;
  user: LoginResponseUser;
  // Legacy flat fields kept for backward compatibility
  session_id?: string;
  subscription_tier: string;
  subscription_status: string;
  is_developer: boolean;
}

/**
 * POST /api/auth/signup response (SignupOut).
 *
 * Signup does NOT return tokens. The user must verify their email
 * before they can log in (backend returns 403 for unverified users).
 */
export interface SignupResponse {
  user_id: string;
  email: string;
  policy_passed: boolean;
  subscription_tier: string;
  email_verification_sent: boolean;
}

/**
 * GET /api/auth/me response (MeOut).
 *
 * Note: Returns user_id (not id), and does NOT include name, locale,
 * or created_at. Those must come from a separate profile endpoint.
 */
export interface MeResponse {
  user_id: string;
  email: string;
  email_verified: boolean;
  session_id: string | null;
  session_active: boolean;
  session_expires_at: string | null;
  session_last_used_at: string | null;
  access_token_expires_in: number | null;
  subscription_tier: string;
  subscription_status: string;
  is_developer: boolean;
}

/**
 * POST /api/auth/refresh response (RefreshOut).
 *
 * refresh_token in the body is null when REFRESH_TOKEN_ENABLE_BODY_RETURN
 * is False (default). The new refresh token is rotated via Set-Cookie.
 */
export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  session_id: string;
  refresh_token: string | null;
}

// Legacy aliases for backward compatibility with existing code
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user_id?: string | undefined;
  id?: string | undefined;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name?: string | undefined;
  locale?: string | undefined;
  subscription_tier?: string | undefined;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Gita
// ---------------------------------------------------------------------------

export interface GitaVerse {
  id: string;
  chapter: number;
  verse: number;
  /** Sanskrit text (Devanagari) */
  sanskrit: string;
  /** IAST transliteration */
  transliteration: string;
  /** English translation */
  translation: string;
  /** Verse commentary */
  commentary?: string;
  /** Audio URL for recitation */
  audioUrl?: string;
  /** Spiritual wellness tags */
  tags?: string[];
}

export interface GitaChapter {
  id: number;
  title: string;
  titleSanskrit?: string;
  versesCount: number;
  summary?: string;
}

/** Detailed verse from GET /api/gita/verses/:chapter/:verse */
export interface GitaVerseDetail {
  chapter: number;
  verse: number;
  verse_id: string;
  sanskrit: string;
  english: string;
  hindi: string;
  theme: string;
  principle: string | null;
}

/** Related verse reference returned alongside verse detail */
export interface GitaVerseReference {
  chapter: number;
  verse: number;
  verse_id: string;
  text: string;
  translation: string | null;
  sanskrit: string | null;
  theme: string;
}

/** Response from GET /api/gita/verses/:chapter/:verse */
export interface GitaVerseResponse {
  verse: GitaVerseDetail;
  related_verses: GitaVerseReference[];
}

/** Verse summary in chapter listings */
export interface GitaVerseSummary {
  chapter: number;
  verse: number;
  verse_id: string;
  theme: string;
  preview: string;
  sanskrit?: string;
  transliteration?: string;
}

/** Response from GET /api/gita/chapters/:id */
export interface GitaChapterDetail {
  chapter: number;
  name: string;
  summary: string;
  verse_count: number;
  verses: GitaVerseSummary[];
  themes: string[];
}

/** Single search result with relevance */
export interface GitaSearchResult {
  verse: GitaVerseDetail;
  relevance_score: number;
  match_context: string | null;
}

/** Response from GET /api/gita/search */
export interface GitaSearchResponse {
  query: string;
  results: GitaSearchResult[];
  total_results: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/** Response from GET /api/gita/translations/:verse_id */
export interface GitaTranslationSet {
  verse_id: string;
  chapter: number;
  verse: number;
  translations: Record<string, string>;
  theme: string;
  principle: string | null;
}

// ---------------------------------------------------------------------------
// Mood
// ---------------------------------------------------------------------------

/** Spiritual mood state identifiers used throughout the app. */
export type SpiritualMood =
  | 'peaceful' | 'joyful' | 'confused' | 'anxious'
  | 'sad' | 'grateful' | 'angry' | 'hopeful';

export interface MoodEntry {
  id: number;
  /** Mood score on a -2 to 2 scale */
  score: number;
  /** Spiritual mood state */
  state?: SpiritualMood;
  tags?: string[];
  note?: string;
  /** ISO date string (YYYY-MM-DD) */
  date?: string;
  /** ISO timestamp */
  at: string;
  /** KIAAN empathetic micro-response */
  kiaanResponse?: string;
}

export interface MoodCreatePayload {
  score: number;
  state?: SpiritualMood;
  tags?: string[];
  note?: string;
  date?: string;
}

/** Response from GET /api/mood/history */
export interface MoodHistoryResponse {
  entries: MoodEntry[];
  total: number;
}

/** AI-generated mood pattern insight */
export interface MoodInsight {
  pattern: string;
  suggestion: string;
  linkedVerses?: string[];
}

/** Response from GET /api/mood/insights */
export interface MoodInsightsResponse {
  insights: MoodInsight[];
  dominantMood?: SpiritualMood;
  averageScore?: number;
}

// ---------------------------------------------------------------------------
// Karma
// ---------------------------------------------------------------------------

/** A single node in the karma tree */
export interface KarmaNodeData {
  id: string;
  label: string;
  action: string;
  points: number;
  completed: boolean;
  /** Linked wisdom or verse reference */
  linkedWisdom?: string;
  completedAt?: string;
}

/** Karma tree level based on total points */
export type KarmaTreeLevel = 'seed' | 'sapling' | 'young_tree' | 'mighty_tree' | 'sacred_tree';

/** Response from GET /api/karma/tree */
export interface KarmaTreeResponse {
  nodes: KarmaNodeData[];
  totalPoints: number;
  level: KarmaTreeLevel;
}

/** Payload for POST /api/karma/award */
export interface KarmaAwardPayload {
  action: string;
  points: number;
}

// ---------------------------------------------------------------------------
// Journey
// ---------------------------------------------------------------------------

export type JourneyStatus = 'available' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface Journey {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  status: JourneyStatus;
  currentDay: number;
  completedSteps: number;
  category: string;
  thumbnailUrl?: string;
}

export interface JourneyStep {
  dayIndex: number;
  title: string;
  content: string;
  verseRef?: string;
  reflection?: string;
  isCompleted: boolean;
}

export interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  thumbnailUrl?: string;
}

// ---------------------------------------------------------------------------
// Wisdom Journey (structured learning paths)
// ---------------------------------------------------------------------------

/** Step type in a wisdom journey */
export type JourneyStepType = 'lesson' | 'practice' | 'reflection' | 'quiz';

/** Difficulty level for journey templates */
export type JourneyDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Category for wisdom journey paths */
export type JourneyCategory = 'beginner_paths' | 'deep_dives' | '21_day_challenges';

/** A step within a wisdom journey with type-specific content */
export interface WisdomJourneyStep {
  id: string;
  dayIndex: number;
  title: string;
  type: JourneyStepType;
  content: string;
  verseRef?: string;
  reflection?: string;
  isCompleted: boolean;
  /** XP earned for completing this step */
  xpReward: number;
  /** Karma points earned for completing this step */
  karmaReward: number;
}

/** Detailed journey with all steps and progress */
export interface WisdomJourneyDetail {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  status: JourneyStatus;
  currentDay: number;
  completedSteps: number;
  category: JourneyCategory;
  difficulty: JourneyDifficulty;
  thumbnailUrl?: string;
  steps: WisdomJourneyStep[];
  totalXp: number;
  earnedXp: number;
}

/** Response from POST /api/journeys/:id/steps/:stepId/complete */
export interface StepCompletionResult {
  success: boolean;
  xp: number;
  karmaPoints: number;
  progress: number;
  journeyCompleted: boolean;
}

/** User progress across all journeys */
export interface UserJourneyProgress {
  journeyId: string;
  title: string;
  category: JourneyCategory;
  completedSteps: number;
  totalSteps: number;
  earnedXp: number;
  totalXp: number;
  status: JourneyStatus;
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export interface SyncQueueItem {
  id: string;
  type: 'mood' | 'journal' | 'journey_step' | 'chat_message' | 'sadhana' | 'community_post' | 'community_reaction';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

export interface TokenManager {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  /** Called when token refresh fails — signals the store to force logout. */
  onAuthFailure?: (() => void) | undefined;
}

// ---------------------------------------------------------------------------
// Emotional Reset
// ---------------------------------------------------------------------------

export type EmotionalResetStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface EmotionalResetSession {
  session_id: string;
  emotion: string;
  intensity: number;
  current_step: EmotionalResetStep;
  breathing_pattern: { inhale: number; hold_in: number; exhale: number; hold_out: number };
  wisdom_verse?: { chapter: number; verse: number; sanskrit: string; translation: string; application: string };
  affirmations?: string[];
  visualization_guidance?: string;
  summary?: { key_insight: string; recommended_practice: string; verse_ref: string };
}

export interface EmotionalResetStepData {
  step_number: EmotionalResetStep;
  response_data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Karma Reset
// ---------------------------------------------------------------------------

export type KarmaResetPhase = 'acknowledgment' | 'understanding' | 'release' | 'renewal';

export interface KarmaResetSession {
  session_id: string;
  phase: KarmaResetPhase;
  karmic_pattern: string;
  gita_wisdom?: { chapter: number; verse: number; text: string; application: string };
  release_guidance?: string;
  renewal_intention?: string;
  blessing_verse?: { sanskrit: string; translation: string };
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export interface CommunityCircle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  iconUrl?: string;
  isJoined: boolean;
  category: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  circleId?: string;
  tags: string[];
  reactionsCount: number;
  commentsCount: number;
  userReacted: boolean;
  createdAt: string;
}

export interface CreatePostPayload {
  content: string;
  circleId?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Wisdom Rooms
// ---------------------------------------------------------------------------

export interface WisdomRoom {
  id: string;
  topic: string;
  hostName: string;
  description: string;
  participantCount: number;
  isActive: boolean;
  scheduledAt?: string;
}

export interface WisdomRoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Sadhana (Daily Practice)
// ---------------------------------------------------------------------------

export interface SadhanaDaily {
  id: string;
  date: string;
  completed: boolean;
  phases_completed: string[];
  verse_id?: string;
  reflection?: string;
  intention?: string;
  mood_score?: number;
}

export interface SadhanaStreak {
  current: number;
  longest: number;
  totalDays: number;
  thisWeek: boolean[];
}

// ---------------------------------------------------------------------------
// Relationship Compass
// ---------------------------------------------------------------------------

export interface RelationshipCompassResult {
  guidance: string;
  gita_verse: { chapter: number; verse: number; text: string };
  dharma_principle: string;
  practical_steps: string[];
}

// ---------------------------------------------------------------------------
// Karma Footprint
// ---------------------------------------------------------------------------

export interface KarmaFootprintResult {
  total_karma: number;
  positive_actions: number;
  areas_of_growth: string[];
  ripple_effects: { action: string; impact: string; karma_points: number }[];
  gita_guidance: string;
}

// ---------------------------------------------------------------------------
// Viyoga & Ardha Tools
// ---------------------------------------------------------------------------

export interface ViyogaResult {
  guidance: string;
  verse: { chapter: number; verse: number; sanskrit: string; translation: string };
  practice: string;
  affirmation: string;
}

export interface ArdhaResult {
  original_perspective: string;
  reframed_perspective: string;
  verse: { chapter: number; verse: number; sanskrit: string; translation: string };
  insight: string;
}

// ---------------------------------------------------------------------------
// Deep Insights & Analytics
// ---------------------------------------------------------------------------

export interface DeepInsight {
  id: string;
  type: 'mood_pattern' | 'guna_analysis' | 'growth_area' | 'strength';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  verse_ref?: string;
}

export interface MoodTrend {
  date: string;
  averageScore: number;
  dominantMood: string;
  entryCount: number;
}

export interface WeeklyInsight {
  week: string;
  summary: string;
  mood_average: number;
  journeys_completed: number;
  sadhana_streak: number;
  top_insight: string;
  guna_balance: { sattva: number; rajas: number; tamas: number };
}

export interface AnalyticsDashboard {
  moodTrends: MoodTrend[];
  weeklyInsight: WeeklyInsight;
  deepInsights: DeepInsight[];
  streakDays: number;
  totalJourneys: number;
  completedJourneys: number;
}

// ---------------------------------------------------------------------------
// Meditation / Vibe Player
// ---------------------------------------------------------------------------

export interface MeditationTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  category: 'meditation' | 'chanting' | 'ambient' | 'mantra';
  audioUrl: string;
  artworkUrl?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Emotional Reset (extended response types)
// ---------------------------------------------------------------------------

export interface EmotionalResetStepResponse {
  step: number;
  guidance: string;
  verse?: { chapter: number; verse: number; text: string; translation: string };
  affirmations?: string[];
  visualization_prompt?: string;
  breathing_pattern?: { inhale: number; hold_in: number; exhale: number; hold_out: number };
}

export interface EmotionalResetSummary {
  session_id: string;
  emotion: string;
  key_insight: string;
  recommended_verse: { chapter: number; verse: number; text: string };
  affirmations: string[];
  next_steps: string[];
}

// ---------------------------------------------------------------------------
// Karma Reset (extended response types)
// ---------------------------------------------------------------------------

export interface KarmaResetPhaseResponse {
  phase: number;
  guidance: string;
  verse?: { chapter: number; verse: number; text: string; translation: string };
  practice?: string;
  intention_prompt?: string;
}

export interface KarmaResetCompletion {
  session_id: string;
  blessing: string;
  verse: { chapter: number; verse: number; text: string };
  karma_points_earned: number;
}

// ---------------------------------------------------------------------------
// Relationship Compass (extended guidance type)
// ---------------------------------------------------------------------------

export interface RelationshipGuidance {
  question: string;
  guidance: string;
  // verse is optional because the backend's /guide endpoint surfaces
  // citations as references only — full sanskrit + translation isn't
  // always reconstructable client-side.
  verse?: { chapter: number; verse: number; text: string; translation: string };
  dharma_principles: string[];
  reflection_prompts: string[];
}

// ---------------------------------------------------------------------------
// Karma Footprint (extended analysis type)
// ---------------------------------------------------------------------------

export interface KarmaFootprintAnalysis {
  total_karma_points: number;
  positive_actions: number;
  areas_of_growth: string[];
  ripple_effects: Array<{ action: string; impact: string; date: string }>;
  recommended_practices: string[];
}

// ---------------------------------------------------------------------------
// Viyoga & Ardha (extended response types)
// ---------------------------------------------------------------------------

export interface ViyogaResponse {
  message: string;
  session_id: string;
  verse?: { chapter: number; verse: number; text: string };
  practice?: string;
}

export interface ArdhaReframeResponse {
  original_situation: string;
  reframed_perspective: string;
  // Optional — the backend returns verse references in the `sources`
  // array but not always full Sanskrit + translation text.
  verse?: { chapter: number; verse: number; text: string; translation: string };
  affirmation: string;
}

// ---------------------------------------------------------------------------
// Deep Insights (extended analytics types)
// ---------------------------------------------------------------------------

export interface DeepInsightsSummary {
  mood_trends: Array<{ date: string; score: number }>;
  dominant_mood: string;
  mood_stability: number;
  recommendations: string[];
  linked_verses: Array<{ chapter: number; verse: number; relevance: string }>;
}

export interface GunaBalance {
  sattva: number;
  rajas: number;
  tamas: number;
  dominant_guna: 'sattva' | 'rajas' | 'tamas';
  guidance: string;
}

export interface EmotionalPattern {
  pattern_name: string;
  frequency: number;
  triggers: string[];
  healing_suggestion: string;
  verse_ref?: string;
}

// ---------------------------------------------------------------------------
// KarmaLytix (Sacred Mirror) — /api/analytics/weekly-report response shape.
//
// Snake_case throughout to match the Python route's Pydantic model. The
// ``patterns_detected`` payload carries the six structured reflection
// sections the mobile KarmaLytix screen renders (see
// apps/mobile/app/analytics/index.tsx). ``insufficient_data`` is true
// when fewer than 3 entries exist for the current week.
// ---------------------------------------------------------------------------

export interface KarmaLytixGitaEcho {
  chapter: number;
  verse: number;
  sanskrit: string;
  connection?: string;
}

export interface KarmaLytixReflection {
  mirror?: string;
  pattern?: string;
  gita_echo?: KarmaLytixGitaEcho;
  growth_edge?: string;
  blessing?: string;
  dynamic_wisdom?: string;
  active_count?: number;
}

export interface KarmaLytixJournalMetadataSummary {
  entry_count?: number;
  journaling_days?: number;
  mood_counts?: Record<string, number>;
  tag_frequencies?: Record<string, number>;
  unique_tag_count?: number;
  top_tags?: Array<[string, number]>;
  dominant_mood?: string | null;
  dominant_category?: string | null;
  dominant_time_of_day?: string | null;
  verse_bookmarks?: number;
  assessment_completed?: boolean;
}

export interface KarmaLytixComparison {
  overall_delta?: number;
  dimension_deltas?: Record<string, number>;
  is_first_report?: boolean;
}

export interface KarmaLytixWeeklyReport {
  id: number | null;
  report_date: string | null;
  report_type: string;
  period_start: string | null;
  period_end: string | null;
  karma_dimensions: Record<string, number>;
  overall_karma_score: number;
  journal_metadata_summary: KarmaLytixJournalMetadataSummary;
  kiaan_insight: string | null;
  recommended_verses: Array<Record<string, unknown>>;
  patterns_detected: KarmaLytixReflection & Record<string, unknown>;
  comparison_to_previous: KarmaLytixComparison;
  insufficient_data: boolean;
  entries_needed: number;
  message: string | null;
}

// ---------------------------------------------------------------------------
// Journal (extended for mobile)
// ---------------------------------------------------------------------------

export interface JournalEntry {
  id: string;
  title?: string;
  content_encrypted: string;
  content_preview?: string;
  tags: string[];
  mood_tag?: string;
  created_at: string;
  updated_at?: string;
}

export interface JournalListResponse {
  entries: JournalEntry[];
  total: number;
}

// ---------------------------------------------------------------------------
// Sadhana (extended record type)
// ---------------------------------------------------------------------------

export interface SadhanaRecord {
  id: string;
  date: string;
  mood_score: number | null;
  verse_id: string | null;
  reflection: string | null;
  intention: string | null;
  completed_at: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface UserSettings {
  language: string;
  theme: 'dark' | 'light' | 'auto';
  notifications_enabled: boolean;
  biometric_enabled: boolean;
  offline_mode: boolean;
  journal_encryption: boolean;
  daily_reminder_time?: string;
}
