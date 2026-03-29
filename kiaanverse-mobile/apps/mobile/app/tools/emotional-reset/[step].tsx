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

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
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
  GoldenButton,
  DivineGradient,
  SacredTransition,
  SacredStepIndicator as SacredStepIndicatorUI,
  GlowCard,
  MandalaSpin,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useEmotionalResetStepData } from '@kiaanverse/api';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { BreathingStep } from '../../../components/emotional-reset/BreathingStep';
import { WisdomStep } from '../../../components/emotional-reset/WisdomStep';
import { AffirmationStep } from '../../../components/emotional-reset/AffirmationStep';
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

// ---------------------------------------------------------------------------
// Reflection Step -- journaling prompt with KeyboardAvoidingView (step 5)
// ---------------------------------------------------------------------------

function ReflectionStep({
  onNext,
}: {
  onNext: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const charMilestoneRef = useRef(0);

  /**
   * Haptic feedback every 50 characters typed.
   * Creates a subtle rhythmic sensation that encourages continued writing.
   */
  const handleChangeText = useCallback((value: string) => {
    setText(value);
    const currentMilestone = Math.floor(value.length / 50);
    if (currentMilestone > charMilestoneRef.current) {
      charMilestoneRef.current = currentMilestone;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.reflectionRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.reflectionContent}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="h2" color={colors.divine.aura} align="center">
            Reflect Within
          </Text>
          <Text
            variant="body"
            color={c.textSecondary}
            align="center"
            style={styles.reflectionPrompt}
          >
            What has this emotion been trying to teach you?
          </Text>
        </Animated.View>

        {/* TextInput fills all available vertical space between prompt and button */}
        <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.reflectionInputFlex}>
          <TextInput
            style={[
              styles.reflectionInput,
              {
                color: c.textPrimary,
                backgroundColor: colors.background.card,
                borderColor: c.cardBorder,
              },
            ]}
            placeholder="Write your thoughts here..."
            placeholderTextColor={c.textTertiary}
            multiline
            value={text}
            onChangeText={handleChangeText}
            maxLength={1000}
            accessibilityLabel="Reflection journal entry"
            textAlignVertical="top"
          />
        </Animated.View>
      </View>

      {/* Continue button anchored at bottom, pushed above keyboard by KAV */}
      <View style={{ paddingBottom: insets.bottom + 16 }}>
        <GoldenButton
          title="Continue"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          testID="reflection-next-btn"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Visualization Step -- full-screen immersive guided imagery (step 2)
// ---------------------------------------------------------------------------

function VisualizationStep({
  stepData,
  onNext,
}: {
  stepData: { title?: string; description?: string; guidance?: string } | null;
  onNext: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [autoTimer, setAutoTimer] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Auto-advance timer: counts down from 10s and navigates forward
   * when it reaches zero. Users can also tap "Continue" to skip ahead.
   */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAutoTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onNext]);

  return (
    <View style={styles.visRoot}>
      {/* MandalaSpin as a large decorative background element */}
      <View style={styles.visMandalaBg}>
        <MandalaSpin
          size={SCREEN_WIDTH * 0.9}
          speed="slow"
          color={colors.alpha.goldLight}
          opacity={0.1}
        />
      </View>

      {/* Guidance text centered vertically -- no card wrapping, just text on gradient */}
      <View style={styles.visCenterContent}>
        <Animated.View entering={FadeIn.duration(800)}>
          <Text variant="h2" color={colors.divine.aura} align="center">
            {stepData?.title ?? 'Sacred Visualization'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400).duration(800)}>
          <Text
            variant="body"
            color={c.textSecondary}
            align="center"
            style={styles.visGuidance}
          >
            {stepData?.description ??
              'Close your eyes. Imagine a golden light surrounding you, dissolving all tension.'}
          </Text>
        </Animated.View>

        {stepData?.guidance ? (
          <Animated.View entering={FadeIn.delay(800).duration(600)}>
            <Text
              variant="bodySmall"
              color={colors.primary[300]}
              align="center"
              style={styles.visGuidance}
            >
              {stepData.guidance}
            </Text>
          </Animated.View>
        ) : null}

        {/* Countdown timer display */}
        <Animated.View entering={FadeIn.delay(600).duration(400)}>
          <Text
            variant="caption"
            color={colors.text.muted}
            align="center"
            style={styles.visTimer}
          >
            {autoTimer > 0 ? `${autoTimer}s` : ''}
          </Text>
        </Animated.View>
      </View>

      {/* Continue button at bottom with safe area padding */}
      <View style={{ paddingBottom: insets.bottom + 16 }}>
        <GoldenButton
          title="Continue"
          onPress={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          testID="visualization-next-btn"
        />
      </View>
    </View>
  );
}

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
      router.push(`/tools/emotional-reset/${currentStep + 1}`);
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

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <BreathingStep stepData={stepData} onNext={navigateNext} />;
      case 2:
        return <VisualizationStep stepData={stepData} onNext={navigateNext} />;
      case 3:
        return <WisdomStep stepData={stepData} onNext={navigateNext} />;
      case 4:
        return <AffirmationStep stepData={stepData} onNext={navigateNext} />;
      case 5:
        return <ReflectionStep onNext={navigateNext} />;
      case 6:
        return <SummaryStep stepData={stepData} />;
      default:
        return null;
    }
  }, [currentStep, stepData, navigateNext]);

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

  // Reflection step styles
  reflectionRoot: {
    flex: 1,
  },
  reflectionContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
  },
  reflectionPrompt: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  reflectionInputFlex: {
    flex: 1,
    marginBottom: spacing.md,
  },
  reflectionInput: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
  },

  // Visualization step styles
  visRoot: {
    flex: 1,
  },
  visMandalaBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  visCenterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  visGuidance: {
    marginTop: spacing.lg,
    lineHeight: 26,
  },
  visTimer: {
    marginTop: spacing.xl,
  },
});
