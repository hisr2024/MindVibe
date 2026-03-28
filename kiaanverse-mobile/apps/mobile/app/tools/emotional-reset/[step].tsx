/**
 * Dynamic Step Screen — Renders the appropriate healing component
 * for each step (1-6) of the Emotional Reset flow.
 *
 * Step mapping:
 *   1 = Breathing exercise (calm the nervous system)
 *   2 = Visualization (guided inner imagery)
 *   3 = Wisdom (Bhagavad Gita verse + application)
 *   4 = Affirmation (sequential mantra reveal)
 *   5 = Reflection (journaling prompt)
 *   6 = Summary (session completion + next steps)
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Screen,
  Text,
  GoldenButton,
  DivineGradient,
  SacredTransition,
  SacredStepIndicator as SacredStepIndicatorUI,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useEmotionalResetStep } from '@kiaanverse/api';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { BreathingStep } from '../../../components/emotional-reset/BreathingStep';
import { WisdomStep } from '../../../components/emotional-reset/WisdomStep';
import { AffirmationStep } from '../../../components/emotional-reset/AffirmationStep';
import { SummaryStep } from '../../../components/emotional-reset/SummaryStep';

const TOTAL_STEPS = 6;

/** Labels displayed in the step indicator for each phase. */
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
 * Steps 1-2: peace, Steps 3-4: healing, Steps 5-6: renewal.
 */
function getGradientVariant(step: number): 'peace' | 'healing' | 'renewal' | 'divine' {
  if (step <= 2) return 'peace';
  if (step <= 4) return 'healing';
  if (step <= 6) return 'renewal';
  return 'divine';
}

// ---------------------------------------------------------------------------
// Reflection Step — simple journaling prompt (step 5)
// ---------------------------------------------------------------------------

function ReflectionStep({
  onNext,
}: {
  onNext: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const [text, setText] = React.useState('');
  const session = useEmotionalResetStore((s) => s.session);

  return (
    <View style={styles.stepContainer}>
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
      <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.reflectionInputWrap}>
        <View
          style={[
            styles.reflectionInput,
            { backgroundColor: colors.background.card, borderColor: c.cardBorder },
          ]}
        >
          {/* Using a basic RN TextInput imported from react-native */}
          {React.createElement(
            require('react-native').TextInput,
            {
              style: [styles.textInput, { color: c.textPrimary }],
              placeholder: 'Write your thoughts here...',
              placeholderTextColor: c.textTertiary,
              multiline: true,
              value: text,
              onChangeText: setText,
              maxLength: 1000,
              accessibilityLabel: 'Reflection journal entry',
            },
          )}
        </View>
      </Animated.View>
      <GoldenButton
        title="Continue"
        onPress={onNext}
        style={styles.nextButton}
        testID="reflection-next-btn"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Visualization Step — guided inner imagery (step 2)
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

  return (
    <View style={styles.stepContainer}>
      <Text variant="h2" color={colors.divine.aura} align="center">
        {stepData?.title ?? 'Sacred Visualization'}
      </Text>
      <Text
        variant="body"
        color={c.textSecondary}
        align="center"
        style={styles.visDescription}
      >
        {stepData?.description ??
          'Close your eyes. Imagine a golden light surrounding you, dissolving all tension.'}
      </Text>
      {stepData?.guidance ? (
        <Animated.View entering={FadeIn.delay(600).duration(500)}>
          <View
            style={[
              styles.guidanceCard,
              { backgroundColor: colors.alpha.goldLight, borderColor: colors.alpha.goldMedium },
            ]}
          >
            <Text variant="bodySmall" color={colors.primary[300]}>
              {stepData.guidance}
            </Text>
          </View>
        </Animated.View>
      ) : null}
      <GoldenButton
        title="Continue"
        onPress={onNext}
        style={styles.nextButton}
        testID="visualization-next-btn"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Step Screen
// ---------------------------------------------------------------------------

export default function StepScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const currentStep = Math.max(1, Math.min(TOTAL_STEPS, Number(step) || 1));

  const session = useEmotionalResetStore((s) => s.session);
  const sessionId = session?.id ?? '';

  // Fetch step-specific data from API (verses, affirmations, breathing pattern, etc.)
  const { data: stepData } = useEmotionalResetStep(sessionId, currentStep);

  const navigateNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      router.push(`/tools/emotional-reset/${currentStep + 1}`);
    } else {
      // Final step — return to tools
      router.replace('/(tabs)');
    }
  }, [currentStep, router]);

  const navigateBack = useCallback(() => {
    if (currentStep > 1) {
      router.back();
    } else {
      router.replace('/tools/emotional-reset');
    }
  }, [currentStep, router]);

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

  return (
    <Screen>
      <DivineGradient variant={getGradientVariant(currentStep)} animated>
        {/* Progress indicator */}
        <Animated.View entering={FadeIn.duration(300)}>
          <SacredStepIndicatorUI totalSteps={TOTAL_STEPS} currentStep={currentStep} completedSteps={Array.from({ length: currentStep }, (_, i) => i)} />
        </Animated.View>

        {/* Back button (except on summary) */}
        {currentStep < TOTAL_STEPS ? (
          <Pressable
            onPress={navigateBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text variant="bodySmall" color={c.textSecondary}>
              ← Back
            </Text>
          </Pressable>
        ) : null}

        {/* Step content */}
        <SacredTransition isVisible={true}>
          <View style={styles.content}>{renderStep}</View>
        </SacredTransition>
      </DivineGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  nextButton: {
    marginTop: spacing.xl,
  },

  // Reflection step
  reflectionPrompt: {
    marginTop: spacing.sm,
  },
  reflectionInputWrap: {
    marginTop: spacing.md,
  },
  reflectionInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 160,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 140,
  },

  // Visualization step
  visDescription: {
    marginTop: spacing.md,
    lineHeight: 24,
  },
  guidanceCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
