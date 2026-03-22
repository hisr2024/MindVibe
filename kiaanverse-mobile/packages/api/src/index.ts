/**
 * @kiaanverse/api — API client and typed endpoints
 */

export { apiClient, setTokenManager } from './client';
export { api } from './endpoints';
export { API_CONFIG } from './config';
export { authService, AuthError } from './auth/authService';
export type { AuthErrorCode, RegisterData, LoginResult } from './auth/authService';

// Types
export type {
  User,
  SubscriptionTier,
  AuthTokens,
  AuthResponse,
  ProfileResponse,
  LoginResponse,
  SignupResponse,
  MeResponse,
  RefreshResponse,
  GitaVerse,
  GitaChapter,
  GitaVerseDetail,
  GitaVerseReference,
  GitaVerseResponse,
  GitaVerseSummary,
  GitaChapterDetail,
  GitaSearchResult,
  GitaSearchResponse,
  GitaTranslationSet,
  SpiritualMood,
  MoodEntry,
  MoodCreatePayload,
  MoodHistoryResponse,
  MoodInsight,
  MoodInsightsResponse,
  KarmaNodeData,
  KarmaTreeLevel,
  KarmaTreeResponse,
  KarmaAwardPayload,
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
  useGitaSearchFull,
  useGitaVerseDetail,
  useGitaTranslations,
  useGitaChapterDetail,
  useJourneyTemplates,
  useJourneys,
  useJourney,
  useJourneyDashboard,
  useStartJourney,
  useCompleteStep,
  useCreateMood,
  useMoodHistory,
  useMoodInsights,
  useKarmaTree,
  useAwardKarma,
  useSendChatMessage,
} from './hooks';
