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
  AnalyticsDashboard,
  ArdhaResult,
  ArdhaReframeResponse,
  CommunityCircle,
  CommunityPost,
  DeepInsight,
  DeepInsightsSummary,
  EmotionalResetSession,
  EmotionalResetStepResponse,
  EmotionalPattern,
  GitaChapter,
  GitaChapterDetail,
  GitaSearchResponse,
  GitaTranslationSet,
  GitaVerse,
  GitaVerseResponse,
  GunaBalance,
  Journey,
  JourneyTemplate,
  JournalEntry,
  JournalListResponse,
  KarmaFootprintResult,
  KarmaResetSession,
  KarmaTreeResponse,
  MeditationTrack,
  MoodCreatePayload,
  MoodTrend,
  RelationshipCompassResult,
  RelationshipGuidance,
  SadhanaDaily,
  SadhanaRecord,
  SadhanaStreak,
  StepCompletionResult,
  UserJourneyProgress,
  UserSettings,
  ViyogaResult,
  ViyogaResponse,
  WeeklyInsight,
  WisdomJourneyDetail,
  WisdomRoom,
  WisdomRoomMessage,
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
  karmaTree: ['karma', 'tree'] as const,
  subscriptionCurrent: ['subscription', 'current'] as const,
  emotionalReset: (sessionId: string) => ['emotionalReset', sessionId] as const,
  communityCircles: ['community', 'circles'] as const,
  communityPosts: (circleId?: string) => ['community', 'posts', circleId] as const,
  wisdomRooms: ['wisdomRooms'] as const,
  wisdomRoomMessages: (roomId: string) => ['wisdomRooms', 'messages', roomId] as const,
  sadhanaDaily: ['sadhana', 'daily'] as const,
  sadhanaStreak: ['sadhana', 'streak'] as const,
  sadhanaHistory: ['sadhana', 'history'] as const,
  karmaFootprint: ['karmaFootprint'] as const,
  meditationTracks: (category?: string) => ['meditation', 'tracks', category] as const,
  deepInsights: ['deepInsights'] as const,
  gunaBalance: ['gunaBalance'] as const,
  emotionalPatterns: (days?: number) => ['emotionalPatterns', days] as const,
  moodTrends: (days?: number) => ['analytics', 'moodTrends', days] as const,
  weeklyInsights: ['analytics', 'weeklyInsights'] as const,
  journalEntries: ['journal', 'entries'] as const,
  journalEntry: (id: string) => ['journal', 'entry', id] as const,
  settings: ['settings'] as const,
  privacyStatus: ['privacy', 'status'] as const,
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
    // Skip while the route params are still resolving — otherwise the first
    // render fires with "NaN.NaN" because chapter/verse numbers haven't
    // parsed yet, which the backend rejects with HTTP 400.
    enabled: verseId.length > 0 && !verseId.includes('NaN') && !verseId.includes('undefined'),
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
      const { data } = await api.journeys.completeStep(journeyId, dayIndex);
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

// ---------------------------------------------------------------------------
// Emotional Reset
// ---------------------------------------------------------------------------

/** Fetch step-specific data for a given step in an emotional reset session.
 *  NOTE: backend/routes/emotional_reset.py exposes only POST /step and
 *  GET /session/{session_id} — there is no GET /step/{n}. Disabled until
 *  the backend ships a read-only per-step endpoint; screens should render
 *  step content from the last POST /step response instead. */
export function useEmotionalResetStepData(sessionId: string, stepNumber: number): UseQueryResult<EmotionalResetStepResponse> {
  return useQuery({
    queryKey: ['emotionalReset', 'step', sessionId, stepNumber] as const,
    queryFn: async () => {
      const { data } = await api.emotionalReset.getStep(sessionId, stepNumber);
      return data as EmotionalResetStepResponse;
    },
    enabled: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStartEmotionalReset(): UseMutationResult<EmotionalResetSession, Error, { emotion: string; intensity: number }> {
  return useMutation({
    mutationFn: async ({ emotion, intensity }) => {
      const { data } = await api.emotionalReset.start(emotion, intensity);
      return data as EmotionalResetSession;
    },
  });
}

export function useEmotionalResetStep(): UseMutationResult<EmotionalResetSession, Error, { sessionId: string; stepData: Record<string, unknown> }> {
  return useMutation({
    mutationFn: async ({ sessionId, stepData }) => {
      const { data } = await api.emotionalReset.step(sessionId, stepData);
      return data as EmotionalResetSession;
    },
  });
}

export function useCompleteEmotionalReset(): UseMutationResult<EmotionalResetSession, Error, { sessionId: string }> {
  return useMutation({
    mutationFn: async ({ sessionId }) => {
      const { data } = await api.emotionalReset.complete(sessionId);
      return data as EmotionalResetSession;
    },
  });
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export function useCommunityCircles(): UseQueryResult<CommunityCircle[]> {
  return useQuery({
    queryKey: queryKeys.communityCircles,
    queryFn: async () => {
      const { data } = await api.community.circles();
      return data as CommunityCircle[];
    },
  });
}

// NOTE: backend has no global community feed — posts are scoped to a
// circle (GET /api/community/circles/{id}/posts). When no circleId is
// provided, the query is disabled so we don't hit a 404 on every
// Community-tab render; the UI should show an empty "pick a circle"
// state. Once a global feed endpoint ships, remove the enabled gate.
export function useCommunityPosts(circleId?: string): UseQueryResult<CommunityPost[]> {
  return useQuery({
    queryKey: queryKeys.communityPosts(circleId),
    queryFn: async () => {
      const { data } = await api.community.posts(circleId ?? '');
      return data as CommunityPost[];
    },
    enabled: !!circleId && circleId.length > 0,
  });
}

export function useJoinCircle(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleId: string) => {
      await api.community.joinCircle(circleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.communityCircles });
    },
  });
}

export function useCreatePost(): UseMutationResult<CommunityPost, Error, { content: string; circle_id?: string; tags?: string[] }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.community.createPost(payload.content, payload.circle_id, payload.tags);
      return data as CommunityPost;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useReactToPost(): UseMutationResult<void, Error, { postId: string; reaction: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, reaction }) => {
      await api.community.reactToPost(postId, reaction);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Wisdom Rooms
// ---------------------------------------------------------------------------

// Backend (chat_rooms.py) returns { id, slug, name, theme, active_count }.
// Map it into the WisdomRoom shape the UI renders. `isActive` is true
// whenever at least one participant is present — the raw rooms table
// has no explicit "active" flag.
export function useWisdomRooms(): UseQueryResult<WisdomRoom[]> {
  return useQuery({
    queryKey: queryKeys.wisdomRooms,
    queryFn: async () => {
      const { data } = await api.wisdomRooms.list();
      const raw = data as Array<{
        id: string;
        slug?: string;
        name?: string;
        theme?: string;
        active_count?: number;
      }>;
      return raw.map((room): WisdomRoom => ({
        id: room.id,
        topic: room.name ?? room.slug ?? 'Wisdom Room',
        hostName: 'KIAAN',
        description: room.theme ?? '',
        participantCount: room.active_count ?? 0,
        isActive: (room.active_count ?? 0) > 0,
      }));
    },
  });
}

// Backend returns messages with fields { id, user_id, content, created_at, ... }.
// Normalise into the WisdomRoomMessage shape the UI expects.
export function useWisdomRoomMessages(roomId: string): UseQueryResult<WisdomRoomMessage[]> {
  return useQuery({
    queryKey: queryKeys.wisdomRoomMessages(roomId),
    queryFn: async () => {
      const { data } = await api.wisdomRooms.messages(roomId);
      const raw = data as Array<{
        id: string;
        user_id?: string;
        sender_name?: string;
        content: string;
        created_at?: string;
      }>;
      return raw.map((m): WisdomRoomMessage => ({
        id: m.id,
        senderId: m.user_id ?? '',
        senderName: m.sender_name ?? 'Seeker',
        content: m.content,
        timestamp: m.created_at ?? new Date().toISOString(),
      }));
    },
    enabled: roomId.length > 0,
    refetchInterval: 5000,
  });
}

// NOTE: the backend sends room messages over a WebSocket
// (`/api/rooms/{id}/ws`) — there is no REST POST endpoint. This
// mutation is a no-op stub so the chat input stays wired; once the
// WS bridge lands the real call can replace the stub.
export function useSendWisdomRoomMessage(): UseMutationResult<void, Error, { roomId: string; content: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars) => {
      /* no-op until WS client is wired */
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wisdomRoomMessages(variables.roomId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Sadhana
// ---------------------------------------------------------------------------

// NOTE: backend/routes/sadhana_api.py currently exposes only POST /compose,
// POST /complete and GET /health. The /daily, /streak and /history GET
// endpoints the hooks below expect return 405 Method Not Allowed until the
// backend routes are added. We disable the queries so they don't spam
// errors on every home-screen render; re-enable once the backend ships
// those routes.
export function useSadhanaDaily(): UseQueryResult<SadhanaDaily> {
  return useQuery({
    queryKey: queryKeys.sadhanaDaily,
    queryFn: async () => {
      const { data } = await api.sadhana.daily();
      return data as SadhanaDaily;
    },
    enabled: false,
  });
}

export function useSadhanaStreak(): UseQueryResult<SadhanaStreak> {
  return useQuery({
    queryKey: queryKeys.sadhanaStreak,
    queryFn: async () => {
      const { data } = await api.sadhana.streak();
      return data as SadhanaStreak;
    },
    enabled: false,
  });
}

export function useCompleteSadhana(): UseMutationResult<SadhanaDaily, Error, { verse_id?: string; reflection?: string; intention?: string; mood_score?: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.sadhana.complete(payload);
      return data as SadhanaDaily;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sadhanaDaily });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sadhanaStreak });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sadhanaHistory });
    },
  });
}

export function useSadhanaHistory(limit?: number): UseQueryResult<SadhanaRecord[]> {
  return useQuery({
    queryKey: queryKeys.sadhanaHistory,
    queryFn: async () => {
      const { data } = await api.sadhana.history(limit);
      return data as SadhanaRecord[];
    },
    staleTime: 1000 * 60 * 5,
    // See note above useSadhanaDaily — backend route does not exist yet.
    enabled: false,
  });
}

// ---------------------------------------------------------------------------
// Relationship Compass
// ---------------------------------------------------------------------------

export function useRelationshipCompass(): UseMutationResult<RelationshipCompassResult, Error, { question: string; context?: string }> {
  return useMutation({
    mutationFn: async ({ question, context }) => {
      const { data } = await api.relationship.guide(question, context);
      return data as RelationshipCompassResult;
    },
  });
}

/** Relationship guidance returning extended RelationshipGuidance type. */
export function useRelationshipGuide(): UseMutationResult<RelationshipGuidance, Error, { question: string; context?: string }> {
  return useMutation({
    mutationFn: async ({ question, context }) => {
      const { data } = await api.relationship.guide(question, context);
      return data as RelationshipGuidance;
    },
  });
}

// ---------------------------------------------------------------------------
// Karma Footprint
// ---------------------------------------------------------------------------

// NOTE: backend/routes/karma_footprint.py exposes only POST /analyze
// (requires { actions: string[] }) and GET /health. The mobile hook
// is a GET with no body and expects a completely different response
// shape ({ total_karma, positive_actions, ripple_effects, ... }).
// Disabled until the backend adds GET /analyze that returns the
// dashboard shape the mobile UI renders.
export function useKarmaFootprint(): UseQueryResult<KarmaFootprintResult> {
  return useQuery({
    queryKey: queryKeys.karmaFootprint,
    queryFn: async () => {
      const { data } = await api.karmaFootprint.analyze();
      return data as KarmaFootprintResult;
    },
    staleTime: 1000 * 60 * 10,
    enabled: false,
  });
}

// ---------------------------------------------------------------------------
// Karma Reset
// ---------------------------------------------------------------------------

// NOTE: backend/routes/karma_reset.py currently exposes only
// POST /generate and GET /health — the start/step/complete workflow
// endpoints below do not exist. To avoid breaking the user's ritual
// flow with 404s, the mutations return a client-side stub session so
// the Acknowledgment → Understanding → Renewal phases can progress.
// State is persisted in karmaResetStore on the mobile side.
// TODO(backend): implement the four-phase workflow endpoints, then
// re-enable real network calls here.
function _generateStubSessionId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useStartKarmaReset(): UseMutationResult<KarmaResetSession, Error, string> {
  return useMutation({
    mutationFn: async (pattern: string) => {
      return {
        session_id: _generateStubSessionId(),
        pattern,
        phase: 1,
        status: 'active',
        created_at: new Date().toISOString(),
      } as unknown as KarmaResetSession;
    },
  });
}

export function useKarmaResetStep(): UseMutationResult<KarmaResetSession, Error, { sessionId: string; phase: number; data: Record<string, unknown> }> {
  return useMutation({
    mutationFn: async ({ sessionId, phase }) => {
      return {
        session_id: sessionId,
        phase,
        status: 'active',
      } as unknown as KarmaResetSession;
    },
  });
}

export function useCompleteKarmaReset(): UseMutationResult<KarmaResetSession, Error, string> {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return {
        session_id: sessionId,
        phase: 4,
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as unknown as KarmaResetSession;
    },
  });
}

// ---------------------------------------------------------------------------
// Viyoga & Ardha
// ---------------------------------------------------------------------------

export function useViyogaGuide(): UseMutationResult<ViyogaResult, Error, string> {
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.viyoga.chat(message);
      return data as ViyogaResult;
    },
  });
}

/** Viyoga chat with session support. */
export function useViyogaChat(): UseMutationResult<ViyogaResponse, Error, { message: string; sessionId?: string }> {
  return useMutation({
    mutationFn: async ({ message, sessionId }) => {
      const { data } = await api.viyoga.chat(message, sessionId);
      return data as ViyogaResponse;
    },
  });
}

export function useArdhaReframe(): UseMutationResult<ArdhaReframeResponse, Error, { situation: string; perspective?: string }> {
  return useMutation({
    mutationFn: async ({ situation, perspective }) => {
      const { data } = await api.ardha.reframe(situation, perspective);
      return data as ArdhaReframeResponse;
    },
  });
}

// ---------------------------------------------------------------------------
// Meditation / Vibe Player
// ---------------------------------------------------------------------------

export function useMeditationTracks(category?: string): UseQueryResult<MeditationTrack[]> {
  return useQuery({
    queryKey: queryKeys.meditationTracks(category),
    queryFn: async () => {
      const { data } = await api.meditation.tracks(category);
      return data as MeditationTrack[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ---------------------------------------------------------------------------
// Deep Insights & Analytics
// ---------------------------------------------------------------------------

// NOTE: the three Deep Insights endpoints below do not exist on the
// backend. Closest equivalents live at different URLs:
//   /api/analytics/deep-insights     → /api/analytics/advanced/ai-insights
//   /api/analytics/guna-balance      → /api/analytics/advanced/wellness-score
//   /api/analytics/emotional-patterns → /api/kiaan/emotional-patterns/extract
// Response shapes differ too, so we disable the queries rather than
// silently returning mismatched data. Re-enable after the backend adds
// the dedicated routes the mobile client expects.
export function useDeepInsights(): UseQueryResult<DeepInsightsSummary> {
  return useQuery({
    queryKey: queryKeys.deepInsights,
    queryFn: async () => {
      const { data } = await api.deepInsights.summary();
      return data as DeepInsightsSummary;
    },
    staleTime: 1000 * 60 * 15,
    enabled: false,
  });
}

export function useGunaBalance(): UseQueryResult<GunaBalance> {
  return useQuery({
    queryKey: queryKeys.gunaBalance,
    queryFn: async () => {
      const { data } = await api.deepInsights.gunaBalance();
      return data as GunaBalance;
    },
    staleTime: 1000 * 60 * 15,
    enabled: false,
  });
}

export function useEmotionalPatterns(days?: number): UseQueryResult<EmotionalPattern[]> {
  return useQuery({
    queryKey: queryKeys.emotionalPatterns(days),
    queryFn: async () => {
      const { data } = await api.deepInsights.emotionalPatterns(days);
      return data as EmotionalPattern[];
    },
    staleTime: 1000 * 60 * 15,
    enabled: false,
  });
}

// ---------------------------------------------------------------------------
// Analytics (Mood Trends & Weekly Insights)
// ---------------------------------------------------------------------------

export function useMoodTrends(days?: number): UseQueryResult<MoodTrend[]> {
  return useQuery({
    queryKey: queryKeys.moodTrends(days),
    queryFn: async () => {
      const { data } = await api.analytics.moodTrends(days);
      return data as MoodTrend[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useWeeklyInsights(): UseQueryResult<WeeklyInsight> {
  return useQuery({
    queryKey: queryKeys.weeklyInsights,
    queryFn: async () => {
      const { data } = await api.analytics.weeklyInsights();
      return data as WeeklyInsight;
    },
    staleTime: 1000 * 60 * 15,
  });
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export function useJournalEntries(): UseQueryResult<JournalListResponse> {
  return useQuery({
    queryKey: queryKeys.journalEntries,
    queryFn: async () => {
      const { data } = await api.journal.list();
      return data as JournalListResponse;
    },
  });
}

export function useJournalEntry(id: string): UseQueryResult<JournalEntry> {
  return useQuery({
    queryKey: queryKeys.journalEntry(id),
    queryFn: async () => {
      const { data } = await api.journal.get(id);
      return data as JournalEntry;
    },
    enabled: id.length > 0,
  });
}

export function useCreateJournal(): UseMutationResult<JournalEntry, Error, { content_encrypted: string; tags?: string[] }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry) => {
      const { data } = await api.journal.create(entry);
      return data as JournalEntry;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journalEntries });
    },
  });
}

export function useUpdateJournal(): UseMutationResult<JournalEntry, Error, { id: string; content_encrypted: string; tags?: string[] }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...entry }) => {
      const { data } = await api.journal.update(id, entry);
      return data as JournalEntry;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journalEntries });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journalEntry(variables.id) });
    },
  });
}

export function useDeleteJournal(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.journal.remove(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journalEntries });
    },
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// NOTE: backend has no `/api/profile/settings` endpoint — profile routes
// only expose GET/POST `/api/profile`. Disabled until the backend ships
// a settings sub-resource; the Settings screen should persist toggles
// locally (AsyncStorage) in the meantime so it stops spamming 404s.
export function useUserSettings(): UseQueryResult<UserSettings> {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const { data } = await api.settings.get();
      return data as UserSettings;
    },
    enabled: false,
  });
}

export function useUpdateSettings(): UseMutationResult<UserSettings, Error, Record<string, unknown>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_settings) => {
      // Swallow — backend endpoint does not exist yet. Return the input
      // as-if-persisted so optimistic UI keeps working; the next app
      // launch just rehydrates from whatever local store the screen uses.
      return _settings as unknown as UserSettings;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}


// ---------------------------------------------------------------------------
// Privacy (GDPR Art. 15/17/20)
// ---------------------------------------------------------------------------

export interface PrivacyExportStatus {
  id: number;
  status: string;
  download_token: string | null;
  expires_at: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface PrivacyDeletionStatus {
  id: number;
  status: string;
  grace_period_days: number;
  grace_period_ends_at: string | null;
  created_at: string;
}

export interface PrivacyStatusResponse {
  export: PrivacyExportStatus | null;
  deletion: PrivacyDeletionStatus | null;
}

export function usePrivacyStatus(): UseQueryResult<PrivacyStatusResponse> {
  return useQuery({
    queryKey: queryKeys.privacyStatus,
    queryFn: async () => {
      const { data } = await api.privacy.status();
      return data as PrivacyStatusResponse;
    },
  });
}

export function useRequestExport(): UseMutationResult<PrivacyExportStatus, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.privacy.requestExport();
      return data as PrivacyExportStatus;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.privacyStatus });
    },
  });
}

export function useRequestDeletion(): UseMutationResult<PrivacyDeletionStatus, Error, string | undefined> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      const { data } = await api.privacy.requestDeletion(reason);
      return data as PrivacyDeletionStatus;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.privacyStatus });
    },
  });
}

export function useCancelDeletion(): UseMutationResult<{ status: string; message: string }, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.privacy.cancelDeletion();
      return data as { status: string; message: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.privacyStatus });
    },
  });
}
