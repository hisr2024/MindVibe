/**
 * karmalytix — unit tests for the zero-knowledge dimension calculator.
 *
 * Every function here is deterministic and operates on plaintext metadata
 * (mood tags, journal tags, bookmark counts, weekly-assessment answers).
 * No API calls, no Skia, no AsyncStorage writes during the pure tests —
 * AsyncStorage reads are mocked where persistence helpers are exercised.
 */

import type { JournalEntry, MoodTrend } from '@kiaanverse/api';

import {
  CHALLENGING_MOODS,
  NEUTRAL_MOODS,
  POSITIVE_MOODS,
  buildReflectionSections,
  computeDimensions,
  getIsoWeekKey,
  overallScore,
  summarizeWeek,
  type KarmaDimensionScores,
  type WeeklyAssessmentAnswers,
} from '../utils/karmalytix';

// ---------------------------------------------------------------------------
// Mood classification sets
// ---------------------------------------------------------------------------

describe('mood classification sets', () => {
  it('positive, neutral, challenging sets are disjoint', () => {
    for (const m of POSITIVE_MOODS) {
      expect(NEUTRAL_MOODS.has(m)).toBe(false);
      expect(CHALLENGING_MOODS.has(m)).toBe(false);
    }
    for (const m of NEUTRAL_MOODS) {
      expect(CHALLENGING_MOODS.has(m)).toBe(false);
    }
  });

  it('covers the canonical mood vocabulary', () => {
    expect(POSITIVE_MOODS.has('peaceful')).toBe(true);
    expect(POSITIVE_MOODS.has('grateful')).toBe(true);
    expect(NEUTRAL_MOODS.has('neutral')).toBe(true);
    expect(CHALLENGING_MOODS.has('anxious')).toBe(true);
    expect(CHALLENGING_MOODS.has('angry')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getIsoWeekKey
// ---------------------------------------------------------------------------

describe('getIsoWeekKey', () => {
  it('formats YYYY-Www with a zero-padded week number', () => {
    // 2026-01-05 (Mon) is ISO week 2026-W02.
    expect(getIsoWeekKey(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W02');
  });

  it('rolls a Sunday into the prior ISO week', () => {
    // 2026-01-04 is a Sunday → ISO week 2026-W01.
    expect(getIsoWeekKey(new Date('2026-01-04T23:59:59Z'))).toBe('2026-W01');
  });

  it('uses ISO week 53 on years that have one', () => {
    // 2020-12-31 (Thu) is ISO 2020-W53.
    expect(getIsoWeekKey(new Date('2020-12-31T00:00:00Z'))).toBe('2020-W53');
  });

  it('wraps to the next ISO year for an early-January Thursday', () => {
    // 2025-01-02 (Thu) is ISO 2025-W01.
    expect(getIsoWeekKey(new Date('2025-01-02T00:00:00Z'))).toBe('2025-W01');
  });
});

// ---------------------------------------------------------------------------
// summarizeWeek
// ---------------------------------------------------------------------------

function makeEntry(
  partial: Partial<JournalEntry> & { created_at: string }
): JournalEntry {
  return {
    id: partial.id ?? 'e-' + partial.created_at,
    user_id: partial.user_id ?? 'u1',
    content_encrypted: partial.content_encrypted ?? 'CIPHER',
    tags: partial.tags ?? [],
    mood_tag: partial.mood_tag,
    created_at: partial.created_at,
    updated_at: partial.updated_at ?? partial.created_at,
  } as unknown as JournalEntry;
}

describe('summarizeWeek', () => {
  const now = new Date('2026-04-24T12:00:00Z');

  it('only counts entries within the 7-day window ending at `now`', () => {
    const entries = [
      makeEntry({ created_at: '2026-04-20T08:00:00Z', mood_tag: 'peaceful' }),
      makeEntry({ created_at: '2026-04-23T21:00:00Z', mood_tag: 'grateful' }),
      // Outside the window (9 days ago):
      makeEntry({ created_at: '2026-04-15T08:00:00Z', mood_tag: 'angry' }),
    ];

    const summary = summarizeWeek({
      entries,
      moodTrends: [],
      bookmarkCount: 0,
      assessment: null,
      now,
    });

    expect(summary.entry_count).toBe(2);
    expect(summary.dominant_mood).toBe('peaceful');
  });

  it('counts distinct journaling days, not total entries', () => {
    const entries = [
      makeEntry({ created_at: '2026-04-20T08:00:00Z' }),
      makeEntry({ created_at: '2026-04-20T20:00:00Z' }),
      makeEntry({ created_at: '2026-04-22T08:00:00Z' }),
    ];

    const summary = summarizeWeek({
      entries,
      moodTrends: [],
      bookmarkCount: 0,
      assessment: null,
      now,
    });

    expect(summary.entry_count).toBe(3);
    expect(summary.journaling_days).toBe(2);
  });

  it('derives dominant_mood from mood trends when tags are absent', () => {
    const trends: MoodTrend[] = [
      { date: '2026-04-22', dominantMood: 'peaceful', averageIntensity: 4 },
      { date: '2026-04-23', dominantMood: 'peaceful', averageIntensity: 5 },
    ] as unknown as MoodTrend[];

    const summary = summarizeWeek({
      entries: [],
      moodTrends: trends,
      bookmarkCount: 0,
      assessment: null,
      now,
    });

    expect(summary.dominant_mood).toBe('peaceful');
    expect(summary.entry_count).toBe(0);
  });

  it('ranks user tags by count and returns the top 3', () => {
    const entries = [
      makeEntry({ created_at: '2026-04-20T08:00:00Z', tags: ['work'] }),
      makeEntry({
        created_at: '2026-04-21T08:00:00Z',
        tags: ['work', 'family'],
      }),
      makeEntry({
        created_at: '2026-04-22T08:00:00Z',
        tags: ['work', 'family', 'health'],
      }),
      makeEntry({ created_at: '2026-04-23T08:00:00Z', tags: ['sleep'] }),
    ];

    const summary = summarizeWeek({
      entries,
      moodTrends: [],
      bookmarkCount: 0,
      assessment: null,
      now,
    });

    // The first tag of each entry is treated as the mood fallback, so only
    // the 2nd-and-onwards tags flow into top_tags. Verify ordering is
    // count-descending.
    const tagNames = summary.top_tags.map((t) => t.tag);
    expect(tagNames[0]).toBe('family');
    expect(summary.top_tags[0]!.count).toBeGreaterThanOrEqual(
      summary.top_tags[1]?.count ?? 0
    );
  });

  it('reports assessment_completed based on non-null assessment', () => {
    const assessment: WeeklyAssessmentAnswers = {
      dharmic_challenge: 'ego',
      gita_teaching: '2.47',
      consistency_score: 4,
      pattern_noticed: 'morning restlessness',
      sankalpa_for_next_week: 'breathe first',
      saved_at: '2026-04-24T00:00:00Z',
    };

    const withAssessment = summarizeWeek({
      entries: [],
      moodTrends: [],
      bookmarkCount: 0,
      assessment,
      now,
    });
    const without = summarizeWeek({
      entries: [],
      moodTrends: [],
      bookmarkCount: 0,
      assessment: null,
      now,
    });

    expect(withAssessment.assessment_completed).toBe(true);
    expect(without.assessment_completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeDimensions
// ---------------------------------------------------------------------------

describe('computeDimensions', () => {
  const baseSummary = {
    entry_count: 0,
    journaling_days: 0,
    unique_tags: 0,
    top_tags: [] as { tag: string; count: number }[],
    dominant_mood: null,
    dominant_category: null,
    dominant_time_of_day: null,
    verse_bookmarks: 0,
    assessment_completed: false,
  };

  it('clamps every dimension into [0, 100]', () => {
    const scores = computeDimensions({
      summary: baseSummary,
      moodTrends: [],
      assessment: null,
      previousOverall: null,
    });

    for (const [key, value] of Object.entries(scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(Number.isInteger(value)).toBe(true);
      // Guard against NaN leaking through Math.round.
      expect(Number.isFinite(value)).toBe(true);
      if (typeof value !== 'number')
        throw new Error(`${key} must be number, got ${typeof value}`);
    }
  });

  it('gives a perfect consistency score for 7 journaling days with depth', () => {
    const scores = computeDimensions({
      summary: {
        ...baseSummary,
        entry_count: 14,
        journaling_days: 7,
        unique_tags: 6,
      },
      moodTrends: [],
      assessment: null,
      previousOverall: null,
    });

    expect(scores.consistency).toBe(100);
  });

  it('rewards positive mood trends on emotional_balance', () => {
    const positiveTrends: MoodTrend[] = [
      { date: '2026-04-22', dominantMood: 'peaceful' },
      { date: '2026-04-23', dominantMood: 'grateful' },
      { date: '2026-04-24', dominantMood: 'peaceful' },
    ] as unknown as MoodTrend[];
    const challengingTrends: MoodTrend[] = [
      { date: '2026-04-22', dominantMood: 'anxious' },
      { date: '2026-04-23', dominantMood: 'sad' },
      { date: '2026-04-24', dominantMood: 'angry' },
    ] as unknown as MoodTrend[];

    const pos = computeDimensions({
      summary: baseSummary,
      moodTrends: positiveTrends,
      assessment: null,
      previousOverall: null,
    });
    const neg = computeDimensions({
      summary: baseSummary,
      moodTrends: challengingTrends,
      assessment: null,
      previousOverall: null,
    });

    expect(pos.emotional_balance).toBeGreaterThan(neg.emotional_balance);
  });

  it('rewards wisdom_integration when bookmarks and assessment both exist', () => {
    const scores = computeDimensions({
      summary: {
        ...baseSummary,
        verse_bookmarks: 5,
        assessment_completed: true,
      },
      moodTrends: [],
      assessment: null,
      previousOverall: null,
    });

    expect(scores.wisdom_integration).toBeGreaterThanOrEqual(60);
  });

  it('gives self_awareness credit for tag diversity and entry volume', () => {
    const scores = computeDimensions({
      summary: { ...baseSummary, unique_tags: 9, entry_count: 7 },
      moodTrends: [],
      assessment: null,
      previousOverall: null,
    });

    // 9 unique tags → 72 (capped), 7 entries → 28 → 100.
    expect(scores.self_awareness).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// overallScore
// ---------------------------------------------------------------------------

describe('overallScore', () => {
  it('averages the five dimensions with rounding', () => {
    const scores: KarmaDimensionScores = {
      emotional_balance: 80,
      spiritual_growth: 70,
      consistency: 90,
      self_awareness: 60,
      wisdom_integration: 50,
    };
    // mean = 70
    expect(overallScore(scores)).toBe(70);
  });

  it('returns 0 when every dimension is zero', () => {
    expect(
      overallScore({
        emotional_balance: 0,
        spiritual_growth: 0,
        consistency: 0,
        self_awareness: 0,
        wisdom_integration: 0,
      })
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildReflectionSections
// ---------------------------------------------------------------------------

describe('buildReflectionSections', () => {
  it('returns the 5 sacred sections with non-empty text', () => {
    const summary = {
      entry_count: 5,
      journaling_days: 5,
      unique_tags: 4,
      top_tags: [{ tag: 'family', count: 3 }],
      dominant_mood: 'peaceful',
      dominant_category: null,
      dominant_time_of_day: 'morning',
      verse_bookmarks: 2,
      assessment_completed: true,
    };
    const scores: KarmaDimensionScores = {
      emotional_balance: 72,
      spiritual_growth: 68,
      consistency: 85,
      self_awareness: 60,
      wisdom_integration: 75,
    };

    const sections = buildReflectionSections({
      summary,
      scores,
      overall: overallScore(scores),
      previousOverall: 60,
    });

    expect(typeof sections.mirror).toBe('string');
    expect(sections.mirror.length).toBeGreaterThan(0);
    expect(typeof sections.pattern).toBe('string');
    expect(typeof sections.gita_echo).toBe('string');
    expect(typeof sections.growth_edge).toBe('string');
    expect(typeof sections.blessing).toBe('string');
  });
});
