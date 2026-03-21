/**
 * @kiaanverse/api — API client and typed endpoints
 */

export { apiClient, setTokenManager } from './client';
export { api } from './endpoints';
export { API_CONFIG } from './config';

// Types
export type {
  User,
  SubscriptionTier,
  AuthTokens,
  AuthResponse,
  ProfileResponse,
  GitaVerse,
  GitaChapter,
  MoodEntry,
  MoodCreatePayload,
  Journey,
  JourneyStep,
  JourneyTemplate,
  JourneyStatus,
  SyncStatus,
  SyncQueueItem,
  TokenManager,
} from './types';

// TanStack Query hooks
export {
  queryKeys,
  useProfile,
  useGitaChapters,
  useGitaChapter,
  useGitaVerse,
  useGitaSearch,
  useJourneyTemplates,
  useJourneys,
  useJourney,
  useJourneyDashboard,
  useStartJourney,
  useCompleteStep,
  useCreateMood,
  useSendChatMessage,
} from './hooks';
