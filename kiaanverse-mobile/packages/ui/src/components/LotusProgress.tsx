/**
 * LotusProgress — Lotus flower that blooms as progress increases.
 *
 * An SVG lotus with petals that open sequentially based on a 0-1 progress
 * value. At 0 the lotus is a closed bud; at 0.5 it is half-bloomed;
 * at 1.0 it is fully open with a golden center glow.
 *
 * Each petal's rotation is driven by Reanimated for smooth transitions
 * when progress changes.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { duration } from '../tokens/motion';

/** Props for the LotusProgress component. */
export interface LotusProgressProps {
  /** Progress from 0 (bud) to 1 (full bloom). */
  readonly progress: number;
  /** Diameter of the lotus container in points. @default 100 */
  readonly size?: number;
  /** Number of petals in the lotus. @default 8 */
  readonly petalCount?: number;
  /** Color of the petals. @default colors.divine.lotus (#FF6B6B) */
  readonly petalColor?: string;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Maximum opening angle for each petal in degrees (from closed to fully open). */
const MAX_PETAL_ANGLE = 70;

/**
 * Compute the open angle for a specific petal given overall progress.
 *
 * Petals open sequentially: petal 0 starts opening at progress 0,
 * petal N-1 finishes opening at progress 1. Each petal has an
 * overlapping window so the bloom looks natural.
 */
function petalOpenAngle(
  petalIndex: number,
  petalCount: number,
  progress: number,
): number {
  // Each petal occupies a fraction of the progress range with 30% overlap
  const window = 1 / petalCount;
  const overlap = window * 0.3;
  const start = petalIndex * window - overlap;
  const end = start + window + overlap * 2;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const petalProgress = Math.max(0, Math.min(1, (clampedProgress - start) / (end - start)));

  return petalProgress * MAX_PETAL_ANGLE;
}

function LotusProgressComponent({
  progress,
  size = 100,
  petalCount = 8,
  petalColor = colors.divine.lotus,
  style,
  testID,
}: LotusProgressProps): React.JSX.Element {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  /** Shared value for animated transitions when progress changes. */
  const animProgress = useSharedValue(clampedProgress);
  /** Center glow opacity — visible only near full bloom. */
  const glowOpacity = useSharedValue(clampedProgress > 0.8 ? (clampedProgress - 0.8) * 5 : 0);

  useEffect(() => {
    animProgress.value = withTiming(clampedProgress, {
      duration: duration.sacred,
      easing: Easing.inOut(Easing.ease),
    });
    glowOpacity.value = withTiming(
      clampedProgress > 0.8 ? (clampedProgress - 0.8) * 5 : 0,
      { duration: duration.sacred, easing: Easing.inOut(Easing.ease) },
    );
  }, [clampedProgress, animProgress, glowOpacity]);

  const cx = size / 2;
  const cy = size / 2;
  const petalRx = size * 0.12; // Petal width
  const petalRy = size * 0.3;  // Petal height
  const petalOffset = size * 0.15; // Distance from center to petal base

  /** Pre-compute petal configurations. */
  const petals = useMemo(() => {
    return Array.from({ length: petalCount }, (_, i) => {
      const baseAngle = (i / petalCount) * 360;
      const openAngle = petalOpenAngle(i, petalCount, clampedProgress);
      return { baseAngle, openAngle, index: i };
    });
  }, [petalCount, clampedProgress]);

  /** Animated glow style for the center circle at full bloom. */
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Center dot and glow radii
  const centerR = size * 0.08;
  const glowR = size * 0.14;

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={`Lotus progress ${Math.round(clampedProgress * 100)}%`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Petals — each one rotates open based on progress */}
        {petals.map((petal) => {
          // The petal is drawn pointing upward, then rotated to its position.
          // The openAngle tilts it outward from the center.
          const totalRotation = petal.baseAngle;
          // Scale petal openness: 0 = flat against center, MAX_PETAL_ANGLE = fully open
          const tiltX = petal.openAngle;

          return (
            <G
              key={`petal-${petal.index}`}
              rotation={totalRotation}
              origin={`${cx}, ${cy}`}
            >
              <G
                rotation={-tiltX}
                origin={`${cx}, ${cy - petalOffset}`}
              >
                <Ellipse
                  cx={cx}
                  cy={cy - petalOffset - petalRy * 0.6}
                  rx={petalRx}
                  ry={petalRy}
                  fill={petalColor}
                  opacity={0.6 + petal.openAngle / MAX_PETAL_ANGLE * 0.3}
                />
              </G>
            </G>
          );
        })}

        {/* Center circle — always visible as the lotus core */}
        <Circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill={colors.primary[500]}
          opacity={0.9}
        />

        {/* Golden glow at full bloom */}
        <Circle
          cx={cx}
          cy={cy}
          r={glowR}
          fill={colors.divine.aura}
          opacity={clampedProgress > 0.8 ? (clampedProgress - 0.8) * 3 : 0}
        />
      </Svg>

      {/* Animated glow overlay for the center at full bloom */}
      <Animated.View
        style={[
          styles.centerGlow,
          {
            width: glowR * 2,
            height: glowR * 2,
            borderRadius: glowR,
            backgroundColor: colors.divine.aura,
          },
          glowAnimatedStyle,
        ]}
      />
    </View>
  );
}

/** SVG lotus flower that blooms progressively as a progress indicator. */
export const LotusProgress = React.memo(LotusProgressComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerGlow: {
    position: 'absolute',
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
});
