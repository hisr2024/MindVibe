/**
 * TodaySubTab — Daily practice hub.
 *
 * Mirrors the web mobile TodayTab 1:1:
 *   1. Sanskrit greeting + English line + date.
 *   2. Marquee verse strip (BG 6.35).
 *   3. Stats bar (Active / Completed / Streak / Days).
 *   4. Today's Practice list with N steps pill.
 *   5. Micro Practice card.
 *   6. Streak heatmap card.
 *   7. Continue Your Journey horizontal pager.
 *   8. Recommended For You horizontal pager (only when active < max).
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { DashboardData, JourneyTemplate } from '@kiaanverse/api';

import { ENEMY_INFO, type EnemyKey, enemyAlpha } from '../enemyInfo';
import { MobileStatsBar } from './MobileStatsBar';
import { TodayPracticeCard } from './TodayPracticeCard';
import { MicroPracticeCard } from './MicroPracticeCard';
import { MobileStreakCard } from './MobileStreakCard';
import { ActiveJourneyCardMobile } from './ActiveJourneyCardMobile';
import { getTodayDayMeta } from './dayMeta';

interface GreetingData {
  readonly sanskrit: string;
  readonly english: string;
}

function getGreeting(now: Date = new Date()): GreetingData {
  const h = now.getHours();
  if (h >= 5 && h < 12) return { sanskrit: 'सुप्रभातम्', english: 'Good Morning, Warrior' };
  if (h >= 12 && h < 18) return { sanskrit: 'नमस्कार', english: 'Your practice awaits' };
  if (h >= 18 && h < 22) return { sanskrit: 'संध्या वंदना', english: 'Evening reflection' };
  return { sanskrit: 'रात्री के साधक', english: 'The night belongs to the seeker' };
}

function formatDate(now: Date = new Date()): string {
  return now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function TodaySubTab({
  dashboard,
  templates,
}: {
  readonly dashboard: DashboardData | null | undefined;
  readonly templates: JourneyTemplate[];
}): React.JSX.Element {
  const router = useRouter();
  const greeting = useMemo(() => getGreeting(), []);
  const dateStr = useMemo(() => formatDate(), []);
  const dayMeta = useMemo(() => getTodayDayMeta(), []);

  const todaySteps = dashboard?.todaySteps ?? [];

  // Recommendations — pick 2 templates targeting the user's weakest enemies.
  const recommendations = useMemo<JourneyTemplate[]>(() => {
    if (!dashboard || templates.length === 0) return [];
    if (dashboard.activeCount >= (dashboard.maxActive ?? 5)) return [];
    const sorted = [...dashboard.enemyProgress].sort(
      (a, b) => a.masteryLevel - b.masteryLevel,
    );
    const weakest = new Set(sorted.slice(0, 2).map((p) => p.enemy.toLowerCase()));
    if (weakest.size === 0) return templates.slice(0, 2);
    return templates
      .filter((t) =>
        (t.primaryEnemyTags ?? [t.category])
          .some((e) => weakest.has(e.toLowerCase())),
      )
      .slice(0, 2);
  }, [dashboard, templates]);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text variant="h1" color={colors.divine.aura} style={styles.greetingSanskrit}>
          {greeting.sanskrit}
        </Text>
        <Text variant="body" color={colors.text.primary}>
          {greeting.english}
        </Text>
        <Text variant="caption" color={colors.text.muted} style={styles.dateLine}>
          {dateStr}
        </Text>
      </View>

      {/* Verse strip (static — RN keeps the strip text without an animated marquee) */}
      <Text
        variant="caption"
        color={colors.text.muted}
        align="right"
        style={styles.verseStrip}
        numberOfLines={1}
      >
        अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते — Through practice and detachment, it is mastered (BG 6.35)
      </Text>

      {/* Stats */}
      <MobileStatsBar dashboard={dashboard ?? null} />

      {/* Today's Practice */}
      {todaySteps.length > 0 ? (
        <View>
          <View style={styles.sectionHeader}>
            <Text variant="caption" color={colors.text.muted} style={styles.sectionEyebrow}>
              TODAY'S PRACTICE
            </Text>
            <View style={styles.stepsPill}>
              <Text variant="caption" color={colors.divine.aura}>
                {todaySteps.length} {todaySteps.length === 1 ? 'step' : 'steps'}
              </Text>
            </View>
          </View>
          <View style={styles.cardList}>
            {todaySteps.map((step) => (
              <TodayPracticeCard key={step.stepId} step={step} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.peaceCard}>
          <Text variant="h2" color={colors.divine.aura} align="center">
            ॐ
          </Text>
          <Text variant="body" color={colors.text.primary} align="center">
            You are at peace today.
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center">
            All your steps are complete. Rest in the Atman.
          </Text>
        </View>
      )}

      {/* Micro Practice */}
      <MicroPracticeCard dayMeta={dayMeta} />

      {/* Streak heatmap */}
      {dashboard ? (
        <MobileStreakCard
          currentStreak={dashboard.streakDays}
          totalDaysPracticed={dashboard.totalDaysPracticed}
        />
      ) : null}

      {/* Continue Your Journey */}
      {dashboard && dashboard.activeJourneys.length > 0 ? (
        <View>
          <Text variant="caption" color={colors.text.muted} style={styles.sectionEyebrow}>
            CONTINUE YOUR JOURNEY
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pager}
          >
            {dashboard.activeJourneys.map((j) => (
              <View key={j.id} style={styles.pagerItem}>
                <ActiveJourneyCardMobile journey={j} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Recommended For You */}
      {recommendations.length > 0 ? (
        <View>
          <Text variant="caption" color={colors.text.muted} style={styles.sectionEyebrow}>
            RECOMMENDED FOR YOU
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pager}
          >
            {recommendations.map((t) => {
              const enemyKey =
                (t.primaryEnemyTags?.[0]?.toLowerCase() as EnemyKey | undefined) ??
                (t.category.toLowerCase() as EnemyKey);
              const info = enemyKey ? (ENEMY_INFO[enemyKey] ?? null) : null;
              const accent = info?.color ?? colors.divine.aura;
              return (
                <View
                  key={t.id}
                  style={[
                    styles.recCard,
                    {
                      borderColor: enemyAlpha(enemyKey, 0.25),
                      backgroundColor: enemyAlpha(enemyKey, 0.1),
                    },
                  ]}
                >
                  {info ? (
                    <Text variant="caption" color={accent} style={styles.recDevanagari}>
                      {`${info.devanagari} ${info.name}`}
                    </Text>
                  ) : null}
                  <Text
                    variant="label"
                    color={colors.text.primary}
                    numberOfLines={1}
                  >
                    {t.title}
                  </Text>
                  <Text variant="caption" color={colors.text.muted}>
                    {t.durationDays} days
                  </Text>
                  <View
                    style={[styles.recCta, { backgroundColor: accent }]}
                    onTouchEnd={() => router.push('/(tabs)/journeys')}
                  >
                    <Text variant="label" color="#050714">
                      {'Start →'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  greeting: {
    gap: 2,
  },
  greetingSanskrit: {
    fontStyle: 'italic',
  },
  dateLine: {
    marginTop: 2,
  },
  verseStrip: {
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    letterSpacing: 1.5,
  },
  stepsPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: 'rgba(212,160,23,0.15)',
  },
  cardList: {
    gap: spacing.sm,
  },
  peaceCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pager: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  pagerItem: {
    width: 280,
  },
  recCard: {
    width: 220,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  recDevanagari: {
    fontStyle: 'italic',
  },
  recCta: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    alignItems: 'center',
  },
});
