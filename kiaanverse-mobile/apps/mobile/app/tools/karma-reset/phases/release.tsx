/**
 * Phase 3: Release — Sacred breathing ritual to let go of the karmic pattern.
 *
 * Full-screen immersive mobile UX with:
 *   - DivineGradient (release variant) for deep purple-to-gold atmosphere
 *   - ReleaseVisualization with BreathingOrb and particle system
 *   - 3 cycles of 4-4-4-4 box breathing with phase-specific haptics
 *   - MandalaSpin backdrop that intensifies as ritual progresses
 *   - Sacred intro text before breathing begins
 *   - Completion celebration with confetti and lotus bloom
 *   - Bottom-anchored CTA with safe-area awareness
 *
 * NO ScrollView on main ritual view — single viewport for immersive focus.
 * Uses established sacred cosmic dark theme tokens exclusively.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineGradient,
  MandalaSpin,
  SacredDivider,
  ConfettiCannon,
  LotusProgress,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useKarmaResetStore } from '@kiaanverse/store';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';
import {
  ReleaseVisualization,
  BreathPhase,
} from '../../../../components/karma-reset/ReleaseVisualization';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Duration of each breathing segment in milliseconds */
const BREATH_DURATION_MS = 4000;
const TOTAL_CYCLES = 3;

const PHASE_ORDER: readonly BreathPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In...',
  holdIn: 'Hold...',
  exhale: 'Release...',
  holdOut: 'Rest...',
};

/**
 * Phase-specific haptic feedback for somatic grounding.
 * The escalating intensity mirrors the breathing effort.
 */
const PHASE_HAPTICS: Record<BreathPhase, Haptics.ImpactFeedbackStyle> = {
  inhale: Haptics.ImpactFeedbackStyle.Light,
  holdIn: Haptics.ImpactFeedbackStyle.Medium,
  exhale: Haptics.ImpactFeedbackStyle.Heavy,
  holdOut: Haptics.ImpactFeedbackStyle.Light,
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ReleasePhase(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patternId, description, reflection } = useLocalSearchParams<{
    patternId: string;
    description?: string;
    reflection?: string;
  }>();

  const markBreathingComplete = useKarmaResetStore((s) => s.markBreathingComplete);

  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const phaseIndexRef = useRef(0);
  const cycleRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mandala opacity increases as ritual progresses
  const mandalaOpacity = useSharedValue(0.04);
  // Progress for the lotus bloom
  const ritualProgress = useSharedValue(0);

  const mandalaStyle = useAnimatedStyle(() => ({
    opacity: mandalaOpacity.value,
  }));

  // Advance through breathing phases
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    // Fire phase haptic at start
    Haptics.impactAsync(PHASE_HAPTICS[breathPhase]);

    timerRef.current = setInterval(() => {
      phaseIndexRef.current += 1;

      // Check if a full cycle completed
      if (phaseIndexRef.current >= PHASE_ORDER.length) {
        phaseIndexRef.current = 0;
        cycleRef.current += 1;
        setCycleCount(cycleRef.current);

        // Update ritual progress
        ritualProgress.value = withTiming(cycleRef.current / TOTAL_CYCLES, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        });

        // Intensify mandala with each cycle
        mandalaOpacity.value = withTiming(
          0.04 + (cycleRef.current / TOTAL_CYCLES) * 0.12,
          { duration: 800 },
        );

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (cycleRef.current >= TOTAL_CYCLES) {
          setIsComplete(true);
          setShowCelebration(true);
          markBreathingComplete();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      }

      const nextPhase = PHASE_ORDER[phaseIndexRef.current];
      setBreathPhase(nextPhase);

      // Phase-specific haptic
      Haptics.impactAsync(PHASE_HAPTICS[nextPhase]);
    }, BREATH_DURATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <DivineGradient variant="release" style={styles.root}>
      {/* Celebration confetti on completion */}
      {showCelebration ? (
        <ConfettiCannon isActive particleCount={40} duration={3000} />
      ) : null}

      {/* MandalaSpin backdrop that intensifies */}
      <Animated.View style={[styles.mandalaBackdrop, mandalaStyle]}>
        <MandalaSpin
          size={SCREEN_WIDTH * 0.95}
          speed={hasStarted ? 'slow' : 'slow'}
          color={colors.divine.aura}
          opacity={1}
        />
      </Animated.View>

      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Phase tracker */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <KarmaPhaseTracker currentPhase={3} completedPhases={[1, 2]} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <Text variant="caption" color={colors.primary[400]} align="center">
            Phase 3 of 4
          </Text>
          <Text variant="h1" color={colors.divine.aura} align="center">
            Release
          </Text>
        </Animated.View>

        {/* Pre-ritual intro */}
        {!hasStarted ? (
          <View style={styles.introContainer}>
            <Animated.View entering={FadeIn.duration(700).delay(200)} style={styles.introContent}>
              <Text variant="body" color={colors.text.secondary} align="center" style={styles.introText}>
                Close your eyes and visualize the pattern as a dark cloud surrounding
                you. With each breath, you will gather its weight and release it to
                the light.
              </Text>

              <SacredDivider />

              <Text
                variant="caption"
                color={colors.text.muted}
                align="center"
                style={styles.instructionHint}
              >
                3 cycles of box breathing (4-4-4-4){'\n'}
                Each phase is 4 seconds
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(500).delay(400)}
              style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
            >
              <GoldenButton
                title="Begin Breathing Ritual"
                onPress={handleStart}
                testID="release-start"
              />
            </Animated.View>
          </View>
        ) : null}

        {/* Active breathing ritual */}
        {hasStarted ? (
          <View style={styles.ritualContainer}>
            {/* Phase label */}
            <Animated.View entering={FadeIn.duration(300)} key={breathPhase}>
              <Text variant="h2" color={colors.text.secondary} align="center">
                {isComplete ? 'Release Complete' : PHASE_LABELS[breathPhase]}
              </Text>
            </Animated.View>

            {/* Breathing visualization */}
            <Animated.View entering={FadeIn.duration(800)} style={styles.visualizationWrapper}>
              <ReleaseVisualization
                phase={breathPhase}
                cycleCount={cycleCount}
                totalCycles={TOTAL_CYCLES}
                isComplete={isComplete}
              />
            </Animated.View>

            {/* Cycle counter */}
            <View style={styles.cycleCounter}>
              <Text variant="caption" color={colors.text.muted} align="center">
                {isComplete
                  ? 'All cycles complete'
                  : `Cycle ${Math.min(cycleCount + 1, TOTAL_CYCLES)} of ${TOTAL_CYCLES}`
                }
              </Text>

              {/* Completion lotus */}
              {isComplete ? (
                <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.completionLotus}>
                  <LotusProgress progress={1} size={64} />
                </Animated.View>
              ) : null}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Continue after completion */}
            {isComplete ? (
              <Animated.View
                entering={FadeInUp.duration(500).delay(600)}
                style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
              >
                <GoldenButton
                  title="Continue to Renewal"
                  onPress={handleContinue}
                  testID="release-continue"
                />
              </Animated.View>
            ) : null}
          </View>
        ) : null}
      </View>
    </DivineGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles -- using ONLY established theme tokens
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mandalaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  header: {
    gap: spacing.xxs,
    paddingTop: spacing.xs,
  },

  // -- Pre-ritual intro --
  introContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  introContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  introText: {
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  instructionHint: {
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // -- Active ritual --
  ritualContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  visualizationWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleCounter: {
    alignItems: 'center',
    gap: spacing.md,
  },
  completionLotus: {
    marginTop: spacing.xs,
  },
  spacer: {
    height: spacing.lg,
  },

  // -- Shared --
  bottomCTA: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
});
