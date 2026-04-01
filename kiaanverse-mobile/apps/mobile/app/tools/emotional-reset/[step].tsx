/**
 * Dynamic Step Screen -- Full-screen immersive layout with swipe gesture navigation.
 *
 * Renders the appropriate healing component for each step (1-6) of the
 * Emotional Reset flow. Users can swipe left/right to navigate between steps
 * via PanGestureHandler + Reanimated shared values.
 *
 * Step mapping:
 *   1 = Breathing exercise  (calm the nervous system)
 *   2 = Visualization       (guided inner imagery)
 *   3 = Wisdom              (Bhagavad Gita verse + application)
 *   4 = Affirmation         (sequential mantra reveal)
 *   5 = Reflection          (journaling prompt with keyboard handling)
 *   6 = Summary             (session completion + celebration)
 *
 * Layout rules:
 *   - No ScrollView at this level -- each step manages its own overflow
 *   - DivineGradient fills the entire screen (behind safe-area insets)
 *   - Step indicator and label sit at the top, content area is flex: 1
 *   - Summary step (6) is not swipeable -- it has its own completion flow
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Text,
  DivineGradient,
  SacredTransition,
  SacredStepIndicator as SacredStepIndicatorUI,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useEmotionalResetStepData } from '@kiaanverse/api';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { BreathingStep } from '../../../components/emotional-reset/BreathingStep';
import { VisualizationStep } from '../../../components/emotional-reset/VisualizationStep';
import { WisdomStep } from '../../../components/emotional-reset/WisdomStep';
import { AffirmationStep } from '../../../components/emotional-reset/AffirmationStep';
import { ReflectionStep } from '../../../components/emotional-reset/ReflectionStep';
import { SummaryStep } from '../../../components/emotional-reset/SummaryStep';

const TOTAL_STEPS = 6;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

/** Labels displayed below the step indicator for each phase. */
const STEP_LABELS: Record<number, string> = {
  1: 'Breathe',
  2: 'Visualize',
  3: 'Wisdom',
  4: 'Affirm',
  5: 'Reflect',
  6: 'Complete',
};

/**
 * Maps step number to the appropriate DivineGradient variant.
 * Pairs of steps share a gradient to create a cohesive visual arc:
 *   1-2 peace (calming blue), 3-4 healing (warm gold), 5-6 renewal (green/white).
 */
function getGradientVariant(step: number): 'peace' | 'healing' | 'renewal' | 'divine' {
  if (step <= 2) return 'peace';
  if (step <= 4) return 'healing';
  if (step <= 6) return 'renewal';
  return 'divine';
}

// VisualizationStep and ReflectionStep are now standalone components
// imported from ../../../components/emotional-reset/

// ---------------------------------------------------------------------------
// Main Step Screen
// ---------------------------------------------------------------------------

export default function StepScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const currentStep = Math.max(1, Math.min(TOTAL_STEPS, Number(step) || 1));

  const session = useEmotionalResetStore((s) => s.session);
  const sessionId = session?.id ?? '';

  // Fetch step-specific data from API (verses, affirmations, breathing pattern, etc.)
  const { data: stepData } = useEmotionalResetStepData(sessionId, currentStep);

  /** Navigate forward one step, or back to tabs on final step. */
  const navigateNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < TOTAL_STEPS) {
      router.replace(`/tools/emotional-reset/${currentStep + 1}`);
    } else {
      router.replace('/(tabs)');
    }
  }, [currentStep, router]);

  /** Navigate backward one step, or back to entry screen from step 1. */
  const navigateBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      router.back();
    } else {
      router.replace('/tools/emotional-reset');
    }
  }, [currentStep, router]);

  // ---------------------------------------------------------------------------
  // Swipe gesture for navigating between steps
  // ---------------------------------------------------------------------------

  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      // Clamp drag to half screen width to prevent over-swiping
      const maxDrag = SCREEN_WIDTH * 0.5;
      translateX.value = Math.max(-maxDrag, Math.min(maxDrag, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD && currentStep < TOTAL_STEPS) {
        // Swipe left -> advance to next step
        runOnJS(navigateNext)();
      } else if (e.translationX > SWIPE_THRESHOLD && currentStep > 1) {
        // Swipe right -> go back one step
        runOnJS(navigateBack)();
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  /** Animated style: content follows the pan gesture with opacity fade at edges. */
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH * 0.4],
      [1, 0.5],
      Extrapolation.CLAMP,
    ),
  }));

  // ---------------------------------------------------------------------------
  // Step renderer -- each step is a self-contained full-screen component
  // ---------------------------------------------------------------------------

  // Normalize stepData: API hook returns undefined when loading, components expect T | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sd = (stepData ?? null) as any;

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <BreathingStep stepData={sd} onNext={navigateNext} />;
      case 2:
        return <VisualizationStep stepData={sd} onNext={navigateNext} />;
      case 3:
        return <WisdomStep stepData={sd} onNext={navigateNext} />;
      case 4:
        return <AffirmationStep stepData={sd} onNext={navigateNext} />;
      case 5:
        return <ReflectionStep onNext={navigateNext} />;
      case 6:
        return <SummaryStep stepData={sd} />;
      default:
        return null;
    }
  }, [currentStep, sd, navigateNext]);

  // Summary step (step 6) is non-swipeable -- it has its own CTA flow
  const isSummary = currentStep === TOTAL_STEPS;

  return (
    <DivineGradient variant={getGradientVariant(currentStep)} animated style={styles.root}>
      <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
        {/* Step indicator at top */}
        <Animated.View entering={FadeIn.duration(300)}>
          <SacredStepIndicatorUI
            totalSteps={TOTAL_STEPS}
            currentStep={currentStep}
            completedSteps={Array.from({ length: currentStep }, (_, i) => i)}
          />
        </Animated.View>

        {/* Step label below indicator */}
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
          <Text
            variant="caption"
            color={colors.text.muted}
            align="center"
            style={styles.stepLabel}
          >
            {STEP_LABELS[currentStep]}
          </Text>
        </Animated.View>

        {/* Back button - top left, subtle, only on steps 2-5 */}
        {currentStep > 1 && !isSummary ? (
          <Pressable
            onPress={navigateBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text variant="bodySmall" color={c.textSecondary}>
              {'<'} Back
            </Text>
          </Pressable>
        ) : null}

        {/* Swipeable content area -- wraps the active step component */}
        {isSummary ? (
          /* Summary is not swipeable -- it manages its own CTA and safe area */
          <View style={styles.contentArea}>
            <SacredTransition isVisible key={currentStep}>
              {renderStep}
            </SacredTransition>
          </View>
        ) : (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.contentArea, animatedContentStyle]}>
              <SacredTransition isVisible key={currentStep}>
                {renderStep}
              </SacredTransition>
            </Animated.View>
          </GestureDetector>
        )}
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
  screen: {
    flex: 1,
  },
  stepLabel: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
