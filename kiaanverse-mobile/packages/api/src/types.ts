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
  type: 'mood' | 'journal' | 'journey_step' | 'chat_message';
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
