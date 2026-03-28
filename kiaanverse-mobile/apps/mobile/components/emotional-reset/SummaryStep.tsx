/**
 * SummaryStep — Session completion screen (Step 6 / final step of Emotional Reset).
 *
 * Shows a celebration view with:
 *   - "Your Sacred Reset is Complete" heading
 *   - Key insight in a highlighted golden card
 *   - Emotion transformation arrow (e.g. "anger -> inner peace")
 *   - Session statistics (duration, breathing cycles)
 *   - Verse recommendation card
 *   - "Save to Journal" and "Return Home" action buttons
 *   - ConfettiCannon celebration from @kiaanverse/ui
 *   - LotusProgress completion badge
 *   - DivineGradient background wrapper
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, GoldenButton, ConfettiCannon, GlowCard, LotusProgress, DivineGradient, colors, spacing, radii } from '@kiaanverse/ui';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { useCompleteEmotionalReset } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SummaryStepProps {
  readonly stepData: {
    insight?: string;
    transformedEmotion?: string;
    verseRecommendation?: {
      ref: string;
      text: string;
    };
  } | null;
}

// ---------------------------------------------------------------------------
// Emotion transformation mapping — maps source emotion to peaceful state
// ---------------------------------------------------------------------------

const EMOTION_TRANSFORMS: Record<string, string> = {
  anger: 'Inner Peace',
  anxiety: 'Deep Calm',
  sadness: 'Gentle Acceptance',
  grief: 'Compassionate Release',
  fear: 'Courageous Trust',
  confusion: 'Clear Insight',
  loneliness: 'Connected Wholeness',
  shame: 'Self-Compassion',
  frustration: 'Patient Wisdom',
  jealousy: 'Abundant Gratitude',
  overwhelm: 'Centered Stillness',
  restlessness: 'Grounded Presence',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SummaryStep({ stepData }: SummaryStepProps): React.JSX.Element {
  const router = useRouter();
  const session = useEmotionalResetStore((s) => s.session);
  const clearSession = useEmotionalResetStore((s) => s.clearSession);
  const completeReset = useCompleteEmotionalReset();

  const emotion = session?.emotion ?? 'anger';
  const transformedEmotion =
    stepData?.transformedEmotion ?? EMOTION_TRANSFORMS[emotion] ?? 'Inner Peace';
  const insight =
    stepData?.insight ?? 'You have shown great courage by facing your emotions with awareness.';

  /** Calculate session duration in minutes. */
  const durationMin = session?.startedAt
    ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
    : 0;

  /** Trigger completion API call and haptic on mount. */
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (session?.id) {
      completeReset.mutate({ sessionId: session.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToJournal = (): void => {
    clearSession();
    router.replace('/journal');
  };

  const handleReturnHome = (): void => {
    clearSession();
    router.replace('/(tabs)');
  };

  const [showCelebration] = useState(true);

  return (
    <DivineGradient variant="divine">
    <View style={styles.root}>
      {/* Sacred confetti celebration */}
      <ConfettiCannon isActive={showCelebration} particleCount={60} duration={3000} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion heading */}
        <Animated.View entering={FadeIn.duration(600)}>
          <Text variant="h1" color={colors.divine.aura} align="center">
            Your Sacred Reset{'\n'}is Complete
          </Text>
        </Animated.View>

        {/* Lotus completion badge */}
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.lotusCenter}>
          <LotusProgress progress={1} size={80} />
        </Animated.View>

        {/* Emotion transformation */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.transformRow}>
          <View style={styles.emotionBadge}>
            <Text variant="label" color={colors.semantic.error}>
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </Text>
          </View>
          <Text variant="h2" color={colors.text.muted}>
            {'\u2192'}
          </Text>
          <View style={[styles.emotionBadge, styles.transformedBadge]}>
            <Text variant="label" color={colors.semantic.success}>
              {transformedEmotion}
            </Text>
          </View>
        </Animated.View>

        {/* Key insight card */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <GlowCard variant="sacred">
            <Text variant="caption" color={colors.primary[400]} style={styles.insightLabel}>
              Key Insight
            </Text>
            <Text variant="body" color={colors.text.secondary} style={styles.insightText}>
              {insight}
            </Text>
          </GlowCard>
        </Animated.View>

        {/* Session stats */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.text.primary} align="center">
              {durationMin}
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Minutes
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.text.primary} align="center">
              6
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Steps
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.text.primary} align="center">
              3
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Breath Cycles
            </Text>
          </View>
        </Animated.View>

        {/* Verse recommendation (if available) */}
        {stepData?.verseRecommendation ? (
          <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.verseCard}>
            <Text variant="caption" color={colors.primary[400]}>
              Recommended Verse
            </Text>
            <Text variant="label" color={colors.text.primary} style={styles.verseRef}>
              {stepData.verseRecommendation.ref}
            </Text>
            <Text variant="bodySmall" color={colors.text.secondary}>
              {stepData.verseRecommendation.text}
            </Text>
          </Animated.View>
        ) : null}

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(900).duration(400)} style={styles.actions}>
          <GoldenButton
            title="Save to Journal"
            onPress={handleSaveToJournal}
            testID="summary-journal-btn"
          />
          <GoldenButton
            title="Return Home"
            onPress={handleReturnHome}
            variant="outline"
            style={styles.homeButton}
            testID="summary-home-btn"
          />
        </Animated.View>
      </ScrollView>
    </View>
    </DivineGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  lotusCenter: {
    alignItems: 'center',
  },
  transformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emotionBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  transformedBadge: {
    borderColor: colors.alpha.goldMedium,
  },
  insightLabel: {
    marginBottom: spacing.xs,
  },
  insightText: {
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: colors.alpha.whiteLight,
  },
  verseCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  verseRef: {
    marginTop: spacing.xxs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  homeButton: {
    marginTop: spacing.xxs,
  },
});
