/**
 * Home Tab
 *
 * Daily greeting, verse of the day, mood check-in, active journey progress.
 * Features cosmic gradient background with breathing golden aura.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Screen, Text, GlowCard, SacredDivider, GoldenProgressBar, colors, spacing } from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import { useJourneyDashboard, useCreateMood } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

const MOOD_OPTIONS = [
  { score: -2, emoji: '😔', label: 'Very Low' },
  { score: -1, emoji: '😕', label: 'Low' },
  { score: 0, emoji: '😐', label: 'Neutral' },
  { score: 1, emoji: '🙂', label: 'Good' },
  { score: 2, emoji: '😊', label: 'Great' },
] as const;

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation('home');
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuthStore();
  const { data: dashboard } = useJourneyDashboard();
  const createMood = useCreateMood();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleMoodSelect = useCallback((score: number) => {
    setSelectedMood(score);
    createMood.mutate({ score });
  }, [createMood]);

  const greeting = getGreeting();

  return (
    <Screen scroll gradient>
      <View style={styles.greetingSection}>
        <Text variant="h2">
          {greeting}, {user?.name?.split(' ')[0] ?? t('greeting')}
        </Text>
        <Text variant="bodySmall" color={c.textTertiary}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <GlowCard variant="golden" style={styles.moodCard}>
        <Text variant="label">{t('moodCheckIn')}</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((option) => (
            <Pressable
              key={option.score}
              onPress={() => handleMoodSelect(option.score)}
              style={[
                styles.moodOption,
                selectedMood === option.score && styles.moodSelected,
              ]}
              accessibilityLabel={option.label}
              accessibilityRole="button"
            >
              <Text variant="h2" align="center">{option.emoji}</Text>
              <Text variant="caption" color={c.textTertiary} align="center">
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {createMood.data ? (
          <Text variant="bodySmall" color={colors.primary[300]} style={styles.moodResponse}>
            {(createMood.data as { kiaanResponse?: string }).kiaanResponse ?? 'Mood recorded'}
          </Text>
        ) : null}
      </GlowCard>

      <SacredDivider />

      <View style={styles.section}>
        <Text variant="h3">{t('activeJourney')}</Text>
        {dashboard?.activeJourneys && dashboard.activeJourneys.length > 0 ? (
          dashboard.activeJourneys.map((journey) => (
            <GlowCard key={journey.id} style={styles.journeyCard}>
              <Text variant="label">{journey.title}</Text>
              <Text variant="caption" color={c.textTertiary}>
                Day {journey.currentDay} of {journey.durationDays}
              </Text>
              <GoldenProgressBar
                progress={Math.round((journey.completedSteps / journey.durationDays) * 100)}
                height={5}
                style={styles.progressBar}
              />
            </GlowCard>
          ))
        ) : (
          <GlowCard>
            <Text variant="body" color={c.textTertiary}>
              {t('noJourneys')}
            </Text>
          </GlowCard>
        )}
      </View>

      {dashboard ? (
        <View style={styles.statsRow}>
          <GlowCard variant="golden" style={styles.statCard}>
            <Text variant="h2" align="center" color={colors.primary[300]}>
              {dashboard.streakDays}
            </Text>
            <Text variant="caption" color={c.textTertiary} align="center">
              Day Streak
            </Text>
          </GlowCard>
          <GlowCard variant="golden" style={styles.statCard}>
            <Text variant="h2" align="center" color={colors.primary[300]}>
              {dashboard.completedCount}
            </Text>
            <Text variant="caption" color={c.textTertiary} align="center">
              Completed
            </Text>
          </GlowCard>
        </View>
      ) : null}
    </Screen>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  greetingSection: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  moodCard: {
    gap: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    minWidth: 56,
  },
  moodSelected: {
    backgroundColor: colors.alpha.goldLight,
  },
  moodResponse: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  journeyCard: {
    gap: spacing.xs,
  },
  progressBar: {
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
