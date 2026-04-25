/**
 * KarmaLytix — zero-knowledge dimension calculator.
 *
 * Every score is derived from metadata that already lives on-device: mood
 * trends, journal tags/mood_tags, AsyncStorage weekly assessments, and the
 * gita bookmark store. Journal body text is AES-256-GCM encrypted and is
 * never inspected here.
 *
 * The five dimensions and their formulas mirror the KarmaLytix spec so the
 * same scores can later be recomputed server-side for historical trends.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalEntry, MoodTrend } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Mood classification used by Emotional Balance and templated reflections.
// ---------------------------------------------------------------------------

export const POSITIVE_MOODS = new Set([
  'peaceful',
  'grateful',
  'hopeful',
  'inspired',
  'blissful',
  'joyful',
]);

export const NEUTRAL_MOODS = new Set(['neutral', 'tired']);

export const CHALLENGING_MOODS = new Set([
  'anxious',
  'sad',
  'confused',
  'angry',
  'heavy',
  'unsettled',
]);

function moodSignedValue(mood: string | undefined): number {
  if (!mood) return 0;
  if (POSITIVE_MOODS.has(mood)) return 1;
  if (NEUTRAL_MOODS.has(mood)) return 0;
  if (CHALLENGING_MOODS.has(mood)) return -1;
  return 0;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---------------------------------------------------------------------------
// Weekly assessment persistence (mirrors apps/.../journal/new.tsx).
// ---------------------------------------------------------------------------

const ASSESSMENT_STORAGE_KEY = 'mindvibe_weekly_assessment_v1';

export interface WeeklyAssessmentAnswers {
  readonly dharmic_challenge: string;
  readonly gita_teaching: string;
  readonly consistency_score: number;
  readonly pattern_noticed: string;
  readonly sankalpa_for_next_week: string;
  readonly saved_at: string;
}

export function getIsoWeekKey(date: Date): string {
  // Use UTC accessors throughout. Mixing local accessors (getFullYear /
  // getMonth / getDate) with Date.UTC() makes the result depend on the
  // user's timezone — e.g. 2026-01-04T23:59:59Z is Sunday in UTC but
  // Monday 00:59:59 in CET, which would shift this Sunday into W02
  // instead of W01. ISO week keys must be deterministic per Date instance.
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function loadWeeklyAssessment(
  weekKey: string
): Promise<WeeklyAssessmentAnswers | null> {
  try {
    const raw = await AsyncStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, WeeklyAssessmentAnswers>;
    return parsed[weekKey] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Previous-week snapshot — lets us render week-over-week deltas without the
// backend involved. Snapshots are taken each time the user opens the screen
// in a new ISO week.
// ---------------------------------------------------------------------------

const SNAPSHOT_STORAGE_KEY = 'mindvibe_karmalytix_snapshots_v1';

type SnapshotStore = Record<string, KarmaDimensionScores & { overall: number }>;

async function loadSnapshotStore(): Promise<SnapshotStore> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as SnapshotStore)
      : {};
  } catch {
    return {};
  }
}

export async function persistWeekSnapshot(
  weekKey: string,
  scores: KarmaDimensionScores,
  overall: number
): Promise<void> {
  try {
    const store = await loadSnapshotStore();
    store[weekKey] = { ...scores, overall };
    await AsyncStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Snapshots are best-effort — failing to persist just means no deltas.
  }
}

export async function getPreviousWeekSnapshot(
  currentWeekKey: string
): Promise<(KarmaDimensionScores & { overall: number }) | null> {
  const store = await loadSnapshotStore();
  const keys = Object.keys(store)
    .filter((k) => k !== currentWeekKey)
    .sort();
  const prev = keys[keys.length - 1];
  return prev ? (store[prev] ?? null) : null;
}

// ---------------------------------------------------------------------------
// Dimension scoring
// ---------------------------------------------------------------------------

export interface KarmaDimensionScores {
  emotional_balance: number;
  spiritual_growth: number;
  consistency: number;
  self_awareness: number;
  wisdom_integration: number;
}

export interface KarmaMetadataSummary {
  entry_count: number;
  journaling_days: number;
  unique_tags: number;
  top_tags: { tag: string; count: number }[];
  dominant_mood: string | null;
  dominant_category: string | null;
  dominant_time_of_day: string | null;
  verse_bookmarks: number;
  assessment_completed: boolean;
}

export interface KarmaReport {
  week_key: string;
  dimensions: KarmaDimensionScores;
  overall: number;
  metadata: KarmaMetadataSummary;
  deltas: Partial<KarmaDimensionScores> & { overall?: number };
  assessment: WeeklyAssessmentAnswers | null;
}

const CATEGORY_TAGS = new Set([
  'Gratitude',
  'Reflection',
  'Prayer',
  'Dream',
  'Shadow',
]);
const TIME_TAG_PREFIX = 'time:';

function mostFrequent<T extends string>(values: readonly T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Summarize the journal + mood + bookmark metadata for the current week.
 * Every piece of data here is plaintext — encrypted reflection bodies are
 * intentionally excluded.
 */
export function summarizeWeek(input: {
  entries: readonly JournalEntry[];
  moodTrends: readonly MoodTrend[];
  bookmarkCount: number;
  assessment: WeeklyAssessmentAnswers | null;
  now: Date;
}): KarmaMetadataSummary {
  const weekAgo = new Date(input.now.getTime() - 7 * 86_400_000);

  const weekEntries = input.entries.filter((e) => {
    const d = new Date(e.created_at);
    return d >= weekAgo && d <= input.now;
  });

  const journalingDays = new Set(
    weekEntries.map((e) => (e.created_at ?? '').slice(0, 10))
  ).size;

  const moodTags: string[] = [];
  const categoryTags: string[] = [];
  const timeTags: string[] = [];
  const userTags: string[] = [];

  for (const entry of weekEntries) {
    const tags = entry.tags ?? [];
    if (entry.mood_tag) moodTags.push(entry.mood_tag);
    for (const tag of tags) {
      if (tag.startsWith(TIME_TAG_PREFIX)) {
        timeTags.push(tag.slice(TIME_TAG_PREFIX.length));
        continue;
      }
      if (CATEGORY_TAGS.has(tag)) {
        categoryTags.push(tag);
        continue;
      }
      // Treat index-0 tag as the mood if no explicit mood_tag was sent.
      if (!entry.mood_tag && tags.indexOf(tag) === 0) {
        moodTags.push(tag);
        continue;
      }
      userTags.push(tag);
    }
  }

  const tagCounts = new Map<string, number>();
  for (const tag of userTags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  // Fall back to mood trends when entries didn't capture the mood tag.
  const dominantMoodFromTrends = input.moodTrends
    .filter((t) => t.dominantMood)
    .map((t) => t.dominantMood);

  const dominantMood =
    mostFrequent(moodTags) ?? mostFrequent(dominantMoodFromTrends) ?? null;

  return {
    entry_count: weekEntries.length,
    journaling_days: journalingDays,
    unique_tags: new Set(userTags).size,
    top_tags: topTags,
    dominant_mood: dominantMood,
    dominant_category: mostFrequent(categoryTags),
    dominant_time_of_day: mostFrequent(timeTags),
    verse_bookmarks: input.bookmarkCount,
    assessment_completed: input.assessment !== null,
  };
}

/**
 * Core dimension calculator. All formulas are deterministic and clamped to
 * the 0..100 range so the UI can render them as ring/bar progress.
 */
export function computeDimensions(input: {
  summary: KarmaMetadataSummary;
  moodTrends: readonly MoodTrend[];
  assessment: WeeklyAssessmentAnswers | null;
  previousOverall: number | null;
}): KarmaDimensionScores {
  // -- 1. Emotional Balance -------------------------------------------------
  const trendMoods = input.moodTrends.map((t) =>
    moodSignedValue(t.dominantMood)
  );
  let positivePct = 50;
  if (trendMoods.length > 0) {
    const positive = trendMoods.filter((v) => v > 0).length;
    positivePct = (positive / trendMoods.length) * 100;
  }
  // Swing = mean absolute change between consecutive days (0..2). Normalize
  // to 0..100 (higher swing → lower stability).
  let swing = 0;
  if (trendMoods.length > 1) {
    let total = 0;
    for (let i = 1; i < trendMoods.length; i += 1) {
      total += Math.abs(trendMoods[i]! - trendMoods[i - 1]!);
    }
    swing = (total / (trendMoods.length - 1)) * 50; // 0..100
  }
  const stability = 100 - swing;
  const emotional_balance = clamp(positivePct * 0.6 + stability * 0.4);

  // -- 2. Spiritual Growth --------------------------------------------------
  // Growth rewards (a) forward momentum over last week's overall score,
  // (b) bookmarks added, (c) the self-rated consistency from the weekly
  // assessment (evidence they paused to reflect). Centred at 50 so a
  // "steady" week still reads as healthy.
  const deltaBoost = (() => {
    if (input.previousOverall === null) return 0;
    // Each point of week-over-week overall improvement → +2; capped ±30.
    const currentGuess =
      (emotional_balance + (input.summary.journaling_days / 7) * 70) / 2;
    return Math.max(
      -30,
      Math.min(30, (currentGuess - input.previousOverall) * 2)
    );
  })();
  const bookmarksBoost = Math.min(25, input.summary.verse_bookmarks * 5);
  const assessmentBoost = (input.assessment?.consistency_score ?? 0) * 5; // 0..25
  const spiritual_growth = clamp(
    50 + deltaBoost + bookmarksBoost + assessmentBoost - 15
  );

  // -- 3. Practice Consistency ---------------------------------------------
  const consistencyBase = (input.summary.journaling_days / 7) * 70;
  const depthBonus =
    input.summary.entry_count > input.summary.journaling_days ? 20 : 0;
  const richnessBonus = input.summary.entry_count >= 5 ? 10 : 0;
  const consistency = clamp(consistencyBase + depthBonus + richnessBonus);

  // -- 4. Self Awareness ---------------------------------------------------
  const diversityScore = Math.min(72, input.summary.unique_tags * 8);
  const logFrequency = Math.min(28, input.summary.entry_count * 4);
  const self_awareness = clamp(diversityScore + logFrequency);

  // -- 5. Wisdom Integration ------------------------------------------------
  const bookmarkScore = Math.min(60, input.summary.verse_bookmarks * 12);
  const assessmentScore = input.summary.assessment_completed ? 40 : 0;
  const wisdom_integration = clamp(bookmarkScore + assessmentScore);

  return {
    emotional_balance: Math.round(emotional_balance),
    spiritual_growth: Math.round(spiritual_growth),
    consistency: Math.round(consistency),
    self_awareness: Math.round(self_awareness),
    wisdom_integration: Math.round(wisdom_integration),
  };
}

export function overallScore(scores: KarmaDimensionScores): number {
  const values = Object.values(scores);
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / values.length);
}

// ---------------------------------------------------------------------------
// Reflection templates — client-side fallback for the five Sacred Mirror
// sections when no KIAAN backend is available. Each template is purely
// factual; it restates patterns seen in the user's metadata rather than
// fabricating spiritual wisdom.
// ---------------------------------------------------------------------------

export interface ReflectionSections {
  mirror: string;
  pattern: string;
  gita_echo: string;
  growth_edge: string;
  blessing: string;
}

/**
 * Gita verse picks matched to dominant patterns. Only short references are
 * included here — the full Sanskrit + translation lives in the Gita cache
 * and is resolved by the caller via useGitaVerse(chapter, verse).
 */
const GITA_ECHO_BY_MOOD: Record<
  string,
  { chapter: number; verse: number; note: string }
> = {
  anxious: {
    chapter: 2,
    verse: 47,
    note: 'You have a right to action, not to its fruits.',
  },
  sad: {
    chapter: 2,
    verse: 14,
    note: 'Contacts with the world are impermanent — endure them.',
  },
  angry: {
    chapter: 2,
    verse: 62,
    note: 'From attachment, desire; from desire, anger — watch the chain.',
  },
  confused: {
    chapter: 2,
    verse: 7,
    note: 'When confusion clouds duty, ask the Self for guidance.',
  },
  tired: {
    chapter: 6,
    verse: 5,
    note: 'Let the Self lift the self — you are your own ally.',
  },
  neutral: {
    chapter: 6,
    verse: 16,
    note: 'Yoga is not for the excess nor the deprived — balance is the path.',
  },
  grateful: {
    chapter: 9,
    verse: 22,
    note: 'To those steady in devotion, I carry what they need.',
  },
  peaceful: {
    chapter: 2,
    verse: 70,
    note: 'Desires enter the ocean-self that remains still.',
  },
  hopeful: {
    chapter: 4,
    verse: 7,
    note: 'Whenever dharma wanes, the Divine stirs again within.',
  },
  inspired: {
    chapter: 10,
    verse: 20,
    note: 'I am the Self seated in the heart of every being.',
  },
};

const DIMENSION_LABELS: Record<keyof KarmaDimensionScores, string> = {
  emotional_balance: 'Emotional Balance',
  spiritual_growth: 'Spiritual Growth',
  consistency: 'Practice Consistency',
  self_awareness: 'Self Awareness',
  wisdom_integration: 'Wisdom Integration',
};

function findLowestDimension(scores: KarmaDimensionScores): {
  key: keyof KarmaDimensionScores;
  value: number;
} {
  const entries = Object.entries(scores) as [
    keyof KarmaDimensionScores,
    number,
  ][];
  return entries.reduce(
    (lowest, [key, value]) => (value < lowest.value ? { key, value } : lowest),
    { key: entries[0]![0], value: entries[0]![1] }
  );
}

export function buildReflectionSections(input: {
  summary: KarmaMetadataSummary;
  scores: KarmaDimensionScores;
  assessment: WeeklyAssessmentAnswers | null;
}): ReflectionSections {
  const { summary, scores, assessment } = input;

  const mood = summary.dominant_mood ?? 'neutral';
  const topTag = summary.top_tags[0]?.tag ?? null;
  const dayWord = summary.journaling_days === 1 ? 'day' : 'days';

  // --- Mirror -------------------------------------------------------------
  const mirror =
    summary.entry_count === 0
      ? 'This week, the page stayed quiet. When the outer world grows loud, returning to the inner witness is itself a practice.'
      : `This week, you returned to the page on ${summary.journaling_days} of 7 ${dayWord}, writing ${summary.entry_count} reflection${summary.entry_count === 1 ? '' : 's'}. The inner weather most often showed itself as ${mood}${topTag ? `, with ${topTag} as the recurring thread` : ''}. Your metadata is speaking — and it is telling the truth.`;

  // --- Pattern ------------------------------------------------------------
  const timeNote = summary.dominant_time_of_day
    ? ` You tend to write in ${summary.dominant_time_of_day}, when the mind carries that band's particular flavour.`
    : '';
  const pattern = topTag
    ? `The same theme — ${topTag} — surfaced across your ${mood} days, suggesting something is asking to be met.${timeNote}`
    : `A steady ${mood} current ran through the week without one dominant theme.${timeNote}`;

  // --- Gita echo ----------------------------------------------------------
  const echo = GITA_ECHO_BY_MOOD[mood] ?? GITA_ECHO_BY_MOOD.neutral!;
  const gita_echo = `Bhagavad Gita ${echo.chapter}.${echo.verse} — "${echo.note}" This verse arrives because your ${mood} pattern invites exactly this medicine.`;

  // --- Growth edge --------------------------------------------------------
  const lowest = findLowestDimension(scores);
  const growth_edge = `Your quietest dimension this week was ${DIMENSION_LABELS[lowest.key]} (${lowest.value}/100). This is not a deficiency — it is the direction the next step asks of you.`;

  // --- Blessing -----------------------------------------------------------
  const sankalpa = assessment?.sankalpa_for_next_week?.trim();
  const blessing = sankalpa
    ? `May the sankalpa you named — "${sankalpa}" — unfold gently across the coming week, held by the same wisdom that carried you through this one.`
    : 'May the steady witness within you recognise both the shadow and the light of this week — and walk with you into the next without rushing either.';

  return {
    mirror,
    pattern,
    gita_echo,
    growth_edge,
    blessing,
  };
}

export function getRecommendedVerseRef(dominantMood: string | null): {
  chapter: number;
  verse: number;
  note: string;
} {
  const key = dominantMood ?? 'neutral';
  return GITA_ECHO_BY_MOOD[key] ?? GITA_ECHO_BY_MOOD.neutral!;
}
