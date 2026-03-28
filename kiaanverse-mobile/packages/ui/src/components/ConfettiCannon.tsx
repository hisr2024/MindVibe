/**
 * ConfettiCannon — Golden confetti particle burst for celebrations.
 *
 * Fires a burst of golden particles that arc upward then fall under gravity
 * with slight horizontal drift. Each particle has random size, color,
 * rotation, and velocity for a natural, joyful effect.
 *
 * Uses Reanimated shared values and useAnimatedStyle for 60fps performance.
 * All physics calculations run on the UI thread via worklets.
 */

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { particles as particleTokens } from '../tokens/sacred';

/** Default golden color palette for confetti particles. */
const DEFAULT_CONFETTI_COLORS = [
  colors.divine.aura,     // #FFD700
  colors.primary[500],    // #D4A017
  colors.primary[300],    // #F0C040
  '#FFA500',              // Orange gold
  '#DAA520',              // Goldenrod
  '#E8B54A',              // Warm gold
] as const;

/** Props for the ConfettiCannon component. */
export interface ConfettiCannonProps {
  /** Whether the confetti burst is active. Triggers on transition to true. */
  readonly isActive: boolean;
  /** Number of particles to emit. @default 60 */
  readonly particleCount?: number;
  /** Array of colors for the particles. @default golden palette */
  readonly colors?: readonly string[];
  /** Called when the confetti animation finishes. */
  readonly onComplete?: () => void;
  /** Duration of the animation in milliseconds. @default 2500 */
  readonly duration?: number;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Shape of a pre-computed particle with random initial conditions. */
interface ParticleConfig {
  /** Horizontal velocity (points per animation unit). */
  readonly vx: number;
  /** Initial vertical velocity (negative = upward). */
  readonly vy: number;
  /** Particle color from the palette. */
  readonly color: string;
  /** Particle size in points. */
  readonly size: number;
  /** Initial rotation in degrees. */
  readonly rotation: number;
  /** Rotation velocity in degrees per animation unit. */
  readonly rotationSpeed: number;
  /** Whether this particle is a circle (true) or rectangle (false). */
  readonly isCircle: boolean;
  /** Delay before this particle starts in ms. */
  readonly delay: number;
}

/** Generate random particle configurations for the burst. */
function generateParticles(
  count: number,
  colorPalette: readonly string[],
): ParticleConfig[] {
  const result: ParticleConfig[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 0.8) + Math.PI * 0.1; // Fan upward
    const speed = 2 + Math.random() * 4;

    result.push({
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed,
      color: colorPalette[i % colorPalette.length] ?? '#FFD700',
      size: particleTokens.baseSize + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
      isCircle: Math.random() > 0.5,
      delay: Math.random() * 200,
    });
  }

  return result;
}

/** A single animated confetti particle. */
function ConfettiParticle({
  config,
  isActive,
  animDuration,
}: {
  readonly config: ParticleConfig;
  readonly isActive: boolean;
  readonly animDuration: number;
}): React.JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      progress.value = 0;
      progress.value = withDelay(
        config.delay,
        withTiming(1, {
          duration: animDuration,
          easing: Easing.out(Easing.quad),
        }),
      );
    } else {
      progress.value = 0;
    }
  }, [isActive, progress, config.delay, animDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const gravity = particleTokens.gravity * 800;

    // Physics: position = initial_velocity * t + 0.5 * gravity * t^2
    const x = config.vx * t * 120;
    const y = config.vy * t * 120 + 0.5 * gravity * t * t;
    const rotation = config.rotation + config.rotationSpeed * t;

    // Fade out in the last 40% of the animation
    const fadeStart = 0.6;
    const opacity = t > fadeStart
      ? 1 - ((t - fadeStart) / (1 - fadeStart))
      : 1;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotation}deg` },
      ],
      opacity: Math.max(0, opacity),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: config.size,
          height: config.isCircle ? config.size : config.size * 1.5,
          borderRadius: config.isCircle ? config.size / 2 : 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function ConfettiCannonComponent({
  isActive,
  particleCount = 60,
  colors: colorsProp,
  onComplete,
  duration: durationProp = 2500,
  style,
  testID,
}: ConfettiCannonProps): React.JSX.Element | null {
  const palette = colorsProp ?? DEFAULT_CONFETTI_COLORS;
  const prevActive = useRef(false);

  const particles = useMemo(
    () => generateParticles(particleCount, palette),
    [particleCount, palette],
  );

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (isActive && !prevActive.current) {
      // Trigger completion callback after animation duration
      const timer = setTimeout(handleComplete, durationProp + 200);
      prevActive.current = true;
      return () => clearTimeout(timer);
    }

    if (!isActive) {
      prevActive.current = false;
    }

    return undefined;
  }, [isActive, durationProp, handleComplete]);

  if (!isActive) return null;

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {particles.map((config: ParticleConfig, i: number) => (
        <ConfettiParticle
          key={`confetti-${i}`}
          config={config}
          isActive={isActive}
          animDuration={durationProp}
        />
      ))}
    </View>
  );
}

/** Golden confetti particle burst for celebrations and achievements. */
export const ConfettiCannon = React.memo(ConfettiCannonComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
