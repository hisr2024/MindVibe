/**
 * TanStack Query hooks wrapping Kiaanverse API endpoints.
 *
 * Each hook returns typed { data, isLoading, error } and handles
 * caching, refetching, and background updates automatically.
 *
 * Offline-first:
 * - Gita verse queries use gitaCache (AsyncStorage, 7-day TTL, LRU 50 entries)
 *   as a fallback when the network request fails. On success, the cache is updated.
 * - React Query's own AsyncStorage persister handles general query caching (24h).
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { api } from './endpoints';
import { gitaCache } from './cache/gitaCache';
import type {
  GitaChapter,
  GitaChapterDetail,
  GitaSearchResponse,
  GitaTranslationSet,
  GitaVerse,
  GitaVerseResponse,
  Journey,
  JourneyTemplate,
  KarmaTreeResponse,
  MoodCreatePayload,
  MoodHistoryResponse,
  MoodInsightsResponse,
  StepCompletionResult,
  UserJourneyProgress,
  WisdomJourneyDetail,
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
  journeyDetail: (id: string) => ['journeys', 'detail', id] as const,
  journeyProgress: ['journeys', 'progress'] as const,
  journeyDashboard: ['journeys', 'dashboard'] as const,
  chatSessions: ['chat', 'sessions'] as const,
  chatHistory: (sessionId?: string) => ['chat', 'history', sessionId] as const,
  analytics: ['analytics', 'dashboard'] as const,
  moodHistory: (days: number) => ['mood', 'history', days] as const,
  moodInsights: ['mood', 'insights'] as const,
  karmaTree: ['karma', 'tree'] as const,
  subscriptionCurrent: ['subscription', 'current'] as const,
} as const;

// ---------------------------------------------------------------------------
// Gita Cache Helpers — fetch from API with AsyncStorage fallback
// ---------------------------------------------------------------------------

/**
 * Fetch data from API, cache on success, fall back to cache on failure.
 * This gives offline-first behavior for Gita content.
 */
async function fetchWithGitaCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fetcher();
    // Cache the fresh result for offline access
    void gitaCache.setVerse(cacheKey, result);
    return result;
  } catch (error) {
    // Network failed — try the offline cache
    const cached = await gitaCache.getVerse<T>(cacheKey);
    if (cached !== null) return cached;
    // No cache available — re-throw the original error
    throw error;
  }
}

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
// Gita (offline-first with gitaCache fallback)
// ---------------------------------------------------------------------------

export function useGitaChapters(): UseQueryResult<GitaChapter[]> {
  return useQuery({
    queryKey: queryKeys.gitaChapters,
    queryFn: () =>
      fetchWithGitaCache('chapters:all', async () => {
        const { data } = await api.gita.chapters();
        const raw = data as Array<{ chapter: number; name: string; summary: string; verse_count: number }>;
        return raw.map((ch): GitaChapter => ({
          id: ch.chapter,
          title: ch.name,
          versesCount: ch.verse_count,
          summary: ch.summary,
        }));
      }),
    staleTime: 1000 * 60 * 60, // Chapters rarely change — cache 1 hour
  });
}

export function useGitaChapter(chapterId: number): UseQueryResult<ChapterDetail> {
  return useQuery({
    queryKey: queryKeys.gitaChapter(chapterId),
    queryFn: () =>
      fetchWithGitaCache(`chapter:${chapterId}`, async () => {
        const { data } = await api.gita.chapter(chapterId);
        const raw = data as { chapter: number; name: string; summary: string; verse_count: number; verses: GitaVerse[]; themes: string[] };
        return {
          id: raw.chapter,
          title: raw.name,
          versesCount: raw.verse_count,
          summary: raw.summary,
          verses: raw.verses ?? [],
        } as ChapterDetail;
      }),
    staleTime: 1000 * 60 * 60,
  });
}

export function useGitaVerse(chapter: number, verse: number): UseQueryResult<GitaVerse> {
  return useQuery({
    queryKey: queryKeys.gitaVerse(chapter, verse),
    queryFn: () =>
      fetchWithGitaCache(`verse:${chapter}:${verse}`, async () => {
        const { data } = await api.gita.verse(chapter, verse);
        const raw = data as { verse: { chapter: number; verse: number; verse_id: string; sanskrit: string; english: string; hindi: string; theme: string } };
        const v = raw.verse;
        return {
          id: v.verse_id,
          chapter: v.chapter,
          verse: v.verse,
          sanskrit: v.sanskrit,
          transliteration: '',
          translation: v.english,
        } as GitaVerse;
      }),
    staleTime: 1000 * 60 * 60,
  });
}

export function useGitaSearch(query: string): UseQueryResult<GitaVerse[]> {
  return useQuery({
    queryKey: queryKeys.gitaSearch(query),
    queryFn: async () => {
      const { data } = await api.gita.search(query);
      const raw = data as { results?: Array<{ verse: { chapter: number; verse: number; verse_id: string; sanskrit: string; english: string; hindi: string; theme: string } }> };
      if (!raw.results) return [];
      return raw.results.map((r): GitaVerse => ({
        id: r.verse.verse_id,
        chapter: r.verse.chapter,
        verse: r.verse.verse,
        sanskrit: r.verse.sanskrit,
        transliteration: '',
        translation: r.verse.english,
      }));
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
    queryFn: () =>
      fetchWithGitaCache(`verseDetail:${chapter}:${verse}`, async () => {
        const { data } = await api.gita.verse(chapter, verse);
        return data as GitaVerseResponse;
      }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — verses are immutable
    enabled: chapter > 0 && verse > 0,
  });
}

/** All translations for a verse. */
export function useGitaTranslations(verseId: string): UseQueryResult<GitaTranslationSet> {
  return useQuery({
    queryKey: queryKeys.gitaTranslations(verseId),
    queryFn: () =>
      fetchWithGitaCache(`translations:${verseId}`, async () => {
        const { data } = await api.gita.translations(verseId);
        return data as GitaTranslationSet;
      }),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: verseId.length > 0,
  });
}

/** Chapter detail with verse listing — uses the existing useGitaChapter with proper typing. */
export function useGitaChapterDetail(chapterId: number): UseQueryResult<GitaChapterDetail> {
  return useQuery({
    queryKey: queryKeys.gitaChapter(chapterId),
    queryFn: () =>
      fetchWithGitaCache(`chapterDetail:${chapterId}`, async () => {
        const { data } = await api.gita.chapter(chapterId);
        return data as GitaChapterDetail;
      }),
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

/** Full wisdom journey detail with all steps. */
export function useWisdomJourneyDetail(journeyId: string): UseQueryResult<WisdomJourneyDetail> {
  return useQuery({
    queryKey: queryKeys.journeyDetail(journeyId),
    queryFn: async () => {
      const { data } = await api.journeys.detail(journeyId);
      return data as WisdomJourneyDetail;
    },
    staleTime: 1000 * 60 * 5,
    enabled: journeyId.length > 0,
  });
}

/** User progress across all journeys (via dashboard). */
export function useJourneyProgress(): UseQueryResult<UserJourneyProgress[]> {
  return useQuery({
    queryKey: queryKeys.journeyProgress,
    queryFn: async () => {
      const { data } = await api.journeys.dashboard();
      return data as UserJourneyProgress[];
    },
    staleTime: 1000 * 60 * 5,
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

/** Complete a wisdom journey step by day index (returns XP + karma). */
export function useCompleteWisdomStep(): UseMutationResult<StepCompletionResult, Error, { journeyId: string; dayIndex: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, dayIndex }: { journeyId: string; dayIndex: number }) => {
      const { data } = await api.journeys.completeStepByDay(journeyId, dayIndex);
      return data as StepCompletionResult;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journeyDetail(variables.journeyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journeyProgress });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journeyDashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.karmaTree });
    },
  });
}

export function useCreateMood(): UseMutationResult<MoodResult, Error, MoodCreatePayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mood: MoodCreatePayload) => {
      const { data } = await api.moods.create(mood);
      return data as MoodResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mood'] });
    },
  });
}

/** Mood history for the last N days. */
export function useMoodHistory(days: number = 30): UseQueryResult<MoodHistoryResponse> {
  return useQuery({
    queryKey: queryKeys.moodHistory(days),
    queryFn: async () => {
      const { data } = await api.moods.history(days);
      return data as MoodHistoryResponse;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** AI-generated mood pattern insights. */
export function useMoodInsights(): UseQueryResult<MoodInsightsResponse> {
  return useQuery({
    queryKey: queryKeys.moodInsights,
    queryFn: async () => {
      const { data } = await api.moods.insights();
      return data as MoodInsightsResponse;
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** Karma tree with all nodes. */
export function useKarmaTree(): UseQueryResult<KarmaTreeResponse> {
  return useQuery({
    queryKey: queryKeys.karmaTree,
    queryFn: async () => {
      const { data } = await api.karma.tree();
      return data as KarmaTreeResponse;
    },
    staleTime: 1000 * 60 * 10,
  });
}

/** Unlock a karma achievement. */
export function useUnlockKarma(): UseMutationResult<KarmaTreeResponse, Error, { achievementId: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ achievementId }: { achievementId: string }) => {
      const { data } = await api.karma.unlock(achievementId);
      return data as KarmaTreeResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.karmaTree });
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
