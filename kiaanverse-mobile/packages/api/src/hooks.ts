/**
 * TanStack Query hooks wrapping Kiaanverse API endpoints.
 *
 * Each hook returns typed { data, isLoading, error } and handles
 * caching, refetching, and background updates automatically.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { api } from './endpoints';
import type {
  GitaChapter,
  GitaChapterDetail,
  GitaSearchResponse,
  GitaTranslationSet,
  GitaVerse,
  GitaVerseResponse,
  Journey,
  JourneyTemplate,
  MoodCreatePayload,
} from './types';

// ---------------------------------------------------------------------------
// Shared return types for declaration emit compatibility
// ---------------------------------------------------------------------------

type ProfileData = { id: string; email: string; name?: string; locale?: string; subscription_tier?: string; created_at: string };
type ChapterDetail = GitaChapter & { verses: GitaVerse[] };
type DashboardData = { activeJourneys: Journey[]; completedCount: number; streakDays: number };
type StepResult = { success: boolean; progress: number };
type MoodResult = { id: number; kiaanResponse?: string };
type ChatResult = { response: string; session_id: string };

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  profile: ['profile'] as const,
  gitaChapters: ['gita', 'chapters'] as const,
  gitaChapter: (id: number) => ['gita', 'chapter', id] as const,
  gitaVerse: (chapter: number, verse: number) => ['gita', 'verse', chapter, verse] as const,
  gitaSearch: (query: string) => ['gita', 'search', query] as const,
  gitaSearchFull: (keyword: string) => ['gita', 'searchFull', keyword] as const,
  gitaVerseDetail: (chapter: number, verse: number) => ['gita', 'verseDetail', chapter, verse] as const,
  gitaTranslations: (verseId: string) => ['gita', 'translations', verseId] as const,
  journeyTemplates: ['journeys', 'templates'] as const,
  journeys: (status?: string) => ['journeys', 'list', status] as const,
  journey: (id: string) => ['journeys', 'detail', id] as const,
  journeyDashboard: ['journeys', 'dashboard'] as const,
  chatSessions: ['chat', 'sessions'] as const,
  chatHistory: (sessionId?: string) => ['chat', 'history', sessionId] as const,
  analytics: ['analytics', 'dashboard'] as const,
  subscriptionCurrent: ['subscription', 'current'] as const,
} as const;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function useProfile(): UseQueryResult<ProfileData> {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const { data } = await api.profile.me();
      return data as ProfileData;
    },
  });
}

// ---------------------------------------------------------------------------
// Gita
// ---------------------------------------------------------------------------

export function useGitaChapters(): UseQueryResult<GitaChapter[]> {
  return useQuery({
    queryKey: queryKeys.gitaChapters,
    queryFn: async () => {
      const { data } = await api.gita.chapters();
      return data as GitaChapter[];
    },
    staleTime: 1000 * 60 * 60, // Chapters rarely change — cache 1 hour
  });
}

export function useGitaChapter(chapterId: number): UseQueryResult<ChapterDetail> {
  return useQuery({
    queryKey: queryKeys.gitaChapter(chapterId),
    queryFn: async () => {
      const { data } = await api.gita.chapter(chapterId);
      return data as ChapterDetail;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useGitaVerse(chapter: number, verse: number): UseQueryResult<GitaVerse> {
  return useQuery({
    queryKey: queryKeys.gitaVerse(chapter, verse),
    queryFn: async () => {
      const { data } = await api.gita.verse(chapter, verse);
      return data as GitaVerse;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useGitaSearch(query: string): UseQueryResult<GitaVerse[]> {
  return useQuery({
    queryKey: queryKeys.gitaSearch(query),
    queryFn: async () => {
      const { data } = await api.gita.search(query);
      return data as GitaVerse[];
    },
    enabled: query.length >= 2,
  });
}

/** Full search with pagination — enabled only when keyword >= 3 chars. */
export function useGitaSearchFull(keyword: string): UseQueryResult<GitaSearchResponse> {
  return useQuery({
    queryKey: queryKeys.gitaSearchFull(keyword),
    queryFn: async () => {
      const { data } = await api.gita.searchFull(keyword);
      return data as GitaSearchResponse;
    },
    enabled: keyword.length >= 3,
    staleTime: 1000 * 60 * 5,
  });
}

/** Detailed verse with related verses from backend. */
export function useGitaVerseDetail(chapter: number, verse: number): UseQueryResult<GitaVerseResponse> {
  return useQuery({
    queryKey: queryKeys.gitaVerseDetail(chapter, verse),
    queryFn: async () => {
      const { data } = await api.gita.verse(chapter, verse);
      return data as GitaVerseResponse;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — verses are immutable
    enabled: chapter > 0 && verse > 0,
  });
}

/** All translations for a verse. */
export function useGitaTranslations(verseId: string): UseQueryResult<GitaTranslationSet> {
  return useQuery({
    queryKey: queryKeys.gitaTranslations(verseId),
    queryFn: async () => {
      const { data } = await api.gita.translations(verseId);
      return data as GitaTranslationSet;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: verseId.length > 0,
  });
}

/** Chapter detail with verse listing — uses the existing useGitaChapter with proper typing. */
export function useGitaChapterDetail(chapterId: number): UseQueryResult<GitaChapterDetail> {
  return useQuery({
    queryKey: queryKeys.gitaChapter(chapterId),
    queryFn: async () => {
      const { data } = await api.gita.chapter(chapterId);
      return data as GitaChapterDetail;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: chapterId > 0 && chapterId <= 18,
  });
}

// ---------------------------------------------------------------------------
// Journeys
// ---------------------------------------------------------------------------

export function useJourneyTemplates(): UseQueryResult<JourneyTemplate[]> {
  return useQuery({
    queryKey: queryKeys.journeyTemplates,
    queryFn: async () => {
      const { data } = await api.journeys.templates();
      return data as JourneyTemplate[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useJourneys(status?: string): UseQueryResult<Journey[]> {
  return useQuery({
    queryKey: queryKeys.journeys(status),
    queryFn: async () => {
      const { data } = await api.journeys.list(status);
      return data as Journey[];
    },
  });
}

export function useJourney(journeyId: string): UseQueryResult<Journey> {
  return useQuery({
    queryKey: queryKeys.journey(journeyId),
    queryFn: async () => {
      const { data } = await api.journeys.get(journeyId);
      return data as Journey;
    },
    enabled: journeyId.length > 0,
  });
}

export function useJourneyDashboard(): UseQueryResult<DashboardData> {
  return useQuery({
    queryKey: queryKeys.journeyDashboard,
    queryFn: async () => {
      const { data } = await api.journeys.dashboard();
      return data as DashboardData;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useStartJourney(): UseMutationResult<Journey, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await api.journeys.start(templateId);
      return data as Journey;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useCompleteStep(): UseMutationResult<StepResult, Error, { journeyId: string; dayIndex: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, dayIndex }: { journeyId: string; dayIndex: number }) => {
      const { data } = await api.journeys.completeStep(journeyId, dayIndex);
      return data as StepResult;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journey(variables.journeyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journeyDashboard });
    },
  });
}

export function useCreateMood(): UseMutationResult<MoodResult, Error, MoodCreatePayload> {
  return useMutation({
    mutationFn: async (mood: MoodCreatePayload) => {
      const { data } = await api.moods.create(mood);
      return data as MoodResult;
    },
  });
}

export function useSendChatMessage(): UseMutationResult<ChatResult, Error, { message: string; sessionId?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      const { data } = await api.chat.send(message, sessionId);
      return data as ChatResult;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory(variables.sessionId) });
    },
  });
}
