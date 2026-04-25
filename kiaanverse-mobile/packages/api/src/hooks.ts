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
import { API_CONFIG } from './config';
import { gitaCache } from './cache/gitaCache';
import { parseArdhaResponse, humaniseEmotion } from './ardha/parser';
import { getLocalChapter, getLocalVerse } from './localGita';
import type {
  AnalyticsDashboard,
  ArdhaResult,
  ArdhaReframeResponse,
  ArdhaStructuredResponse,
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
  DashboardData,
  Journey,
  JourneyTemplate,
  JournalEntry,
  JournalListResponse,
  KarmaFootprintResult,
  KarmaLytixWeeklyReport,
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
  WisdomJourneyStep,
  JourneyPracticeBlock,
  WisdomRoom,
  WisdomRoomMessage,
} from './types';

// ---------------------------------------------------------------------------
// Shared return types for declaration emit compatibility
// ---------------------------------------------------------------------------

type ProfileData = { id: string; email: string; name?: string; locale?: string; subscription_tier?: string; created_at: string };
type ChapterDetail = GitaChapter & { verses: GitaVerse[] };
// DashboardData is now imported from ./types so the Today/Battleground
// surfaces can read the full backend projection (active_count, max_active,
// today_steps, enemy_progress, total_days_practiced).
type StepResult = { success: boolean; progress: number };
type MoodResult = { id: number; kiaanResponse?: string };
type ChatResult = { response: string; session_id: string };

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

// Bump `GITA_CACHE_VERSION` whenever the local Gita corpus changes shape so
// that React Query's persisted cache (24 h TTL via createAppPersister) drops
// any stale placeholder rows it captured before the local corpus shipped.
const GITA_CACHE_VERSION = 'v2-local-corpus';

export const queryKeys = {
  profile: ['profile'] as const,
  gitaChapters: ['gita', GITA_CACHE_VERSION, 'chapters'] as const,
  gitaChapter: (id: number) => ['gita', GITA_CACHE_VERSION, 'chapter', id] as const,
  gitaVerse: (chapter: number, verse: number) => ['gita', GITA_CACHE_VERSION, 'verse', chapter, verse] as const,
  gitaSearch: (query: string) => ['gita', GITA_CACHE_VERSION, 'search', query] as const,
  gitaSearchFull: (keyword: string) => ['gita', GITA_CACHE_VERSION, 'searchFull', keyword] as const,
  gitaVerseDetail: (chapter: number, verse: number) => ['gita', GITA_CACHE_VERSION, 'verseDetail', chapter, verse] as const,
  gitaTranslations: (verseId: string) => ['gita', GITA_CACHE_VERSION, 'translations', verseId] as const,
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
  karmaLytixWeeklyReport: ['analytics', 'karmalytix', 'weeklyReport'] as const,
  karmaLytixHistory: (limit?: number) => ['analytics', 'karmalytix', 'history', limit] as const,
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
      fetchWithGitaCache('v2:chapters:all', async () => {
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
      fetchWithGitaCache(`v2:chapter:${chapterId}`, async () => {
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

/**
 * A verse is considered "placeholder" when the seed corpus has not yet been
 * populated with real content. The seed generator wrote `sanskrit: "॥ X.Y ॥"`
 * and `english: "Bhagavad Gita Chapter X, Verse Y teaches wisdom on <theme>."`
 * for most verses; the backend returns that text verbatim. Treat those rows
 * as missing so the UI can show a real fallback instead of the generated
 * copy — otherwise the home screen literally reads
 * "teaches wisdom on devotion" in place of the shloka.
 */
function isPlaceholderVerse(v: {
  sanskrit?: string | null;
  english?: string | null;
  transliteration?: string | null;
}): boolean {
  const eng = (v.english ?? '').toLowerCase();
  const sanskrit = (v.sanskrit ?? '').trim();
  const translit = (v.transliteration ?? '').trim();
  if (eng.includes('teaches wisdom on')) return true;
  if (/^verse \d+\.\d+$/i.test(translit)) return true;
  // Sanskrit that is just the verse-number marker "॥ 12.6 ॥" — shorter than
  // any real shloka, contains only digits, the danda character, and spaces.
  if (/^॥\s*\d+\.\d+\s*॥$/u.test(sanskrit)) return true;
  return false;
}

/** Real BG 2.47 used as the last-resort fallback when the requested verse
 *  is a seed-data placeholder. This is the verse every Gita-reader knows —
 *  "karmaṇy-evādhikāras te mā phaleṣhu kadāchana". */
const BG_2_47_FALLBACK: GitaVerse = {
  id: '2.47',
  chapter: 2,
  verse: 47,
  sanskrit:
    'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
  transliteration:
    "karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
  translation:
    'You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results, nor be attached to inaction.',
};

export function useGitaVerse(chapter: number, verse: number): UseQueryResult<GitaVerse> {
  return useQuery({
    queryKey: queryKeys.gitaVerse(chapter, verse),
    queryFn: () =>
      fetchWithGitaCache(`v2:verse:${chapter}:${verse}`, async () => {
        // Prefer the bundled local corpus — it has all 700 verses with
        // real Sanskrit / English / Hindi text. Backend is only consulted
        // for verses that aren't in the local file (shouldn't happen) or
        // for theme/principle metadata which the UI doesn't need here.
        const local = getLocalVerse(chapter, verse);
        if (local) {
          return {
            id: local.verseId,
            chapter: local.chapter,
            verse: local.verse,
            sanskrit: local.sanskrit,
            transliteration: local.transliteration,
            translation: local.english,
          } as GitaVerse;
        }
        const { data } = await api.gita.verse(chapter, verse);
        const raw = data as {
          verse: {
            chapter: number;
            verse: number;
            verse_id: string;
            sanskrit: string;
            english: string;
            hindi: string;
            theme: string;
            transliteration?: string | null;
          };
        };
        const v = raw.verse;
        if (isPlaceholderVerse(v)) {
          return BG_2_47_FALLBACK;
        }
        return {
          id: v.verse_id,
          chapter: v.chapter,
          verse: v.verse,
          sanskrit: v.sanskrit,
          transliteration: v.transliteration ?? '',
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

/** Detailed verse with related verses from backend.
 *  Local corpus (sa.json + en.json + hi.json) provides full text; the backend
 *  contributes optional metadata (theme, principle, related_verses) when
 *  reachable. We always return *something* with real verse text so the UI
 *  never shows the seed-row placeholder ("teaches wisdom on …").
 */
export function useGitaVerseDetail(chapter: number, verse: number): UseQueryResult<GitaVerseResponse> {
  return useQuery({
    queryKey: queryKeys.gitaVerseDetail(chapter, verse),
    queryFn: () =>
      fetchWithGitaCache(`v2:verseDetail:${chapter}:${verse}`, async () => {
        const local = getLocalVerse(chapter, verse);
        let backend: GitaVerseResponse | null = null;
        try {
          const { data } = await api.gita.verse(chapter, verse);
          backend = data as GitaVerseResponse;
        } catch {
          // Backend unreachable — local data alone is enough for the UI.
        }

        if (!local && backend) {
          // No local match (shouldn't happen for 1-18.X) — return backend.
          if (isPlaceholderVerse(backend.verse)) {
            return {
              ...backend,
              verse: {
                ...backend.verse,
                sanskrit: BG_2_47_FALLBACK.sanskrit,
                english: BG_2_47_FALLBACK.translation,
              },
            };
          }
          return backend;
        }

        if (!local && !backend) {
          // Catastrophic fallback — should never happen with the bundled corpus.
          return {
            verse: {
              chapter,
              verse,
              verse_id: `${chapter}.${verse}`,
              sanskrit: BG_2_47_FALLBACK.sanskrit,
              english: BG_2_47_FALLBACK.translation,
              hindi: '',
              theme: '',
              principle: null,
            },
            related_verses: [],
          };
        }

        // local is defined here. Merge: local overrides backend's verse text,
        // backend supplies metadata (theme, principle, related_verses) when
        // available.
        return {
          verse: {
            chapter: local!.chapter,
            verse: local!.verse,
            verse_id: local!.verseId,
            sanskrit: local!.sanskrit,
            english: local!.english,
            hindi: local!.hindi,
            theme: backend?.verse?.theme ?? '',
            principle: backend?.verse?.principle ?? null,
          },
          related_verses: backend?.related_verses ?? [],
        };
      }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — verses are immutable
    enabled: chapter > 0 && verse > 0,
  });
}

/** All translations for a verse.
 *  Always returns the bundled corpus first so transliteration + Hindi appear
 *  even when the backend is unreachable.
 */
export function useGitaTranslations(verseId: string): UseQueryResult<GitaTranslationSet> {
  return useQuery({
    queryKey: queryKeys.gitaTranslations(verseId),
    queryFn: () =>
      fetchWithGitaCache(`v2:translations:${verseId}`, async () => {
        const [chapterStr, verseStr] = verseId.split('.');
        const chapter = Number(chapterStr);
        const verse = Number(verseStr);
        const local = Number.isFinite(chapter) && Number.isFinite(verse)
          ? getLocalVerse(chapter, verse)
          : undefined;

        let backend: GitaTranslationSet | null = null;
        try {
          const { data } = await api.gita.translations(verseId);
          backend = data as GitaTranslationSet;
        } catch {
          // Backend unreachable — local data alone is enough.
        }

        if (!local && backend) return backend;
        if (!local && !backend) {
          throw new Error(`Translations for ${verseId} unavailable`);
        }

        // local is defined here. Merge: prefer local for verse text fields;
        // keep any extra translation languages the backend may return.
        const baseTranslations: Record<string, string> = backend?.translations ?? {};
        return {
          verse_id: local!.verseId,
          chapter: local!.chapter,
          verse: local!.verse,
          theme: backend?.theme ?? '',
          principle: backend?.principle ?? null,
          translations: {
            ...baseTranslations,
            sanskrit: local!.sanskrit,
            transliteration: local!.transliteration,
            english: local!.english,
            hindi: local!.hindi,
          },
        } satisfies GitaTranslationSet;
      }),
    staleTime: 1000 * 60 * 60 * 24,
    // Skip while the route params are still resolving — otherwise the first
    // render fires with "NaN.NaN" because chapter/verse numbers haven't
    // parsed yet, which the backend rejects with HTTP 400.
    enabled: verseId.length > 0 && !verseId.includes('NaN') && !verseId.includes('undefined'),
  });
}

/** Chapter detail with verse listing.
 *
 *  Local corpus (sa.json + en.json + hi.json) is the source of truth for
 *  every verse — sanskrit, transliteration, english preview — so the user
 *  never sees the backend's seed-row placeholders ("teaches wisdom on …").
 *  When the backend is reachable, its `summary` and `themes` are folded in.
 */
export function useGitaChapterDetail(chapterId: number): UseQueryResult<GitaChapterDetail> {
  return useQuery({
    queryKey: queryKeys.gitaChapter(chapterId),
    queryFn: () =>
      fetchWithGitaCache(`v2:chapterDetail:${chapterId}`, async () => {
        const local = getLocalChapter(chapterId);
        let backend: GitaChapterDetail | null = null;
        try {
          const { data } = await api.gita.chapter(chapterId);
          backend = data as GitaChapterDetail;
        } catch {
          // Backend unreachable — local data alone is enough.
        }

        if (!local) {
          // Should be impossible for chapters 1-18, but defend anyway.
          if (backend) return backend;
          throw new Error(`Chapter ${chapterId} not available offline or online`);
        }

        return {
          chapter: local.chapter,
          name: backend?.name ?? local.nameEnglish,
          summary: backend?.summary ?? local.description,
          verse_count: local.verseCount,
          verses: local.verses.map((v) => ({
            chapter: v.chapter,
            verse: v.verse,
            verse_id: v.verseId,
            theme: '',
            preview:
              v.english.length > 120 ? `${v.english.slice(0, 117)}…` : v.english,
            sanskrit: v.sanskrit,
            transliteration: v.transliteration,
          })),
          themes: backend?.themes ?? [],
        };
      }),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: chapterId > 0 && chapterId <= 18,
  });
}

// ---------------------------------------------------------------------------
// Journeys
// ---------------------------------------------------------------------------

/**
 * Backend journey-engine response shapes (snake_case from FastAPI).
 * Kept local — these mirror TemplateResponse / JourneyResponse / DashboardResponse
 * in backend/routes/journey_engine.py and only exist so we can map them into
 * the camelCase JourneyTemplate / Journey types the UI consumes.
 */
interface RawTemplate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  primary_enemy_tags: string[];
  duration_days: number;
  difficulty: number;
  is_featured?: boolean;
  is_free?: boolean;
  icon_name?: string | null;
  color_theme?: string | null;
  gita_verse_ref?: { chapter: number; verse: number } | null;
  gita_verse_text?: string | null;
  modern_context?: string | null;
  transformation_promise?: string | null;
}

interface RawJourney {
  journey_id: string;
  template_slug: string;
  title: string;
  status: string;
  current_day: number;
  total_days: number;
  progress_percentage: number;
  days_completed: number;
  started_at?: string | null;
  last_activity?: string | null;
  primary_enemies: string[];
  streak_days: number;
}

interface RawDashboardTodayStep {
  step_id: string;
  journey_id: string;
  day_index: number;
  step_title: string;
  teaching?: string;
  is_completed: boolean;
}

interface RawEnemyProgress {
  enemy: string;
  enemy_label: string;
  mastery_level: number;
  journeys_started: number;
  journeys_completed: number;
  total_days_practiced: number;
  current_streak: number;
  best_streak: number;
  active_journey_progress_pct?: number;
  active_journey_id?: string | null;
  active_journey_day?: number;
  active_journey_total_days?: number;
}

interface RawDashboard {
  active_journeys: RawJourney[];
  completed_journeys: number;
  total_days_practiced: number;
  current_streak: number;
  enemy_progress?: RawEnemyProgress[];
  today_steps?: RawDashboardTodayStep[];
  active_count?: number;
  max_active?: number;
}

/**
 * Map backend integer difficulty (1–5) to the string label the UI renders.
 * 1 → beginner, 2–3 → intermediate, 4–5 → advanced. Defaults to beginner.
 */
function _mapDifficulty(d: number | undefined): 'beginner' | 'intermediate' | 'advanced' {
  if (d === undefined || d <= 1) return 'beginner';
  if (d <= 3) return 'intermediate';
  return 'advanced';
}

function _mapTemplate(t: RawTemplate): JourneyTemplate {
  const enemy = t.primary_enemy_tags?.[0] ?? '';
  const tpl: JourneyTemplate = {
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description ?? '',
    durationDays: t.duration_days,
    category: enemy,
    primaryEnemyTags: t.primary_enemy_tags ?? [],
    difficulty: _mapDifficulty(t.difficulty),
    isFree: t.is_free ?? true,
    gitaVerseRef: t.gita_verse_ref ?? null,
    gitaVerseText: t.gita_verse_text ?? null,
    modernContext: t.modern_context ?? null,
    transformationPromise: t.transformation_promise ?? null,
  };
  return tpl;
}

function _mapJourney(j: RawJourney): Journey {
  // Map snake_case → camelCase, derive `category` from the first enemy tag
  // (same convention as templates above), and infer status enum.
  const status = (
    ['available', 'active', 'paused', 'completed', 'abandoned'].includes(j.status)
      ? j.status
      : 'active'
  ) as Journey['status'];
  return {
    id: j.journey_id,
    title: j.title,
    description: '',
    durationDays: j.total_days,
    status,
    currentDay: j.current_day,
    completedSteps: j.days_completed,
    category: j.primary_enemies?.[0] ?? '',
    primaryEnemies: j.primary_enemies ?? [],
    progressPercentage: j.progress_percentage,
    streakDays: j.streak_days,
  };
}

export function useJourneyTemplates(): UseQueryResult<JourneyTemplate[]> {
  return useQuery({
    queryKey: queryKeys.journeyTemplates,
    queryFn: async () => {
      // Backend returns TemplateListResponse: { templates, total, limit, offset }
      const { data } = await api.journeys.templates();
      const raw = data as { templates?: RawTemplate[] } | RawTemplate[];
      const list = Array.isArray(raw) ? raw : (raw.templates ?? []);
      return list.map(_mapTemplate);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useJourneys(status?: string): UseQueryResult<Journey[]> {
  return useQuery({
    queryKey: queryKeys.journeys(status),
    queryFn: async () => {
      // Backend returns JourneyListResponse: { journeys, total, limit, offset }
      const { data } = await api.journeys.list(status);
      const raw = data as { journeys?: RawJourney[] } | RawJourney[];
      const list = Array.isArray(raw) ? raw : (raw.journeys ?? []);
      return list.map(_mapJourney);
    },
  });
}

export function useJourney(journeyId: string): UseQueryResult<Journey> {
  return useQuery({
    queryKey: queryKeys.journey(journeyId),
    queryFn: async () => {
      const { data } = await api.journeys.get(journeyId);
      return _mapJourney(data as RawJourney);
    },
    enabled: journeyId.length > 0,
  });
}

export function useJourneyDashboard(): UseQueryResult<DashboardData> {
  return useQuery({
    queryKey: queryKeys.journeyDashboard,
    queryFn: async () => {
      // Backend DashboardResponse uses snake_case fields. The mobile
      // view-model consumes camelCase with renamed fields and joins each
      // today_step's primary_enemy from its parent journey so the
      // TodayPracticeCard can theme without a second lookup.
      const { data } = await api.journeys.dashboard();
      const raw = data as Partial<RawDashboard>;
      const activeJourneys = (raw.active_journeys ?? []).map(_mapJourney);
      const enemyByJourney = new Map<string, string | undefined>();
      for (const j of activeJourneys) {
        enemyByJourney.set(j.id, j.primaryEnemies?.[0] ?? j.category);
      }
      const todaySteps = (raw.today_steps ?? []).map((s) => ({
        stepId: s.step_id,
        journeyId: s.journey_id,
        dayIndex: s.day_index,
        stepTitle: s.step_title,
        teaching: s.teaching ?? '',
        isCompleted: s.is_completed,
        primaryEnemy: enemyByJourney.get(s.journey_id),
      }));
      const enemyProgress = (raw.enemy_progress ?? []).map((p) => ({
        enemy: p.enemy,
        enemyLabel: p.enemy_label,
        masteryLevel: p.mastery_level,
        journeysStarted: p.journeys_started,
        journeysCompleted: p.journeys_completed,
        totalDaysPracticed: p.total_days_practiced,
        currentStreak: p.current_streak,
        bestStreak: p.best_streak,
        activeJourneyProgressPct: p.active_journey_progress_pct,
        activeJourneyId: p.active_journey_id ?? null,
        activeJourneyDay: p.active_journey_day,
        activeJourneyTotalDays: p.active_journey_total_days,
      }));
      const dashboard: DashboardData = {
        activeJourneys,
        completedCount: raw.completed_journeys ?? 0,
        streakDays: raw.current_streak ?? 0,
        totalDaysPracticed: raw.total_days_practiced ?? 0,
        activeCount: raw.active_count ?? activeJourneys.length,
        maxActive: raw.max_active ?? 5,
        todaySteps,
        enemyProgress,
      };
      return dashboard;
    },
  });
}

/**
 * Backend step response (GET /journeys/{id}/steps/{day_index}).
 * Mirrors StepResponse in backend/routes/journey_engine.py.
 */
interface RawVerse {
  chapter: number;
  verse: number;
  sanskrit?: string | null;
  hindi?: string | null;
  english?: string;
  transliteration?: string | null;
  theme?: string | null;
}

interface RawModernExample {
  category: string;
  scenario: string;
  how_enemy_manifests: string;
  gita_verse_ref: { chapter: number; verse: number };
  gita_wisdom: string;
  practical_antidote: string;
  reflection_question: string;
}

interface RawPractice {
  name?: string;
  duration_minutes?: number;
  instructions?: unknown;
}

interface RawStep {
  step_id: string;
  journey_id: string;
  day_index: number;
  step_title: string;
  teaching: string;
  guided_reflection?: string[];
  verse_refs?: Array<{ chapter: number; verse: number }>;
  verses?: RawVerse[];
  practice?: RawPractice | null;
  micro_commitment?: string | null;
  safety_note?: string | null;
  is_completed: boolean;
  /** Flattened sacred fields from the backend. */
  verse_ref?: { chapter: number; verse: number } | null;
  verse_sanskrit?: string | null;
  verse_transliteration?: string | null;
  verse_translation?: string | null;
  reflection_prompt?: string | null;
  modern_example?: RawModernExample | null;
}

function _mapStep(s: RawStep): WisdomJourneyStep {
  // Prefer the flattened sacred fields populated by the backend's
  // _step_to_response helper, falling back to the legacy verses[] payload
  // so older deployments remain renderable.
  const flatRef = s.verse_ref ?? null;
  const firstLegacyVerse = s.verses?.[0];
  const refSource = flatRef ?? firstLegacyVerse ?? s.verse_refs?.[0] ?? null;

  const reflectionPrompts = Array.isArray(s.guided_reflection)
    ? s.guided_reflection.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : [];
  const reflectionText = reflectionPrompts.join('\n\n');

  const sanskrit = s.verse_sanskrit ?? firstLegacyVerse?.sanskrit ?? undefined;
  const transliteration =
    s.verse_transliteration ?? firstLegacyVerse?.transliteration ?? undefined;
  const translation = s.verse_translation ?? firstLegacyVerse?.english ?? undefined;
  const hindi = firstLegacyVerse?.hindi ?? undefined;

  const step: WisdomJourneyStep = {
    id: s.step_id,
    dayIndex: s.day_index,
    title: s.step_title,
    type: 'lesson',
    content: s.teaching ?? '',
    isCompleted: s.is_completed,
    // Backend does not expose per-step XP/karma yet — defaults match the
    // mobile UI's placeholder reward copy so the detail card renders.
    xpReward: 10,
    karmaReward: 5,
  };
  if (refSource) step.verseRef = `${refSource.chapter}.${refSource.verse}`;
  if (sanskrit) step.verseSanskrit = sanskrit;
  if (transliteration) step.verseTransliteration = transliteration;
  if (translation) step.verseTranslation = translation;
  if (hindi) step.verseHindi = hindi;
  if (reflectionText) step.reflection = reflectionText;
  if (reflectionPrompts.length > 0) step.reflectionPrompts = reflectionPrompts;

  if (s.modern_example) {
    const me = s.modern_example;
    step.modernExample = {
      category: me.category,
      scenario: me.scenario,
      howEnemyManifests: me.how_enemy_manifests,
      gitaVerseRef: me.gita_verse_ref,
      gitaWisdom: me.gita_wisdom,
      practicalAntidote: me.practical_antidote,
      reflectionQuestion: me.reflection_question,
    };
  }

  if (s.practice && typeof s.practice === 'object') {
    const rawInstructions = Array.isArray(s.practice.instructions)
      ? s.practice.instructions
      : [];
    const instructions = rawInstructions
      .map((i) => (typeof i === 'string' ? i.trim() : ''))
      .filter((i): i is string => i.length > 0);
    if (
      instructions.length > 0 ||
      typeof s.practice.name === 'string' ||
      typeof s.practice.duration_minutes === 'number'
    ) {
      const block: JourneyPracticeBlock = { instructions };
      if (typeof s.practice.name === 'string' && s.practice.name.trim().length > 0) {
        block.name = s.practice.name.trim();
      }
      if (typeof s.practice.duration_minutes === 'number') {
        block.durationMinutes = s.practice.duration_minutes;
      }
      step.practice = block;
    }
  }

  if (typeof s.micro_commitment === 'string' && s.micro_commitment.trim().length > 0) {
    step.microCommitment = s.micro_commitment.trim();
  }
  if (typeof s.safety_note === 'string' && s.safety_note.trim().length > 0) {
    step.safetyNote = s.safety_note.trim();
  }

  return step;
}

/**
 * Full wisdom journey detail with all steps.
 *
 * The backend has no bulk "journey with steps" endpoint — it exposes the
 * journey meta at /journeys/{id} and each step individually at
 * /journeys/{id}/steps/{day_index}. We compose the two into the shape the
 * detail + step-player screens render. Steps are fetched with
 * allSettled so one transient 5xx doesn't blank the whole page.
 */
export function useWisdomJourneyDetail(journeyId: string): UseQueryResult<WisdomJourneyDetail> {
  return useQuery({
    queryKey: queryKeys.journeyDetail(journeyId),
    queryFn: async () => {
      const { data: journeyRaw } = await api.journeys.get(journeyId);
      const j = journeyRaw as RawJourney;

      const total = Math.max(1, j.total_days);
      const settled = await Promise.allSettled(
        Array.from({ length: total }, (_, i) =>
          api.journeys.step(journeyId, i + 1),
        ),
      );

      const steps: WisdomJourneyStep[] = settled.map((res, i) => {
        const dayIndex = i + 1;
        if (res.status === 'fulfilled') {
          return _mapStep(res.value.data as RawStep);
        }
        // Fallback: keep the day selector usable even if a step fetch
        // failed — mark completed days based on cumulative progress.
        return {
          id: `${j.journey_id}-day-${dayIndex}`,
          dayIndex,
          title: `Day ${dayIndex}`,
          type: 'lesson',
          content: '',
          isCompleted: dayIndex <= j.days_completed,
          xpReward: 10,
          karmaReward: 5,
        };
      });

      const mapped = _mapJourney(j);
      const detail: WisdomJourneyDetail = {
        id: mapped.id,
        title: mapped.title,
        description: mapped.description,
        durationDays: mapped.durationDays,
        status: mapped.status,
        currentDay: mapped.currentDay,
        completedSteps: mapped.completedSteps,
        // The backend enum doesn't map cleanly to JourneyCategory
        // ('beginner_paths' / 'deep_dives' / '21_day_challenges'), so we
        // pick the closest bucket from duration. Screens only use this
        // field for grouping — never for business logic.
        category: total >= 21 ? '21_day_challenges' : total >= 14 ? 'deep_dives' : 'beginner_paths',
        difficulty: 'beginner',
        steps,
        totalXp: steps.reduce((sum, s) => sum + s.xpReward, 0),
        earnedXp: steps.filter((s) => s.isCompleted).reduce((sum, s) => sum + s.xpReward, 0),
      };
      return detail;
    },
    staleTime: 1000 * 60 * 5,
    enabled: journeyId.length > 0,
  });
}

/**
 * User progress across all journeys — derived from dashboard active_journeys.
 * The hook previously cast the DashboardResponse object to an array, which
 * made every consumer see an empty list. We now project the active journeys
 * (the only per-journey data the dashboard returns) into UserJourneyProgress.
 */
export function useJourneyProgress(): UseQueryResult<UserJourneyProgress[]> {
  return useQuery({
    queryKey: queryKeys.journeyProgress,
    queryFn: async () => {
      const { data } = await api.journeys.dashboard();
      const raw = data as Partial<RawDashboard>;
      const journeys = raw.active_journeys ?? [];
      return journeys.map((j): UserJourneyProgress => ({
        journeyId: j.journey_id,
        title: j.title,
        category: (j.total_days >= 21
          ? '21_day_challenges'
          : j.total_days >= 14
            ? 'deep_dives'
            : 'beginner_paths') as UserJourneyProgress['category'],
        completedSteps: j.days_completed,
        totalSteps: j.total_days,
        earnedXp: j.days_completed * 10,
        totalXp: j.total_days * 10,
        status: (['available', 'active', 'paused', 'completed', 'abandoned'].includes(j.status)
          ? j.status
          : 'active') as UserJourneyProgress['status'],
      }));
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
      return _mapJourney(data as RawJourney);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

/** Pause an active journey. Backend POST /journeys/{id}/pause. */
export function usePauseJourney(): UseMutationResult<Journey, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journeyId: string) => {
      const { data } = await api.journeys.pause(journeyId);
      return _mapJourney(data as RawJourney);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

/** Resume a paused journey. Backend POST /journeys/{id}/resume. */
export function useResumeJourney(): UseMutationResult<Journey, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journeyId: string) => {
      const { data } = await api.journeys.resume(journeyId);
      return _mapJourney(data as RawJourney);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

/**
 * Close (abandon) a journey. Backend DELETE /journeys/{id} — soft-deletes
 * via `deleted_at = NOW(), status = 'abandoned'`, never removes the row.
 * The user's reflections and progress remain recoverable.
 */
export function useAbandonJourney(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journeyId: string) => {
      await api.journeys.abandon(journeyId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

/**
 * Backend completion response (POST /journeys/{id}/steps/{day}/complete).
 * Mirrors CompletionResponse in backend/routes/journey_engine.py:
 *   { success, day_completed, journey_complete, next_day,
 *     progress_percentage, ai_response, mastery_delta }
 */
interface RawCompletion {
  success: boolean;
  day_completed: number;
  journey_complete: boolean;
  next_day: number | null;
  progress_percentage: number;
  ai_response?: string;
  mastery_delta?: number;
}

export function useCompleteStep(): UseMutationResult<StepResult, Error, { journeyId: string; dayIndex: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, dayIndex }: { journeyId: string; dayIndex: number }) => {
      const { data } = await api.journeys.completeStep(journeyId, dayIndex);
      const raw = data as RawCompletion;
      return {
        success: raw.success,
        progress: raw.progress_percentage ?? 0,
      };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journey(variables.journeyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.journeyDashboard });
    },
  });
}

/**
 * Complete a wisdom journey step by day index. Returns the per-step
 * celebration payload the UI renders (XP / karma / journey completion).
 *
 * The backend CompletionResponse does not yet include XP or karma fields,
 * so we pair the real success / progress / journey-complete flags with
 * the same placeholder rewards (10 XP, 5 karma) used by _mapStep().
 */
export function useCompleteWisdomStep(): UseMutationResult<StepCompletionResult, Error, { journeyId: string; dayIndex: number }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, dayIndex }: { journeyId: string; dayIndex: number }) => {
      const { data } = await api.journeys.completeStep(journeyId, dayIndex);
      const raw = data as RawCompletion;
      return {
        success: raw.success,
        xp: 10,
        karmaPoints: 5,
        progress: raw.progress_percentage ?? 0,
        journeyCompleted: raw.journey_complete ?? false,
      };
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


/** Karma tree with all nodes.
 *  Backend /api/karmic-tree/progress returns a rich ProgressResponse —
 *  { level, xp, next_level_xp, progress_percent, tree_stage, activity,
 *    achievements, unlockables, notifications }. The mobile tree screen
 *  consumes the older { nodes, totalPoints, level } shape; we adapt in
 *  one place so the UI keeps working without forcing a backend change. */
const _TREE_STAGE_TO_LEVEL: Record<string, 'seed' | 'sapling' | 'young_tree' | 'mighty_tree' | 'sacred_tree'> = {
  seed: 'seed',
  sapling: 'sapling',
  young: 'young_tree',
  young_tree: 'young_tree',
  mighty: 'mighty_tree',
  mighty_tree: 'mighty_tree',
  sacred: 'sacred_tree',
  sacred_tree: 'sacred_tree',
};

export function useKarmaTree(): UseQueryResult<KarmaTreeResponse> {
  return useQuery({
    queryKey: queryKeys.karmaTree,
    queryFn: async () => {
      const { data } = await api.karma.tree();
      const raw = (data ?? {}) as {
        xp?: number;
        tree_stage?: string;
        achievements?: Array<{ key: string; name: string; unlocked?: boolean; progress?: number; target_value?: number }>;
      };
      const stage = _TREE_STAGE_TO_LEVEL[raw.tree_stage ?? 'seed'] ?? 'seed';
      return {
        nodes: (raw.achievements ?? []).map((a) => ({
          id: a.key,
          name: a.name,
          unlocked: !!a.unlocked,
          progress: a.progress ?? 0,
          target: a.target_value ?? 0,
        })),
        totalPoints: raw.xp ?? 0,
        level: stage,
      } as unknown as KarmaTreeResponse;
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

/**
 * Parse a backend "BG c.v" reference string into chapter/verse numbers.
 * Returns null if the format isn't recognised.
 */
function _parseGitaReference(ref: string | undefined): { chapter: number; verse: number } | null {
  if (!ref) return null;
  const match = /BG\s*(\d+)\.(\d+)/i.exec(ref);
  if (!match) return null;
  return { chapter: Number(match[1]), verse: Number(match[2]) };
}

/**
 * Relationship guidance returning extended RelationshipGuidance type.
 *
 * Maps the backend's `compass_guidance` response (routes/relationship_compass.py)
 * into the screen-expected RelationshipGuidance shape:
 *   - guidance        ← `response`
 *   - dharma_principles ← `relationship_teachings.core_principles`
 *   - reflection_prompts ← derived from compass_guidance sections
 *   - verse           ← parsed from gita_context.sources[0]
 */
export function useRelationshipGuide(): UseMutationResult<RelationshipGuidance, Error, { question: string; context?: string }> {
  return useMutation({
    mutationFn: async ({ question, context }) => {
      const { data } = await api.relationship.guide(question, context);
      const raw = data as {
        response?: string;
        compass_guidance?: Record<string, unknown> | unknown[];
        relationship_teachings?: { core_principles?: string[]; key_teaching?: string };
        gita_context?: { sources?: Array<{ reference?: string; reference_if_any?: string }> };
        emotion_insight?: string;
      };

      const ref = raw.gita_context?.sources?.[0];
      const parsed = _parseGitaReference(ref?.reference ?? ref?.reference_if_any);

      // Pull reflection prompts from any "reflection" / "questions" section
      // the model produced. Falls back to an empty list if compass_guidance
      // is shaped as a string body instead of structured sections.
      const reflectionPrompts: string[] = [];
      if (raw.compass_guidance && !Array.isArray(raw.compass_guidance)) {
        for (const [key, value] of Object.entries(raw.compass_guidance)) {
          if (/reflection|question|prompt/i.test(key) && Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === 'string') reflectionPrompts.push(item);
            }
          }
        }
      }

      const result: RelationshipGuidance = {
        question,
        guidance: raw.response ?? raw.relationship_teachings?.key_teaching ?? '',
        dharma_principles: raw.relationship_teachings?.core_principles ?? [],
        reflection_prompts: reflectionPrompts,
        ...(parsed
          ? {
              verse: {
                chapter: parsed.chapter,
                verse: parsed.verse,
                text: '',
                translation: raw.emotion_insight ?? '',
              },
            }
          : {}),
      };
      return result;
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

/**
 * Viyoga chat with session support.
 *
 * Maps the backend's chat response (routes/viyoga.py) — `assistant`,
 * `citations`, `karma_yoga_insight` — into the screen-expected
 * ViyogaResponse shape with `message`, `session_id`, optional `verse`.
 * The backend doesn't echo the session id, so we round-trip the one
 * the caller passed in (or empty string for the first turn).
 */
export function useViyogaChat(): UseMutationResult<ViyogaResponse, Error, { message: string; sessionId?: string }> {
  return useMutation({
    mutationFn: async ({ message, sessionId }) => {
      const { data } = await api.viyoga.chat(message, sessionId);
      const raw = data as {
        assistant?: string;
        citations?: Array<{ reference_if_any?: string }>;
        karma_yoga_insight?: { teaching?: string; verse?: string; remedy?: string };
        error?: string;
      };

      // Surface server-side validation errors (empty/too-long message)
      // so the caller's catch block runs the same fallback path it
      // would for a network failure.
      if (raw.error) {
        throw new Error(raw.error);
      }

      // Prefer the first citation; fall back to the karma-yoga insight
      // verse string ("BG 2.47"-style) so the optional verse field is
      // populated even when no citations were attached.
      const ref =
        raw.citations?.[0]?.reference_if_any ?? raw.karma_yoga_insight?.verse;
      const parsed = _parseGitaReference(ref);

      const result: ViyogaResponse = {
        message: raw.assistant ?? '',
        session_id: sessionId ?? '',
        ...(parsed
          ? {
              verse: {
                chapter: parsed.chapter,
                verse: parsed.verse,
                text: raw.karma_yoga_insight?.teaching ?? '',
              },
            }
          : {}),
        ...(raw.karma_yoga_insight?.remedy
          ? { practice: raw.karma_yoga_insight.remedy }
          : {}),
      };
      return result;
    },
  });
}

/**
 * Ardha thought-reframing.
 *
 * Maps the backend's `/api/ardha/reframe` response (routes/ardha.py) —
 * `response`, `sources`, `ardha_analysis` — into the
 * screen-expected ArdhaReframeResponse:
 *   - original_situation   ← echo of the caller's situation
 *   - reframed_perspective ← `response`
 *   - verse                ← parsed from `sources[0].reference`
 *   - affirmation          ← derived from the recommended pillar's
 *                            compliance_test, which is always a short,
 *                            uplifting Sanskrit-grounded line.
 */
export function useArdhaReframe(): UseMutationResult<ArdhaReframeResponse, Error, { situation: string; perspective?: string }> {
  return useMutation({
    mutationFn: async ({ situation, perspective }) => {
      const { data } = await api.ardha.reframe(situation, perspective);
      const raw = data as {
        response?: string;
        sources?: Array<{ reference?: string }>;
        ardha_analysis?: {
          pillars?: Array<{
            sanskrit_name?: string;
            name?: string;
            compliance_test?: string;
          }>;
          crisis_detected?: boolean;
        };
      };

      const parsed = _parseGitaReference(raw.sources?.[0]?.reference);
      const firstPillar = raw.ardha_analysis?.pillars?.[0];
      const affirmation =
        firstPillar?.compliance_test
        ?? (firstPillar?.sanskrit_name
          ? `I rest in ${firstPillar.sanskrit_name}.`
          : 'I am the witness; the storm is not me.');

      const result: ArdhaReframeResponse = {
        original_situation: situation,
        reframed_perspective: raw.response ?? '',
        affirmation,
        ...(parsed
          ? {
              verse: {
                chapter: parsed.chapter,
                verse: parsed.verse,
                text: '',
                translation: '',
              },
            }
          : {}),
      };
      return result;
    },
  });
}

/**
 * Structured ARDHA reframe hook powering the 2-screen Android flow
 * (tools/ardha/index.tsx → tools/ardha/result.tsx).
 *
 * The chat-style `useArdhaReframe` flattens everything to a single string;
 * this one preserves the 5-pillar structure by parsing the model's
 * Markdown-ish headings (`## Dharma Alignment`, `**Arpana**`, etc.) into
 * `sections[]`, and threads through the backend's `ardha_analysis` +
 * `compliance` blocks unchanged.
 */
export function useArdhaStructuredReframe(): UseMutationResult<
  ArdhaStructuredResponse,
  Error,
  { thought: string; depth?: 'quick' | 'deep' | 'quantum'; sessionId?: string }
> {
  return useMutation({
    mutationFn: async (vars: {
      thought: string;
      depth?: 'quick' | 'deep' | 'quantum';
      sessionId?: string;
    }) => {
      const { thought, depth, sessionId } = vars;
      const { data } = await api.ardha.reframeStructured(thought, {
        ...(depth ? { depth } : {}),
        ...(sessionId ? { sessionId } : {}),
      });

      const raw = data as {
        response?: string;
        fallback?: boolean;
        sources?: Array<{ reference?: string; reference_if_any?: string }>;
        ardha_analysis?: {
          primary_emotion?: string;
          detected_emotions?: string[];
          pillars?: Array<{
            code?: string;
            name?: string;
            sanskrit_name?: string;
            compliance_test?: string;
          }>;
          crisis_detected?: boolean;
        };
        compliance?: {
          score?: number;
          max_score?: number;
        };
      };

      const fullText = raw.response ?? '';
      const sections = parseArdhaResponse(fullText);

      // Pillars addressed for this specific thought — rendered in the
      // "ARDHA Analysis" block. The backend already ships `compliance_test`
      // as a short diagnostic question ("Is outcome mentally released?"),
      // which is exactly what the screenshot shows.
      const pillars = (raw.ardha_analysis?.pillars ?? [])
        .map((p) => ({
          badge: (p.code ?? '').toUpperCase(),
          name: p.name ?? '',
          sanskrit: p.sanskrit_name ?? '',
          question: p.compliance_test ?? '',
        }))
        .filter((p) => p.badge.length > 0 && p.name.length > 0);

      const firstRef =
        raw.sources?.[0]?.reference ?? raw.sources?.[0]?.reference_if_any;

      const result: ArdhaStructuredResponse = {
        thought,
        fullText,
        fallback: raw.fallback === true,
        sections,
        analysis: {
          detected: humaniseEmotion(raw.ardha_analysis?.primary_emotion),
          pillars,
          crisisDetected: raw.ardha_analysis?.crisis_detected === true,
        },
        ...(firstRef ? { verseReference: firstRef } : {}),
        compliance: {
          score: raw.compliance?.score ?? 0,
          maxScore: raw.compliance?.max_score ?? 5,
        },
      };
      return result;
    },
  });
}

// ---------------------------------------------------------------------------
// Meditation / Vibe Player
// ---------------------------------------------------------------------------

/**
 * Turn whatever the backend returned for `audioUrl` into an absolute URL the
 * native player can actually fetch. Today the meditation backend returns
 * relative paths like `"/audio/om-chanting.mp3"` — those are useless on
 * device because the native HTTP stack has no baseURL to resolve against.
 *
 * - absolute `http(s)://` → kept as-is
 * - empty / missing      → returned as empty string (screen treats as
 *                          "coming soon" and skips TrackPlayer.add)
 * - relative             → resolved against API_CONFIG.baseURL so that once
 *                          the backend mounts a static `/audio/*` route the
 *                          mobile app automatically starts playing without
 *                          needing another release.
 */
function _normalizeTrackAudioUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Relative path — prepend the configured API base. Strip a leading slash
  // so we don't double it when baseURL already ends with one.
  const base = API_CONFIG.baseURL.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export function useMeditationTracks(category?: string): UseQueryResult<MeditationTrack[]> {
  return useQuery({
    queryKey: queryKeys.meditationTracks(category),
    queryFn: async () => {
      const { data } = await api.meditation.tracks(category);
      const raw = Array.isArray(data) ? data : [];
      // Normalise `audioUrl` and defensively coerce the other fields — the
      // backend sometimes ships null / missing values that would otherwise
      // break TrackPlayer.add() at play time instead of surfacing a clean
      // "coming soon" message at list-render time.
      return raw.map((t): MeditationTrack => {
        const row = t as Record<string, unknown>;
        return {
          id: String(row.id ?? ''),
          title: String(row.title ?? 'Untitled'),
          artist: String(row.artist ?? 'KIAAN Vibe'),
          duration: Number(row.duration ?? 0),
          category: (row.category as MeditationTrack['category']) ?? 'meditation',
          audioUrl: _normalizeTrackAudioUrl(row.audioUrl ?? row.audio_url),
          ...(typeof row.artworkUrl === 'string' && row.artworkUrl.length > 0
            ? { artworkUrl: row.artworkUrl }
            : {}),
          ...(typeof row.description === 'string'
            ? { description: row.description }
            : {}),
        };
      });
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
// KarmaLytix — Sacred Mirror (backend contract in routes/analytics_karmalytix.py)
// ---------------------------------------------------------------------------

/**
 * Fetch the latest weekly KarmaLytix report. The backend returns
 * ``insufficient_data=true`` when the user has fewer than 3 entries this
 * week, so callers should branch on that flag rather than on HTTP status.
 */
export function useKarmaLytixWeeklyReport(options?: {
  enabled?: boolean;
}): UseQueryResult<KarmaLytixWeeklyReport> {
  return useQuery({
    queryKey: queryKeys.karmaLytixWeeklyReport,
    queryFn: async () => {
      const { data } = await api.analytics.karmaLytixWeeklyReport();
      return data as KarmaLytixWeeklyReport;
    },
    // The backend caches by ISO week; refetching more than once an hour
    // wastes Claude tokens without changing the data.
    staleTime: 1000 * 60 * 60,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Force-generate a fresh Sacred Mirror. When ``forceRegenerate`` is
 * ``false`` the backend returns the cached report for this week.
 */
export function useGenerateKarmaLytixReport(): UseMutationResult<
  KarmaLytixWeeklyReport,
  Error,
  { forceRegenerate?: boolean } | void
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args) => {
      const force = args && 'forceRegenerate' in args ? Boolean(args.forceRegenerate) : false;
      const { data } = await api.analytics.karmaLytixGenerate(force);
      return data as KarmaLytixWeeklyReport;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.karmaLytixWeeklyReport, data);
      void queryClient.invalidateQueries({
        queryKey: ['analytics', 'karmalytix', 'history'],
      });
    },
  });
}

export function useKarmaLytixHistory(
  limit: number = 12,
): UseQueryResult<KarmaLytixWeeklyReport[]> {
  return useQuery({
    queryKey: queryKeys.karmaLytixHistory(limit),
    queryFn: async () => {
      const { data } = await api.analytics.karmaLytixHistory(limit);
      return data as KarmaLytixWeeklyReport[];
    },
    staleTime: 1000 * 60 * 30,
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

export function useCreateJournal(): UseMutationResult<
  JournalEntry,
  Error,
  { content_encrypted: string; moods?: string[]; tags?: string[] }
> {
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

export function useUpdateJournal(): UseMutationResult<
  JournalEntry,
  Error,
  { id: string; content_encrypted: string; moods?: string[]; tags?: string[] }
> {
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
