/**
 * ReleaseVisualization — Animated circle that transforms from dark to gold.
 *
 * Expands on inhale, holds, contracts on exhale, holds — mirroring box breathing.
 * As breathing cycles complete the colour shifts from deep purple to radiant gold.
 * On completion, golden particle circles emanate outward as a visual celebration.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Text, colors, spacing } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface ReleaseVisualizationProps {
  readonly phase: BreathPhase;
  readonly cycleCount: number;
  readonly totalCycles: number;
  readonly isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Phase instruction text
// ---------------------------------------------------------------------------

const PHASE_TEXT: Record<BreathPhase, string> = {
  inhale: 'Inhale... gathering the weight',
  holdIn: 'Hold... acknowledging it',
  exhale: 'Exhale... releasing it',
  holdOut: 'Rest... letting go',
};

const COMPLETE_TEXT = 'The pattern is released. Feel the lightness.';

const DARK_COLOR = '#2C1654';
const GOLD_COLOR = '#FFD700';
const CIRCLE_SIZE = 200;

// ---------------------------------------------------------------------------
// Particle (absolute-positioned animated circle)
// ---------------------------------------------------------------------------

function Particle({ index, isVisible }: { index: number; isVisible: boolean }): React.JSX.Element {
  const angle = (index / 8) * Math.PI * 2;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (isVisible) {
      const distance = 120;
      translateX.value = withTiming(Math.cos(angle) * distance, { duration: 1200 });
      translateY.value = withTiming(Math.sin(angle) * distance, { duration: 1200 });
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 900 }),
      );
      scale.value = withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(0.2, { duration: 800 }),
      );
    } else {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [isVisible, angle, translateX, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.particle, animatedStyle]} />;
}

// ---------------------------------------------------------------------------
// Main Visualization
// ---------------------------------------------------------------------------

export function ReleaseVisualization({
  phase,
  cycleCount,
  totalCycles,
  isComplete,
}: ReleaseVisualizationProps): React.JSX.Element {
  const circleScale = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  // Progress from dark to gold based on cycles completed
  const progressRatio = totalCycles > 0 ? cycleCount / totalCycles : 0;

  useEffect(() => {
    colorProgress.value = withTiming(progressRatio, { duration: 600 });
  }, [progressRatio, colorProgress]);

  // Scale based on breath phase
  useEffect(() => {
    if (isComplete) {
      circleScale.value = withTiming(1.1, { duration: 800 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      return;
    }

    switch (phase) {
      case 'inhale':
        circleScale.value = withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        break;
      case 'holdIn':
        // Hold at expanded size
        break;
      case 'exhale':
        circleScale.value = withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        break;
      case 'holdOut':
        // Hold at contracted size
        break;
    }

    // Pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [phase, isComplete, circleScale, glowOpacity]);

  const circleStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      [DARK_COLOR, GOLD_COLOR],
    );

    return {
      transform: [{ scale: circleScale.value }],
      backgroundColor: bgColor,
      shadowOpacity: glowOpacity.value,
    };
  });

  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  const displayText = isComplete ? COMPLETE_TEXT : PHASE_TEXT[phase];

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        {/* Particles (shown only on completion) */}
        {particles.map((i) => (
          <Particle key={i} index={i} isVisible={isComplete} />
        ))}

        {/* Main circle */}
        <Animated.View style={[styles.circle, circleStyle]} />
      </View>

      {/* Phase instruction */}
      <Text variant="body" color={colors.text.primary} align="center" style={styles.phaseText}>
        {displayText}
      </Text>

      {/* Cycle counter */}
      {!isComplete ? (
        <Text variant="caption" color={colors.text.muted} align="center">
          Cycle {Math.min(cycleCount + 1, totalCycles)} of {totalCycles}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: GOLD_COLOR,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD_COLOR,
  },
  phaseText: {
    paddingHorizontal: spacing.xl,
    fontStyle: 'italic',
  },
});
