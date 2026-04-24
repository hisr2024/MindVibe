/**
 * AffirmationStep — Sequential affirmation reveal (Step 4 of Emotional Reset).
 *
 * Displays 3-5 personalized affirmations one at a time. The user taps
 * anywhere on screen to reveal the next affirmation with a fade-in
 * animation. Uses golden serif-styled typography on a dark background
 * with subtle golden ambient layers in the background.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, GlowCard, colors, spacing } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AffirmationStepProps {
  readonly stepData: {
    affirmations?: string[];
  } | null;
  readonly onNext: () => void;
}

// ---------------------------------------------------------------------------
// Fallback affirmations used when API data is unavailable
// ---------------------------------------------------------------------------

const FALLBACK_AFFIRMATIONS: readonly string[] = [
  'I am the witness of my emotions, not their prisoner.',
  'This feeling is temporary. My inner peace is eternal.',
  'I choose to respond with wisdom, not react with impulse.',
  'I release what no longer serves my highest self.',
  'I am grounded in the stillness beneath the storm.',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AffirmationStep({
  stepData,
  onNext,
}: AffirmationStepProps): React.JSX.Element {
  const affirmations = stepData?.affirmations?.length
    ? stepData.affirmations
    : [...FALLBACK_AFFIRMATIONS];

  const total = affirmations.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const allRevealed = currentIndex >= total - 1;

  const revealNext = useCallback(() => {
    if (currentIndex < total - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, total]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)}>
        <Text variant="h2" color={colors.divine.aura} align="center">
          Sacred Affirmations
        </Text>
        <Text
          variant="caption"
          color={colors.text.muted}
          align="center"
          style={styles.counter}
        >
          {currentIndex + 1} of {total}
        </Text>
      </Animated.View>

      {/* Tap area — reveals next affirmation */}
      <Pressable
        onPress={revealNext}
        style={styles.tapArea}
        accessibilityRole="button"
        accessibilityLabel={
          allRevealed
            ? 'All affirmations revealed'
            : 'Tap to reveal next affirmation'
        }
        disabled={allRevealed}
      >
        <Animated.View
          key={`affirmation-${currentIndex}`}
          entering={FadeInUp.duration(700)}
          style={styles.affirmationWrap}
        >
          <GlowCard variant="golden">
            <Text
              variant="h2"
              color={colors.primary[300]}
              align="center"
              style={styles.affirmationText}
            >
              "{affirmations[currentIndex]}"
            </Text>
          </GlowCard>
        </Animated.View>

        {!allRevealed ? (
          <Text
            variant="caption"
            color={colors.text.muted}
            align="center"
            style={styles.tapHint}
          >
            Tap to reveal next
          </Text>
        ) : null}
      </Pressable>

      {/* Continue button — appears after all are revealed */}
      {allRevealed ? (
        <Animated.View entering={FadeIn.delay(300).duration(400)}>
          <GoldenButton
            title="Continue"
            onPress={onNext}
            style={styles.continueButton}
            testID="affirmation-continue-btn"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  counter: {
    marginTop: spacing.xs,
  },
  tapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  affirmationWrap: {
    paddingHorizontal: spacing.md,
  },
  affirmationText: {
    lineHeight: 36,
    fontWeight: '600',
  },
  tapHint: {
    marginTop: spacing.xl,
  },
  continueButton: {
    marginBottom: spacing.lg,
  },
});
