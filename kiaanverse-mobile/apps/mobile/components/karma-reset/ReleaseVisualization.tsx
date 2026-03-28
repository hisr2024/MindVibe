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
  withSequence,
} from 'react-native-reanimated';
import { Text, BreathingOrb, SacredTransition, colors, spacing } from '@kiaanverse/ui';

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
  const isBreathing = !isComplete;

  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  const displayText = isComplete ? COMPLETE_TEXT : PHASE_TEXT[phase];

  return (
    <SacredTransition isVisible={true}>
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        {/* Particles (shown only on completion) */}
        {particles.map((i) => (
          <Particle key={i} index={i} isVisible={isComplete} />
        ))}

        {/* Sacred breathing orb replaces the manual animated circle */}
        <BreathingOrb
          pattern={{ inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 }}
          isActive={isBreathing}
          size={180}
        />
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
    </SacredTransition>
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
