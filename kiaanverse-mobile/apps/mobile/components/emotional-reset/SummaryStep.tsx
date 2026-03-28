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
 *   - Simple golden particle celebration using View-based layers
 */

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, GoldenButton, colors, spacing, radii } from '@kiaanverse/ui';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Confetti Particle — simple View-based golden dot
// ---------------------------------------------------------------------------

function ConfettiParticle({ delay, left }: { delay: number; left: number }): React.JSX.Element {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 0 }),
        withTiming(Dimensions.get('window').height * 0.4, {
          duration: 2500 + Math.random() * 1500,
          easing: Easing.out(Easing.quad),
        }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.8, { duration: 400 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1,
      false,
    );
  }, [translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left, top: delay * 30 },
        style,
      ]}
    />
  );
}

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

  // Generate particle positions deterministically
  const particles = Array.from({ length: 12 }, (_, i) => ({
    key: i,
    delay: i * 0.3,
    left: (SCREEN_WIDTH / 13) * (i + 1),
  }));

  return (
    <View style={styles.root}>
      {/* Celebration particles */}
      <View style={styles.particleLayer} pointerEvents="none">
        {particles.map((p) => (
          <ConfettiParticle key={p.key} delay={p.delay} left={p.left} />
        ))}
      </View>

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
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.insightCard}>
          <Text variant="caption" color={colors.primary[400]} style={styles.insightLabel}>
            Key Insight
          </Text>
          <Text variant="body" color={colors.text.secondary} style={styles.insightText}>
            {insight}
          </Text>
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
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divine.aura,
  },
  scrollContent: {
    paddingVertical: spacing.xl,
    gap: spacing.lg,
    zIndex: 2,
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
  insightCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.alpha.goldMedium,
    padding: spacing.lg,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
