/**
 * Karmalytix — Dharmic Analysis dashboard.
 *
 * Full-bleed view of the KIAAN Sacred Mirror: the 6-section structured
 * reflection generated from plaintext journal metadata (never from the
 * encrypted body). Data comes from `GET /api/analytics/weekly-report` and
 * `POST /api/analytics/generate` (see
 * backend/routes/analytics_karmalytix.py).
 *
 * Sections rendered:
 *   1. Mirror          — what this week's metadata reveals.
 *   2. Pattern         — one recurring pattern across mood/tags/timing.
 *   3. Gita Echo       — curated verse (BG chapter.verse + Sanskrit).
 *   4. Growth Edge     — weakest dimension framed as an invitation.
 *   5. Blessing        — Gita-grounded blessing.
 *   6. Dynamic Wisdom  — fresh 50-80 word wisdom specific to the week.
 *
 * Also shows a Karma Dimensions radar-style bar breakdown + history link.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  DivineBackground,
  GoldenButton,
  GoldenHeader,
  Text,
  colors,
  spacing,
} from '@kiaanverse/ui';
import {
  useGenerateKarmaLytixReport,
  useKarmaLytixWeeklyReport,
} from '@kiaanverse/api';
import type { KarmaLytixWeeklyReport } from '@kiaanverse/api';
import { LotusGlyph } from '../components/sacred-reflections/LotusGlyph';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SacredMirror {
  readonly mirror?: string;
  readonly pattern?: string;
  readonly blessing?: string;
  readonly growth_edge?: string;
  readonly dynamic_wisdom?: string;
  readonly gita_echo?: {
    readonly chapter?: number;
    readonly verse?: number;
    readonly sanskrit?: string;
    readonly connection?: string;
  };
}

function extractMirror(
  report: KarmaLytixWeeklyReport | undefined
): SacredMirror | null {
  if (!report || report.insufficient_data) return null;
  const patterns = report.patterns_detected as
    | Record<string, unknown>
    | undefined;
  if (!patterns || typeof patterns !== 'object') return null;
  if (!('mirror' in patterns) && !('pattern' in patterns)) return null;
  return patterns as SacredMirror;
}

function formatDimensionName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function KarmalytixScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useKarmaLytixWeeklyReport();
  const generate = useGenerateKarmaLytixReport();
  const [refreshing, setRefreshing] = React.useState(false);

  const mirror = extractMirror(data);
  const insufficient = data?.insufficient_data === true;
  const entriesNeeded = data?.entries_needed ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onRegenerate = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await generate.mutateAsync({ forceRegenerate: true });
      await refetch();
    } catch {
      // silent — UI keeps the cached mirror
    }
  }, [generate, refetch]);

  const onOpenSacred = useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/sacred-reflections');
  }, [router]);

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GoldenHeader title="Karmalytix" onBack={() => router.back()} />
        <Text
          variant="caption"
          color={colors.primary[500]}
          style={styles.sanskritSubtitle}
        >
          कर्म-दर्पण · Dharmic Analysis via Kiaan AI
        </Text>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* -- Insufficient data state -- */}
          {insufficient || (!isLoading && !mirror) ? (
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={styles.insufficientCard}
            >
              <LotusGlyph size={88} />
              <Text
                variant="h2"
                color={colors.text.primary}
                style={styles.insufficientTitle}
              >
                Your mirror awaits
              </Text>
              <Text
                variant="caption"
                color={colors.text.secondary}
                style={styles.insufficientSub}
              >
                {entriesNeeded > 0
                  ? `Write ${entriesNeeded} more reflection${entriesNeeded === 1 ? '' : 's'} this week and KIAAN will craft your Sacred Mirror from the patterns.`
                  : "Journal for a few days — then return for Sakha's weekly reflection."}
              </Text>
              <GoldenButton
                title="Begin a reflection"
                onPress={onOpenSacred}
                style={styles.cta}
              />
            </Animated.View>
          ) : null}

          {/* -- Overall score hero -- */}
          {!insufficient && data ? (
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={styles.scoreHero}
            >
              <Text
                variant="caption"
                color={colors.text.muted}
                style={styles.scoreLabel}
              >
                KARMIC ALIGNMENT
              </Text>
              <Text
                variant="h1"
                color={colors.primary[500]}
                style={styles.scoreValue}
              >
                {data.overall_karma_score}
                <Text variant="h3" color={colors.text.secondary}>
                  {' '}
                  / 100
                </Text>
              </Text>
              {data.period_start && data.period_end ? (
                <Text variant="caption" color={colors.text.muted}>
                  {data.period_start} → {data.period_end}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}

          {/* -- Karma dimensions -- */}
          {!insufficient &&
          data &&
          Object.keys(data.karma_dimensions ?? {}).length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(80).duration(500)}
              style={styles.section}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.sectionLabel}
              >
                KARMA DIMENSIONS
              </Text>
              <View style={styles.dimensions}>
                {Object.entries(data.karma_dimensions).map(([key, value]) => (
                  <View key={key} style={styles.dimensionRow}>
                    <Text
                      variant="caption"
                      color={colors.text.secondary}
                      style={styles.dimensionName}
                    >
                      {formatDimensionName(key)}
                    </Text>
                    <View style={styles.dimensionBarTrack}>
                      <View
                        style={[
                          styles.dimensionBarFill,
                          {
                            width: `${Math.max(0, Math.min(100, Number(value)))}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      variant="caption"
                      color={colors.primary[500]}
                      style={styles.dimensionValue}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* -- Sacred Mirror 6 sections -- */}
          {mirror?.mirror ? (
            <Animated.View
              entering={FadeInDown.delay(160).duration(500)}
              style={styles.card}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                THE MIRROR
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={styles.body}
              >
                {mirror.mirror}
              </Text>
            </Animated.View>
          ) : null}

          {mirror?.pattern ? (
            <Animated.View
              entering={FadeInDown.delay(240).duration(500)}
              style={styles.card}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                PATTERN NOTICED
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={styles.body}
              >
                {mirror.pattern}
              </Text>
            </Animated.View>
          ) : null}

          {mirror?.gita_echo?.sanskrit ? (
            <Animated.View
              entering={FadeInDown.delay(320).duration(500)}
              style={[styles.card, styles.verseCard]}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                GITA ECHO · BG {mirror.gita_echo.chapter}.
                {mirror.gita_echo.verse}
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={styles.sanskritText}
              >
                {mirror.gita_echo.sanskrit}
              </Text>
              {mirror.gita_echo.connection ? (
                <Text
                  variant="caption"
                  color={colors.text.secondary}
                  style={styles.verseConnection}
                >
                  {mirror.gita_echo.connection}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}

          {mirror?.growth_edge ? (
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={styles.card}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                GROWTH EDGE
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={styles.body}
              >
                {mirror.growth_edge}
              </Text>
            </Animated.View>
          ) : null}

          {mirror?.blessing ? (
            <Animated.View
              entering={FadeInDown.delay(480).duration(500)}
              style={styles.card}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                BLESSING
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={[styles.body, styles.blessing]}
              >
                {mirror.blessing}
              </Text>
            </Animated.View>
          ) : null}

          {mirror?.dynamic_wisdom ? (
            <Animated.View
              entering={FadeInDown.delay(560).duration(500)}
              style={[styles.card, styles.wisdomCard]}
            >
              <Text
                variant="label"
                color={colors.primary[500]}
                style={styles.cardLabel}
              >
                DYNAMIC WISDOM · WISDOM CORE
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                style={styles.body}
              >
                {mirror.dynamic_wisdom}
              </Text>
            </Animated.View>
          ) : null}

          {/* -- Actions -- */}
          {!insufficient ? (
            <View style={styles.actions}>
              <GoldenButton
                title={
                  generate.isPending
                    ? 'Regenerating…'
                    : 'Ask KIAAN for a fresh mirror'
                }
                onPress={onRegenerate}
                disabled={generate.isPending}
              />
              <Pressable
                onPress={onOpenSacred}
                style={styles.secondaryLink}
                accessibilityRole="button"
                accessibilityLabel="Back to Sacred Reflection"
              >
                <Text
                  variant="caption"
                  color={colors.text.muted}
                  style={styles.secondaryText}
                >
                  ← Back to Sacred Reflection
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text
            variant="caption"
            color={colors.text.muted}
            style={styles.privacyNote}
          >
            {'\u{1F512}'} Karmalytix only reads plaintext mood + tag metadata.
            Your reflection bodies stay end-to-end encrypted on your device.
          </Text>
        </ScrollView>
      </View>
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  sanskritSubtitle: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  // Insufficient
  insufficientCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.md,
  },
  lotus: { fontSize: 72 },
  insufficientTitle: { fontStyle: 'italic', textAlign: 'center' },
  insufficientSub: { textAlign: 'center', lineHeight: 22 },
  cta: { marginTop: spacing.sm },

  // Score hero
  scoreHero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
    backgroundColor: colors.alpha.goldLight,
    gap: 4,
  },
  scoreLabel: { letterSpacing: 1.4 },
  scoreValue: { fontSize: 54, fontStyle: 'italic' },

  // Karma dimensions
  section: {
    gap: spacing.sm,
  },
  sectionLabel: { letterSpacing: 1.4, paddingHorizontal: spacing.xs },
  dimensions: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.sm,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dimensionName: { flex: 2, textTransform: 'capitalize' },
  dimensionBarTrack: {
    flex: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alpha.whiteLight,
    overflow: 'hidden',
  },
  dimensionBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  dimensionValue: {
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // Cards
  card: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.xs,
  },
  cardLabel: { letterSpacing: 1.4 },
  body: { lineHeight: 24 },
  blessing: { fontStyle: 'italic' },

  verseCard: {
    borderColor: colors.alpha.goldStrong,
    backgroundColor: colors.alpha.goldLight,
  },
  sanskritText: {
    fontSize: 18,
    lineHeight: 28,
  },
  verseConnection: {
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  wisdomCard: {
    borderColor: colors.divine.krishna,
    backgroundColor: colors.alpha.krishnaSoft,
  },

  // Actions
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  secondaryLink: { paddingVertical: spacing.sm },
  secondaryText: { textAlign: 'center' },
  privacyNote: {
    marginTop: spacing.lg,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});
