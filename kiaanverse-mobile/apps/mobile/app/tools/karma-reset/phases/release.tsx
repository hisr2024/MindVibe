/**
 * Phase 3: Release — Sacred breathing ritual to let go of the karmic pattern.
 *
 * Guides the user through 3 cycles of 4-4-4-4 box breathing with a visual
 * circle that expands/contracts. The circle transforms from dark purple to
 * radiant gold as cycles progress. The "Continue to Renewal" button appears
 * only after all cycles are complete.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  GoldenButton,
  Divider,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';
import {
  ReleaseVisualization,
  BreathPhase,
} from '../../../../components/karma-reset/ReleaseVisualization';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duration of each breathing segment in milliseconds */
const BREATH_DURATION_MS = 4000;
const TOTAL_CYCLES = 3;

const PHASE_ORDER: readonly BreathPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ReleasePhase(): React.JSX.Element {
  const router = useRouter();
  const { patternId, description, reflection } = useLocalSearchParams<{
    patternId: string;
    description?: string;
    reflection?: string;
  }>();

  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const phaseIndexRef = useRef(0);
  const cycleRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance through breathing phases
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    timerRef.current = setInterval(() => {
      phaseIndexRef.current += 1;

      // Check if a full cycle completed
      if (phaseIndexRef.current >= PHASE_ORDER.length) {
        phaseIndexRef.current = 0;
        cycleRef.current += 1;
        setCycleCount(cycleRef.current);

        // Haptic at end of each cycle
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (cycleRef.current >= TOTAL_CYCLES) {
          setIsComplete(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      }

      setBreathPhase(PHASE_ORDER[phaseIndexRef.current]);
    }, BREATH_DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isComplete]);

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasStarted(true);
    setBreathPhase('inhale');
  }, []);

  const handleContinue = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/tools/karma-reset/phases/renewal',
      params: { patternId, description, reflection },
    });
  }, [patternId, description, reflection, router]);

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Phase tracker */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <KarmaPhaseTracker currentPhase={3} completedPhases={[1, 2]} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
          <Text variant="h2" align="center">
            🔥 Phase 3: Release
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Step 3 of 4
          </Text>
        </Animated.View>

        <Divider />

        {/* Guided intro text */}
        {!hasStarted ? (
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
            <Text variant="body" color={colors.text.secondary} align="center">
              Close your eyes and visualize the pattern as a dark cloud surrounding
              you. With each breath, you will gather its weight and release it to
              the light.
            </Text>
            <Text
              variant="bodySmall"
              color={colors.text.muted}
              align="center"
              style={styles.instructionHint}
            >
              You will complete 3 cycles of box breathing (4-4-4-4).
            </Text>
            <GoldenButton
              title="Begin Breathing Ritual"
              onPress={handleStart}
              testID="release-start"
            />
          </Animated.View>
        ) : null}

        {/* Visualization */}
        {hasStarted ? (
          <Animated.View entering={FadeIn.duration(800)}>
            <ReleaseVisualization
              phase={breathPhase}
              cycleCount={cycleCount}
              totalCycles={TOTAL_CYCLES}
              isComplete={isComplete}
            />
          </Animated.View>
        ) : null}

        {/* Completion message and continue */}
        {isComplete ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.actions}>
            <GoldenButton
              title="Continue to Renewal"
              onPress={handleContinue}
              testID="release-continue"
            />
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  instructionHint: {
    fontStyle: 'italic',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
