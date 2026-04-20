/**
 * Daily Sadhana Screen — The main sacred practice flow.
 *
 * Guides the user through a multi-phase spiritual practice: greeting,
 * mood check, verse contemplation, reflection, intention, and completion.
 * Tracks streak and awards karma points upon finishing.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Screen,
  Text,
  GoldenButton,
  GoldenHeader,
  GoldenProgressBar,
  colors,
  spacing,
} from '@kiaanverse/ui';
import {
  useSadhanaDaily,
  useSadhanaStreak,
  useCompleteSadhana,
  useProfile,
} from '@kiaanverse/api';
import { SadhanaPhaseFlow } from '../../components/sadhana/SadhanaPhaseFlow';
import { StreakFlame } from '../../components/sadhana/StreakFlame';

export type SadhanaPhase =
  | 'greeting'
  | 'mood_check'
  | 'verse_contemplation'
  | 'reflection'
  | 'intention'
  | 'complete';

const PHASE_ORDER: SadhanaPhase[] = [
  'greeting',
  'mood_check',
  'verse_contemplation',
  'reflection',
  'intention',
  'complete',
];

const MOOD_OPTIONS = [
  { emoji: '😔', label: 'Heavy', score: 1 },
  { emoji: '😕', label: 'Unsettled', score: 2 },
  { emoji: '😐', label: 'Neutral', score: 3 },
  { emoji: '🙂', label: 'Peaceful', score: 4 },
  { emoji: '😊', label: 'Blissful', score: 5 },
] as const;

export default function SadhanaScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: dailyData } = useSadhanaDaily();
  const { data: streakData } = useSadhanaStreak();
  const completeSadhana = useCompleteSadhana();

  const [phase, setPhase] = useState<SadhanaPhase>('greeting');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [intention, setIntention] = useState('');

  const streak = streakData?.current ?? 0;
  const userName = profile?.name ?? 'Seeker';

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const phaseIndex = useMemo(
    () => PHASE_ORDER.indexOf(phase),
    [phase],
  );

  const progress = useMemo(
    () => (phaseIndex + 1) / PHASE_ORDER.length,
    [phaseIndex],
  );

  const handleNextPhase = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextIndex = phaseIndex + 1;
    const nextPhase = PHASE_ORDER[nextIndex];
    if (nextPhase !== undefined) {
      setPhase(nextPhase);
    }
  }, [phaseIndex]);

  const handleMoodSelect = useCallback(
    (score: number) => {
      void Haptics.selectionAsync();
      setSelectedMood(score);
    },
    [],
  );

  const handleComplete = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const payload: {
        verse_id?: string;
        reflection?: string;
        intention?: string;
        mood_score?: number;
      } = {};
      if (dailyData?.verse_id !== undefined) payload.verse_id = dailyData.verse_id;
      const reflectionTrimmed = reflection.trim();
      if (reflectionTrimmed) payload.reflection = reflectionTrimmed;
      const intentionTrimmed = intention.trim();
      if (intentionTrimmed) payload.intention = intentionTrimmed;
      if (selectedMood !== null) payload.mood_score = selectedMood;
      await completeSadhana.mutateAsync(payload);
    } catch {
      // Allow completion even if server call fails — data will sync later
    }

    setPhase('complete');
  }, [completeSadhana, dailyData, reflection, intention, selectedMood]);

  const handleReturn = useCallback(() => {
    router.back();
  }, [router]);

  const handleViewHistory = useCallback(() => {
    router.push('/sadhana/history');
  }, [router]);

  // If sadhana already completed today, show completion state
  const alreadyCompleted = dailyData?.completed === true;

  const streakDisplay = (
    <View style={styles.streakRow}>
      <StreakFlame streak={streak} size={32} />
      <Text variant="caption" color={colors.text.secondary}>
        {todayFormatted}
      </Text>
    </View>
  );

  const rightAction = (
    <Text
      variant="caption"
      color={colors.primary[500]}
      onPress={handleViewHistory}
    >
      History
    </Text>
  );

  return (
    <Screen>
      <GoldenHeader
        title="Daily Sadhana"
        onBack={() => router.back()}
        rightAction={rightAction}
      />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <GoldenProgressBar progress={progress} />
      </View>

      {streakDisplay}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {alreadyCompleted && phase !== 'complete' ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.completedBanner}>
            <Text variant="h2" align="center">{'✅'}</Text>
            <Text variant="body" color={colors.text.primary} align="center">
              Your Sadhana for today is already complete.
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Come back tomorrow for your next practice.
            </Text>
            <GoldenButton
              title="View History"
              onPress={handleViewHistory}
              variant="divine"
            />
          </Animated.View>
        ) : (
          <SadhanaPhaseFlow
            phase={phase}
            userName={userName}
            moodOptions={MOOD_OPTIONS}
            selectedMood={selectedMood}
            onMoodSelect={handleMoodSelect}
            verseData={dailyData}
            reflection={reflection}
            onReflectionChange={setReflection}
            intention={intention}
            onIntentionChange={setIntention}
            onNextPhase={handleNextPhase}
            onComplete={handleComplete}
            onReturn={handleReturn}
            isCompleting={completeSadhana.isPending}
            streak={streak}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.lg,
  },
  completedBanner: {
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
