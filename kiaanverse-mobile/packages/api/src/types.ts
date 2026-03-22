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

export type SubscriptionTier = 'FREE' | 'SADHAK' | 'SIDDHA';

/**
 * POST /api/auth/login response (LoginOut).
 *
 * The refresh_token is NOT in the response body — it is set as an
 * httpOnly cookie by the backend. Mobile clients must extract it from
 * the Set-Cookie header or rely on native cookie storage.
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  session_id: string;
  expires_in: number;
  user_id: string;
  email: string;
  email_verified: boolean;
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

// ---------------------------------------------------------------------------
// Mood
// ---------------------------------------------------------------------------

export interface MoodEntry {
  id: number;
  /** Mood score on a -2 to 2 scale */
  score: number;
  tags?: string[];
  note?: string;
  /** ISO timestamp */
  at: string;
  /** KIAAN empathetic micro-response */
  kiaanResponse?: string;
}

export interface MoodCreatePayload {
  score: number;
  tags?: string[];
  note?: string;
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
