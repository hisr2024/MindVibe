/**
 * Core API types for Kiaanverse
 *
 * Mirrors the type definitions from the MindVibe mobile app.
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

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user_id?: string;
  id?: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name?: string;
  locale?: string;
  subscription_tier?: string;
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
  onAuthFailure?: () => void;
}
