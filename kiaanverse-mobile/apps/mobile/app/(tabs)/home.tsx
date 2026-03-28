/**
 * Home Tab — Enhanced Sacred Dashboard
 *
 * Daily greeting, verse of the day, mood check-in, sacred action chips,
 * active journey progress, Sakha presence, and daily divine insight.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Divider, GoldenButton, GoldenProgressBar, colors, spacing } from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import { useJourneyDashboard, useCreateMood, useSadhanaStreak } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

const MOOD_OPTIONS = [
  { score: -2, emoji: '😔', label: 'Very Low', color: '#6C3483' },
  { score: -1, emoji: '😕', label: 'Low', color: '#2980B9' },
  { score: 0, emoji: '😐', label: 'Neutral', color: '#7A7060' },
  { score: 1, emoji: '🙂', label: 'Good', color: '#3D8B5E' },
  { score: 2, emoji: '😊', label: 'Great', color: '#D4A017' },
] as const;

const SACRED_ACTIONS = [
  { id: 'emotional-reset', emoji: '🌊', label: 'Emotional Reset', route: '/tools/emotional-reset' },
  { id: 'karma-reset', emoji: '♻️', label: 'Karma Reset', route: '/tools/karma-reset' },
  { id: 'sadhana', emoji: '🕉️', label: 'Sadhana', route: '/sadhana' },
  { id: 'journal', emoji: '📿', label: 'Journal', route: '/journal' },
  { id: 'vibe', emoji: '🎵', label: 'Vibe Player', route: '/vibe-player' },
  { id: 'tools', emoji: '🔱', label: 'All Tools', route: '/tools' },
] as const;

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation('home');
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: dashboard, refetch, isRefetching } = useJourneyDashboard();
  const { data: streak } = useSadhanaStreak();
  const createMood = useCreateMood();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleMoodSelect = useCallback((score: number) => {
    setSelectedMood(score);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    createMood.mutate({ score });
  }, [createMood]);

  const handleActionPress = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as `/tools/emotional-reset`);
  }, [router]);

  const greeting = useMemo(() => getGreeting(), []);
  const currentStreak = (streak as { current_streak?: number } | undefined)?.current_streak ?? 0;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary[500]} />}
      >
        {/* Greeting Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.greetingSection}>
          <Text variant="h2">
            {greeting}, {user?.name?.split(' ')[0] ?? t('greeting')}
          </Text>
          <Text variant="bodySmall" color={colors.text.muted}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text variant="caption" color={colors.primary[300]}>
                🔥 {currentStreak} Day Streak
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Sacred Action Chips */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
            {SACRED_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleActionPress(action.route)}
                style={styles.actionChip}
                accessibilityLabel={action.label}
                accessibilityRole="button"
              >
                <Text variant="h3" align="center">{action.emoji}</Text>
                <Text variant="caption" color={colors.text.secondary} align="center" numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Divider />

        {/* Mood Check-In */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Card style={styles.moodCard}>
            <Text variant="label">{t('moodCheckIn')}</Text>
            <Text variant="caption" color={colors.text.muted}>How does your spirit feel right now?</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.score}
                  onPress={() => handleMoodSelect(option.score)}
                  style={[
                    styles.moodOption,
                    selectedMood === option.score && [styles.moodSelected, { borderColor: option.color }],
                  ]}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                >
                  <Text variant="h2" align="center">{option.emoji}</Text>
                  <Text variant="caption" color={colors.text.muted} align="center">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {createMood.data ? (
              <Text variant="bodySmall" color={colors.primary[300]} style={styles.moodResponse}>
                {(createMood.data as { kiaanResponse?: string }).kiaanResponse ?? '🙏 Mood recorded. Sakha sees you.'}
              </Text>
            ) : null}
          </Card>
        </Animated.View>

        {/* Active Journeys */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text variant="h3">{t('activeJourney')}</Text>
          {dashboard?.activeJourneys && dashboard.activeJourneys.length > 0 ? (
            dashboard.activeJourneys.map((journey) => {
              const progress = Math.round((journey.completedSteps / journey.durationDays) * 100);
              return (
                <Pressable
                  key={journey.id}
                  onPress={() => router.push(`/(tabs)/journey/${journey.id}`)}
                >
                  <Card style={styles.journeyCard}>
                    <View style={styles.journeyHeader}>
                      <Text variant="label">{journey.title}</Text>
                      <Text variant="caption" color={colors.primary[300]}>{progress}%</Text>
                    </View>
                    <Text variant="caption" color={colors.text.muted}>
                      Day {journey.currentDay} of {journey.durationDays}
                    </Text>
                    <GoldenProgressBar progress={progress / 100} height={6} />
                  </Card>
                </Pressable>
              );
            })
          ) : (
            <Card>
              <Text variant="body" color={colors.text.muted}>
                {t('noJourneys')}
              </Text>
              <GoldenButton
                title="Start a Journey"
                onPress={() => router.push('/(tabs)/journey')}
                variant="outline"
                style={styles.startJourneyBtn}
              />
            </Card>
          )}
        </Animated.View>

        {/* Stats Row */}
        {dashboard ? (
          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text variant="h2" align="center" color={colors.primary[300]}>
                {dashboard.streakDays}
              </Text>
              <Text variant="caption" color={colors.text.muted} align="center">
                Day Streak
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="h2" align="center" color={colors.primary[300]}>
                {dashboard.completedCount}
              </Text>
              <Text variant="caption" color={colors.text.muted} align="center">
                Journeys Done
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="h2" align="center" color={colors.divine.aura}>
                {currentStreak}
              </Text>
              <Text variant="caption" color={colors.text.muted} align="center">
                Sadhana Streak
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        {/* Quick Links */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <Text variant="h3">Explore</Text>
          <View style={styles.exploreRow}>
            <Pressable style={styles.exploreCard} onPress={() => router.push('/community')}>
              <Text variant="h3" align="center">🕉️</Text>
              <Text variant="caption" color={colors.text.secondary} align="center">Community</Text>
            </Pressable>
            <Pressable style={styles.exploreCard} onPress={() => router.push('/analytics')}>
              <Text variant="h3" align="center">📊</Text>
              <Text variant="caption" color={colors.text.secondary} align="center">Insights</Text>
            </Pressable>
            <Pressable style={styles.exploreCard} onPress={() => router.push('/wisdom-rooms')}>
              <Text variant="h3" align="center">💬</Text>
              <Text variant="caption" color={colors.text.secondary} align="center">Wisdom Rooms</Text>
            </Pressable>
            <Pressable style={styles.exploreCard} onPress={() => router.push('/karma-footprint')}>
              <Text variant="h3" align="center">👣</Text>
              <Text variant="caption" color={colors.text.secondary} align="center">Karma</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Om Shanti';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Om Shanti';
}

const styles = StyleSheet.create({
  greetingSection: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  streakBadge: {
    backgroundColor: colors.alpha.goldLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  actionsRow: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  moodCard: {
    gap: spacing.sm,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodSelected: {
    backgroundColor: colors.alpha.goldLight,
  },
  moodResponse: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  journeyCard: {
    gap: spacing.xs,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startJourneyBtn: {
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  exploreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exploreCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  bottomSpacer: {
    height: 100,
  },
});
