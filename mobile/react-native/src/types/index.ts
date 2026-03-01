/**
 * Core type definitions for MindVibe Mobile
 *
 * Re-exports from the shared web types where compatible,
 * and defines mobile-specific types.
 */

// ---------------------------------------------------------------------------
// Navigation Types
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  JourneysTab: undefined;
  VibeTab: undefined;
  SakhaTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  VerseDetail: { chapter: number; verse: number };
  MoodLog: undefined;
  Insights: undefined;
};

export type JourneyStackParamList = {
  JourneyCatalog: undefined;
  JourneyDetail: { journeyId: string };
  JourneyDay: { journeyId: string; dayIndex: number };
  JourneyCompletion: { journeyId: string };
};

export type VibeStackParamList = {
  VibePlayer: undefined;
  Playlist: { playlistId?: string };
  Queue: undefined;
  Downloads: undefined;
};

export type SakhaStackParamList = {
  SakhaCompanion: undefined;
  SakhaVoice: undefined;
  SakhaHistory: undefined;
  SakhaInsights: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Journal: undefined;
  Analytics: undefined;
  Settings: undefined;
  Privacy: undefined;
};

// ---------------------------------------------------------------------------
// User & Auth Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  locale: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

// ---------------------------------------------------------------------------
// Gita Verse Types
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

// ---------------------------------------------------------------------------
// Mood Types
// ---------------------------------------------------------------------------

export type Emotion =
  | 'peaceful'
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'lost'
  | 'overwhelmed'
  | 'grateful'
  | 'happy'
  | 'tired'
  | 'confused';

export interface MoodEntry {
  id: string;
  emotion: Emotion;
  intensity: number; // 1-10
  note?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Journey Types
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

// ---------------------------------------------------------------------------
// Offline Sync Types
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
