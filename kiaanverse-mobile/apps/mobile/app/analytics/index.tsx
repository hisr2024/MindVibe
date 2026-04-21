/**
 * KarmaLytix — the Sacred Mirror.
 *
 * Zero-knowledge analytics surface. Every number rendered here is computed
 * from metadata that never sees the decrypted reflection body: mood tags,
 * journal tag arrays, weekly-assessment answers stored in AsyncStorage, and
 * Gita bookmark counts pulled from the local zustand store. Encrypted body
 * text is read by neither this screen nor the calculator that feeds it.
 *
 * Three views:
 *   - Overview   — overall score ring + 5 dimension mini-bars + metadata stats
 *   - Dimensions — each karma dimension in its own card with week-over-week delta
 *   - Sacred Mirror — KIAAN's five-section reflection (client-templated
 *                     fallback until the backend KarmaLytix endpoint ships)
 *
 * The previous "Journey Insights" content that used to live at /analytics is
 * preserved at /analytics/journey-insights and linked from the footer.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  DivineBackground,
  DivineButton,
  GoldenDivider,
  GoldenHeader,
  OmLoader,
  SacredCard,
  SacredProgressRing,
  Text,
  colors,
  spacing,
} from '@kiaanverse/ui';
import {
  useJournalEntries,
  useMoodTrends,
  useWeeklyInsights,
} from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';
import {
  buildReflectionSections,
  computeDimensions,
  getIsoWeekKey,
  getPreviousWeekSnapshot,
  getRecommendedVerseRef,
  loadWeeklyAssessment,
  overallScore,
  persistWeekSnapshot,
  summarizeWeek,
  type KarmaDimensionScores,
  type KarmaMetadataSummary,
  type ReflectionSections,
  type WeeklyAssessmentAnswers,
} from '../../utils/karmalytix';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ViewMode = 'overview' | 'dimensions' | 'reflection';

const VIEW_MODES: ReadonlyArray<{ key: ViewMode; labelKey: string; fallback: string }> = [
  { key: 'overview',    labelKey: 'viewOverview',   fallback: 'Overview' },
  { key: 'dimensions',  labelKey: 'viewDimensions', fallback: 'Dimensions' },
  { key: 'reflection',  labelKey: 'viewReflection', fallback: 'Sacred Mirror' },
];

interface DimensionMeta {
  readonly key: keyof KarmaDimensionScores;
  readonly label: string;
  readonly sanskrit: string;
  readonly color: string;
}

const DIMENSIONS: readonly DimensionMeta[] = [
  { key: 'emotional_balance',  label: 'Emotional Balance',    sanskrit: 'भावनात्मक संतुलन', color: '#EF4444' },
  { key: 'spiritual_growth',   label: 'Spiritual Growth',     sanskrit: 'आध्यात्मिक विकास', color: '#D4A017' },
  { key: 'consistency',        label: 'Practice Consistency', sanskrit: 'साधना सातत्य',     color: '#10B981' },
  { key: 'self_awareness',     label: 'Self Awareness',       sanskrit: 'आत्म-जागरूकता',   color: '#8B5CF6' },
  { key: 'wisdom_integration', label: 'Wisdom Integration',   sanskrit: 'ज्ञान एकीकरण',    color: '#3B82F6' },
];

interface ReflectionSectionMeta {
  readonly key: keyof ReflectionSections;
  readonly sanskrit: string;
  readonly label: string;
}

const REFLECTION_SECTIONS: readonly ReflectionSectionMeta[] = [
  { key: 'mirror',      sanskrit: 'दर्पण',             label: 'Mirror' },
  { key: 'pattern',     sanskrit: 'प्रतिमान',          label: 'Pattern' },
  { key: 'gita_echo',   sanskrit: 'गीता प्रतिध्वनि',  label: 'Gita Echo' },
  { key: 'growth_edge', sanskrit: 'विकास किनारा',       label: 'Growth Edge' },
  { key: 'blessing',    sanskrit: 'आशीर्वाद',          label: 'Blessing' },
];

// Minimum journaling days required before we commit to generating the
// reflection. Matches the spec's "at least 3 entries" guidance.
const MIN_ENTRIES_FOR_REPORT = 3;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function KarmaLytixScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('analytics');
  const [view, setView] = useState<ViewMode>('overview');
  const [expandedSection, setExpandedSection] = useState<keyof ReflectionSections | null>(
    null,
  );

  // -- Metadata sources (journal entries + mood trends + weekly summary) ----
  const { data: journalData, isLoading: journalLoading, refetch: refetchJournal } =
    useJournalEntries();
  const { data: moodTrends, isLoading: moodLoading, refetch: refetchMood } =
    useMoodTrends(7);
  const { data: weeklyInsight } = useWeeklyInsights();
  const bookmarkCount = useGitaStore((s) => s.bookmarkedVerseIds.length);

  // -- Local assessment + previous-week snapshot -----------------------------
  const [assessment, setAssessment] = useState<WeeklyAssessmentAnswers | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<
    (KarmaDimensionScores & { overall: number }) | null
  >(null);

  const currentWeekKey = useMemo(() => getIsoWeekKey(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, prev] = await Promise.all([
        loadWeeklyAssessment(currentWeekKey),
        getPreviousWeekSnapshot(currentWeekKey),
      ]);
      if (cancelled) return;
      setAssessment(a);
      setPreviousSnapshot(prev);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentWeekKey]);

  // -- Derived metadata + dimensions (all on-device) ------------------------
  const summary: KarmaMetadataSummary = useMemo(
    () =>
      summarizeWeek({
        entries: journalData?.entries ?? [],
        moodTrends: moodTrends ?? [],
        bookmarkCount,
        assessment,
        now: new Date(),
      }),
    [journalData, moodTrends, bookmarkCount, assessment],
  );

  const dimensions = useMemo(
    () =>
      computeDimensions({
        summary,
        moodTrends: moodTrends ?? [],
        assessment,
        previousOverall: previousSnapshot?.overall ?? null,
      }),
    [summary, moodTrends, assessment, previousSnapshot],
  );

  const overall = useMemo(() => overallScore(dimensions), [dimensions]);

  const deltas = useMemo<
    (KarmaDimensionScores & { overall: number }) | null
  >(() => {
    if (!previousSnapshot) return null;
    return {
      overall: overall - previousSnapshot.overall,
      emotional_balance: dimensions.emotional_balance - previousSnapshot.emotional_balance,
      spiritual_growth: dimensions.spiritual_growth - previousSnapshot.spiritual_growth,
      consistency: dimensions.consistency - previousSnapshot.consistency,
      self_awareness: dimensions.self_awareness - previousSnapshot.self_awareness,
      wisdom_integration: dimensions.wisdom_integration - previousSnapshot.wisdom_integration,
    };
  }, [dimensions, overall, previousSnapshot]);

  // -- Reflection sections (client-templated from metadata) -----------------
  const reflection = useMemo(
    () => buildReflectionSections({ summary, scores: dimensions, assessment }),
    [summary, dimensions, assessment],
  );

  const recommendedVerse = useMemo(
    () => getRecommendedVerseRef(summary.dominant_mood),
    [summary.dominant_mood],
  );

  // -- Persist this week's snapshot so next week can render deltas ----------
  const hasEntries = summary.entry_count > 0;
  useEffect(() => {
    if (!hasEntries) return;
    void persistWeekSnapshot(currentWeekKey, dimensions, overall);
  }, [hasEntries, currentWeekKey, dimensions, overall]);

  // -- Handlers -------------------------------------------------------------
  const handleViewChange = useCallback((next: ViewMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setView(next);
  }, []);

  const handleSectionToggle = useCallback((key: keyof ReflectionSections) => {
    void Haptics.selectionAsync();
    setExpandedSection((prev) => (prev === key ? null : key));
  }, []);

  const handleRefresh = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void refetchJournal();
    void refetchMood();
  }, [refetchJournal, refetchMood]);

  const isLoading = journalLoading || moodLoading;
  const hasEnoughData = summary.entry_count >= MIN_ENTRIES_FOR_REPORT;

  // -- Render ---------------------------------------------------------------

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <GoldenHeader
          title={t('title', 'KarmaLytix')}
          onBack={() => router.back()}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <Text variant="devanagariSmall" color={colors.primary[500]} align="center">
              कर्म विश्लेषण
            </Text>
            <Text
              variant="caption"
              color={colors.text.muted}
              align="center"
              style={styles.privacyNote}
            >
              {t(
                'privacyNote',
                '🔒 Analyzed from metadata only · Your content is never read',
              )}
            </Text>
          </Animated.View>

          {/* View switcher */}
          <View style={styles.viewSelector}>
            {VIEW_MODES.map((v) => {
              const active = view === v.key;
              return (
                <Pressable
                  key={v.key}
                  onPress={() => handleViewChange(v.key)}
                  style={[styles.viewBtn, active && styles.viewBtnActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    variant="caption"
                    color={active ? colors.primary[500] : colors.text.muted}
                  >
                    {t(v.labelKey, v.fallback)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <OmLoader size={56} label={t('loading', 'Reading your karma patterns…')} />
            </View>
          ) : !hasEnoughData ? (
            <EmptyState
              entriesNeeded={Math.max(0, MIN_ENTRIES_FOR_REPORT - summary.entry_count)}
              onWriteNow={() => router.push('/journal/new')}
            />
          ) : view === 'overview' ? (
            <OverviewView
              overall={overall}
              dimensions={dimensions}
              deltas={deltas}
              summary={summary}
            />
          ) : view === 'dimensions' ? (
            <DimensionsView dimensions={dimensions} deltas={deltas} />
          ) : (
            <ReflectionView
              reflection={reflection}
              expanded={expandedSection}
              onToggle={handleSectionToggle}
              kiaanInsight={weeklyInsight?.summary ?? null}
              topInsight={weeklyInsight?.top_insight ?? null}
              recommendedVerse={recommendedVerse}
              summary={summary}
              onRefresh={handleRefresh}
            />
          )}

          {/* Footer — link to the older Journey Insights view */}
          <View style={styles.footerLink}>
            <DivineButton
              title={t('viewJourneyInsights', 'View Journey Insights')}
              variant="ghost"
              onPress={() => router.push('/analytics/journey-insights')}
            />
          </View>
        </ScrollView>
      </View>
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Subviews
// ---------------------------------------------------------------------------

function EmptyState({
  entriesNeeded,
  onWriteNow,
}: {
  entriesNeeded: number;
  onWriteNow: () => void;
}): React.JSX.Element {
  const { t } = useTranslation('analytics');
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <Text variant="h1" align="center">
        {'\u{1FA9E}'}
      </Text>
      <Text variant="h3" color={colors.text.primary} align="center">
        {t('emptyTitle', 'Your Sacred Mirror Awaits')}
      </Text>
      <Text variant="body" color={colors.text.secondary} align="center" style={styles.emptyBody}>
        {entriesNeeded === 0
          ? t(
              'emptySubReady',
              'Let KIAAN illuminate your karmic patterns from this week’s metadata.',
            )
          : t(
              'emptySubNeedMore',
              'Write a few more reflections this week, then return here for your sacred mirror.',
            )}
      </Text>
      <Text variant="caption" color={colors.text.muted} align="center" style={styles.emptyNote}>
        {t(
          'emptyNote',
          'Your journal content is never read. KarmaLytix works only from mood labels, tags, and the weekly assessment you complete.',
        )}
      </Text>
      <DivineButton
        title={t('writeReflection', 'Write a Reflection')}
        variant="primary"
        onPress={onWriteNow}
      />
    </Animated.View>
  );
}

function DeltaBadge({ delta }: { delta: number | undefined }): React.JSX.Element | null {
  if (delta === undefined || delta === 0) return null;
  const positive = delta > 0;
  return (
    <Text
      variant="caption"
      color={positive ? '#10B981' : '#EF4444'}
      style={styles.delta}
    >
      {positive ? '↑' : '↓'} {Math.abs(delta)} from last week
    </Text>
  );
}

function OverviewView({
  overall,
  dimensions,
  deltas,
  summary,
}: {
  overall: number;
  dimensions: KarmaDimensionScores;
  deltas: (KarmaDimensionScores & { overall: number }) | null;
  summary: KarmaMetadataSummary;
}): React.JSX.Element {
  const { t } = useTranslation('analytics');
  return (
    <View style={styles.stack}>
      {/* Overall ring */}
      <SacredCard style={styles.scoreCard}>
        <Text variant="caption" color={colors.text.muted}>
          {t('dharmicAlignment', 'Dharmic Alignment · This Week')}
        </Text>
        <View style={styles.ringWrap}>
          <SacredProgressRing
            progress={overall / 100}
            size={140}
            label={`${overall}`}
            caption={t('outOf100', '/ 100')}
          />
        </View>
        {deltas ? <DeltaBadge delta={deltas.overall} /> : null}
      </SacredCard>

      {/* Dimensions summary */}
      <SacredCard>
        <Text variant="label" color={colors.text.primary}>
          {t('dimensionsHeading', 'Karma Dimensions')}
        </Text>
        <GoldenDivider style={styles.cardDivider} />
        {DIMENSIONS.map((d) => {
          const score = dimensions[d.key];
          return (
            <View key={d.key} style={styles.dimRow}>
              <View style={styles.dimLabels}>
                <Text variant="bodySmall" color={colors.text.primary}>
                  {d.label}
                </Text>
                <Text variant="caption" color={colors.primary[500]}>
                  {d.sanskrit}
                </Text>
              </View>
              <Text variant="label" color={d.color} style={styles.dimScore}>
                {score}
              </Text>
              <View style={styles.dimBarBg}>
                <View
                  style={[
                    styles.dimBar,
                    { width: `${score}%`, backgroundColor: d.color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </SacredCard>

      {/* Metadata summary */}
      <SacredCard>
        <Text variant="label" color={colors.text.primary}>
          {t('thisWeeksPractice', "This Week's Sacred Practice")}
        </Text>
        <GoldenDivider style={styles.cardDivider} />
        <View style={styles.metaGrid}>
          <MetaStat value={summary.entry_count} label={t('statEntries', 'Entries')} sanskrit="प्रविष्टियाँ" />
          <MetaStat value={summary.journaling_days} label={t('statDays', 'Days')} sanskrit="दिन" />
          <MetaStat value={summary.verse_bookmarks} label={t('statVerses', 'Verses')} sanskrit="श्लोक" />
        </View>
        {summary.top_tags.length > 0 ? (
          <View style={styles.topTagsRow}>
            <Text variant="caption" color={colors.text.muted}>
              {t('topThemes', 'Top themes:')}
            </Text>
            {summary.top_tags.map((entry) => (
              <View key={entry.tag} style={styles.tagPill}>
                <Text variant="caption" color={colors.primary[500]}>
                  {entry.tag}
                </Text>
                <Text variant="caption" color={colors.text.muted}>
                  · {entry.count}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </SacredCard>
    </View>
  );
}

function DimensionsView({
  dimensions,
  deltas,
}: {
  dimensions: KarmaDimensionScores;
  deltas: (KarmaDimensionScores & { overall: number }) | null;
}): React.JSX.Element {
  return (
    <View style={styles.stack}>
      {DIMENSIONS.map((d, index) => {
        const score = dimensions[d.key];
        const delta = deltas ? deltas[d.key] : undefined;
        return (
          <Animated.View key={d.key} entering={FadeInDown.delay(index * 60).duration(360)}>
            <SacredCard>
              <View style={styles.dimCardHeader}>
                <View style={styles.dimLabels}>
                  <Text variant="label" color={d.color}>
                    {d.label}
                  </Text>
                  <Text variant="caption" color={colors.primary[500]}>
                    {d.sanskrit}
                  </Text>
                </View>
                <View style={styles.dimCardScoreWrap}>
                  <Text variant="h2" color={d.color}>
                    {score}
                  </Text>
                  <Text variant="caption" color={colors.text.muted}>
                    / 100
                  </Text>
                </View>
              </View>
              <View style={[styles.dimBarBg, styles.dimCardBar]}>
                <View
                  style={[
                    styles.dimBar,
                    { width: `${score}%`, backgroundColor: d.color, height: 8 },
                  ]}
                />
              </View>
              <DeltaBadge delta={delta} />
            </SacredCard>
          </Animated.View>
        );
      })}
    </View>
  );
}

function ReflectionView({
  reflection,
  expanded,
  onToggle,
  kiaanInsight,
  topInsight,
  recommendedVerse,
  summary,
  onRefresh,
}: {
  reflection: ReflectionSections;
  expanded: keyof ReflectionSections | null;
  onToggle: (key: keyof ReflectionSections) => void;
  kiaanInsight: string | null;
  topInsight: string | null;
  recommendedVerse: { chapter: number; verse: number; note: string };
  summary: KarmaMetadataSummary;
  onRefresh: () => void;
}): React.JSX.Element {
  const { t } = useTranslation('analytics');
  return (
    <View style={styles.stack}>
      {/* KIAAN insight header — pulled from /api/analytics/weekly-summary */}
      {kiaanInsight ? (
        <SacredCard style={styles.insightCard} glowing>
          <Text variant="label" color={colors.primary[500]}>
            ✦ {t('kiaanReflection', "KIAAN's Sacred Reflection")}
          </Text>
          <Text variant="caption" color={colors.text.muted} style={styles.insightSub}>
            {t('channelledThrough', 'Channelled through Bhagavad Gita wisdom')}
          </Text>
          <GoldenDivider style={styles.cardDivider} />
          <Text variant="body" color={colors.text.primary} style={styles.insightBody}>
            {kiaanInsight}
          </Text>
          {topInsight ? (
            <Text variant="bodySmall" color={colors.text.secondary} style={styles.insightTop}>
              {topInsight}
            </Text>
          ) : null}
        </SacredCard>
      ) : null}

      {/* Five reflection sections (accordion) */}
      {REFLECTION_SECTIONS.map((sec) => {
        const content = reflection[sec.key];
        const isOpen = expanded === sec.key;
        return (
          <Pressable
            key={sec.key}
            onPress={() => onToggle(sec.key)}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            accessibilityLabel={`${sec.label} section`}
          >
            <SacredCard>
              <View style={styles.sectionHeader}>
                <View>
                  <Text variant="devanagariSmall" color={colors.primary[500]}>
                    {sec.sanskrit}
                  </Text>
                  <Text variant="caption" color={colors.text.muted}>
                    {sec.label}
                  </Text>
                </View>
                <Text variant="h3" color={colors.primary[500]}>
                  {isOpen ? '∧' : '∨'}
                </Text>
              </View>
              {isOpen ? (
                <>
                  <GoldenDivider style={styles.cardDivider} />
                  <Text variant="body" color={colors.text.primary} style={styles.sectionBody}>
                    {content}
                  </Text>
                  {sec.key === 'gita_echo' ? (
                    <View style={styles.verseBox}>
                      <Text
                        variant="caption"
                        color={colors.text.muted}
                        style={styles.verseRef}
                      >
                        BG {recommendedVerse.chapter}.{recommendedVerse.verse}
                      </Text>
                      <Text variant="sacredSmall" color={colors.primary[500]}>
                        {recommendedVerse.note}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </SacredCard>
          </Pressable>
        );
      })}

      {/* Dynamic wisdom (backend-only; stub when missing) */}
      <SacredCard style={styles.dynamicCard}>
        <Text variant="label" color={colors.primary[500]}>
          {t('dynamicWisdom', 'Dynamic Wisdom')}
        </Text>
        <Text variant="devanagariSmall" color={colors.primary[500]}>
          गतिशील ज्ञान
        </Text>
        <GoldenDivider style={styles.cardDivider} />
        <Text variant="bodySmall" color={colors.text.secondary}>
          {summary.dominant_mood
            ? t(
                'dynamicWisdomPending',
                "Fresh wisdom for this week's theme will appear here when the KarmaLytix engine finishes its weekly run.",
              )
            : t(
                'dynamicWisdomFirstWeek',
                'Your first week of reflections is being seeded. The dynamic wisdom will arrive once enough metadata has accrued.',
              )}
        </Text>
        <Text variant="caption" color={colors.text.muted} style={styles.dynamicNote}>
          {t('dynamicNote', 'Generated fresh each week by KIAAN · Grounded in Gita philosophy')}
        </Text>
      </SacredCard>

      {/* Refresh CTA */}
      <View style={styles.refreshWrap}>
        <DivineButton
          title={t('refreshMirror', 'Refresh Sacred Mirror')}
          variant="secondary"
          onPress={onRefresh}
        />
      </View>
    </View>
  );
}

function MetaStat({
  value,
  label,
  sanskrit,
}: {
  value: number;
  label: string;
  sanskrit: string;
}): React.JSX.Element {
  return (
    <View style={styles.metaStat}>
      <Text variant="h2" color={colors.primary[500]}>
        {value}
      </Text>
      <Text variant="caption" color={colors.text.secondary}>
        {label}
      </Text>
      <Text variant="caption" color={colors.primary[500]}>
        {sanskrit}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // -- Hero --
  hero: {
    marginBottom: spacing.sm,
  },
  privacyNote: {
    marginTop: spacing.xxs,
    fontStyle: 'italic',
  },

  // -- View selector --
  viewSelector: {
    flexDirection: 'row',
    gap: spacing.xxs,
    marginVertical: spacing.md,
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.alpha.whiteLight,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewBtnActive: {
    backgroundColor: colors.alpha.goldMedium,
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
  },

  // -- Shared --
  stack: {
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  cardDivider: {
    marginVertical: spacing.sm,
  },

  // -- Empty --
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  emptyBody: {
    lineHeight: 22,
  },
  emptyNote: {
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // -- Overview --
  scoreCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  delta: {
    marginTop: spacing.xs,
  },

  // -- Dimension rows --
  dimRow: {
    marginBottom: spacing.sm,
  },
  dimLabels: {
    flex: 1,
  },
  dimScore: {
    textAlign: 'right',
    marginBottom: spacing.xxs,
  },
  dimBarBg: {
    height: 4,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dimBar: {
    height: 4,
    borderRadius: 2,
  },
  dimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dimCardScoreWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  dimCardBar: {
    height: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  // -- Meta stats --
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 12,
  },
  topTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },

  // -- Reflection --
  insightCard: {
    gap: spacing.xxs,
  },
  insightSub: {
    fontStyle: 'italic',
  },
  insightBody: {
    lineHeight: 24,
  },
  insightTop: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionBody: {
    lineHeight: 24,
  },
  verseBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 12,
    gap: spacing.xs,
  },
  verseRef: {
    textAlign: 'right',
  },

  // -- Dynamic wisdom --
  dynamicCard: {
    gap: spacing.xxs,
  },
  dynamicNote: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // -- Refresh --
  refreshWrap: {
    marginTop: spacing.sm,
  },

  // -- Footer --
  footerLink: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
