/**
 * Sacred Reflections — KIAAN tab (बोध).
 *
 * Displays Sakha's weekly reflection (the KarmaLytix Sacred Mirror) when
 * enough journal entries exist for the current ISO week; otherwise renders
 * the lotus empty state from the Kiaanverse.com screenshot: "Your sacred
 * library awaits — Journal for a few days — then return here for Sakha's
 * weekly reflection."
 *
 * Data source: GET /api/analytics/weekly-report (see
 * backend/routes/analytics_karmalytix.py). The full 6-section Sacred Mirror
 * is nested inside ``patterns_detected`` — this tab renders a compact
 * preview and routes users to the dedicated KarmaLytix dashboard for the
 * full experience.
 */

import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GoldenButton, Text, colors, spacing } from '@kiaanverse/ui';
import {
  useGenerateKarmaLytixReport,
  useKarmaLytixWeeklyReport,
} from '@kiaanverse/api';
import type { KarmaLytixWeeklyReport } from '@kiaanverse/api';

import { COPY } from './constants';

interface KiaanTabProps {
  readonly onOpenEditor: () => void;
}

interface SacredMirror {
  readonly mirror?: string;
  readonly pattern?: string;
  readonly blessing?: string;
  readonly growth_edge?: string;
  readonly gita_echo?: {
    readonly chapter?: number;
    readonly verse?: number;
    readonly sanskrit?: string;
    readonly connection?: string;
  };
  readonly dynamic_wisdom?: string;
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

export function KiaanTab({ onOpenEditor }: KiaanTabProps): React.JSX.Element {
  const router = useRouter();
  const { data, isLoading, refetch } = useKarmaLytixWeeklyReport();
  const generate = useGenerateKarmaLytixReport();

  const mirror = extractMirror(data);
  const insufficient = data?.insufficient_data === true;
  const entriesNeeded = data?.entries_needed ?? 0;

  const handleOpenFull = useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/karmalytix');
  }, [router]);

  const handleRegenerate = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await generate.mutateAsync({ forceRegenerate: true });
      await refetch();
    } catch {
      // surface silently — the cached state is still valid
    }
  }, [generate, refetch]);

  // ---- Empty state (matches the Kiaanverse.com screenshot) ----
  if (!isLoading && (!data || insufficient || !mirror)) {
    const sub =
      insufficient && entriesNeeded > 0
        ? `Write ${entriesNeeded} more reflection${entriesNeeded === 1 ? '' : 's'} this week to unlock your Sacred Mirror.`
        : COPY.kiaanEmptySub;

    return (
      <ScrollView contentContainerStyle={styles.emptyWrap}>
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.emptyInner}
        >
          <Text style={styles.lotus}>{'\u{1FAB7}'}</Text>
          <Text
            variant="h2"
            color={colors.text.primary}
            style={styles.emptyTitle}
          >
            {COPY.kiaanEmptyTitle}
          </Text>
          <Text
            variant="caption"
            color={colors.text.secondary}
            style={styles.emptySub}
          >
            {sub}
          </Text>
          <Pressable onPress={onOpenEditor} style={styles.ctaSecondary}>
            <Text variant="label" color={colors.primary[500]}>
              Begin a reflection →
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  // ---- Mirror preview ----
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View entering={FadeIn.duration(500)}>
        <Text
          variant="label"
          color={colors.primary[500]}
          style={styles.sectionLabel}
        >
          SAKHA'S WEEKLY MIRROR
        </Text>
        {mirror?.mirror ? (
          <Text
            variant="body"
            color={colors.text.primary}
            style={styles.mirrorText}
          >
            {mirror.mirror}
          </Text>
        ) : null}

        {mirror?.pattern ? (
          <View style={styles.cardSection}>
            <Text
              variant="label"
              color={colors.text.secondary}
              style={styles.cardLabel}
            >
              PATTERN NOTICED
            </Text>
            <Text
              variant="body"
              color={colors.text.primary}
              style={styles.cardBody}
            >
              {mirror.pattern}
            </Text>
          </View>
        ) : null}

        {mirror?.gita_echo?.sanskrit ? (
          <View style={[styles.cardSection, styles.verseCard]}>
            <Text
              variant="label"
              color={colors.primary[500]}
              style={styles.cardLabel}
            >
              GITA ECHO · BG {mirror.gita_echo.chapter}.{mirror.gita_echo.verse}
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
          </View>
        ) : null}

        {mirror?.blessing ? (
          <View style={styles.cardSection}>
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
              style={[styles.cardBody, styles.blessing]}
            >
              {mirror.blessing}
            </Text>
          </View>
        ) : null}

        <GoldenButton
          title="Open Full Sacred Mirror"
          onPress={handleOpenFull}
          style={styles.cta}
        />
        <Pressable onPress={handleRegenerate} disabled={generate.isPending}>
          <Text
            variant="caption"
            color={colors.text.muted}
            style={styles.regenerate}
          >
            {generate.isPending ? 'Refreshing…' : '↻ Ask for a fresh mirror'}
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyInner: { alignItems: 'center', gap: spacing.md },
  lotus: { fontSize: 72 },
  emptyTitle: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptySub: {
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  ctaSecondary: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },

  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  sectionLabel: {
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  mirrorText: {
    fontStyle: 'italic',
    lineHeight: 26,
  },
  cardSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.xs,
  },
  cardLabel: { letterSpacing: 1.2 },
  cardBody: { lineHeight: 24 },
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
  cta: { marginTop: spacing.lg },
  regenerate: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    textDecorationLine: 'underline',
  },
});
