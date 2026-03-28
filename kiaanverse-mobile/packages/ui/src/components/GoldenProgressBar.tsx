/**
 * GoldenProgressBar — Animated golden progress indicator with shimmer.
 *
 * Fills left to right with a spring animation when progress changes.
 * Features a subtle golden shimmer that sweeps across the filled area,
 * evoking the sacred glow of temple gold leaf.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { radii } from '../tokens/radii';
import { spring, duration } from '../tokens/motion';
import { gradients } from '../tokens/gradients';

/** Props for the GoldenProgressBar component. */
export interface GoldenProgressBarProps {
  /** Progress value from 0 to 100. */
  readonly progress: number;
  /** Height of the bar in points. @default 6 */
  readonly height?: number;
  /** Whether to show the percentage label. @default false */
  readonly showLabel?: boolean;
  /** Enable shimmer animation. @default true */
  readonly shimmer?: boolean;
  /** Optional container style. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function GoldenProgressBarInner({
  progress,
  height = 6,
  showLabel = false,
  shimmer = true,
  style,
  testID,
}: GoldenProgressBarProps): React.JSX.Element {
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const widthValue = useSharedValue(0);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    widthValue.value = withSpring(clampedProgress, spring.default);
  }, [clampedProgress, widthValue]);

  useEffect(() => {
    if (!shimmer || clampedProgress === 0) return;
    // eslint-disable-next-line react-hooks/immutability
    shimmerX.value = withRepeat(
      withTiming(2, { duration: duration.sacred * 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmer, clampedProgress, shimmerX]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 100 }],
    opacity: 0.5,
  }));

  const mode = isDark ? 'dark' : 'light';
  const shimmerColors = gradients.progressShimmer[mode];

  return (
    <View style={style} testID={testID}>
      <View
        style={[styles.track, { height, backgroundColor: c.surface }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      >
        <Animated.View
          style={[
            styles.fill,
            { height, backgroundColor: c.accent },
            fillStyle,
          ]}
        >
          {shimmer && clampedProgress > 0 && (
            <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
              <LinearGradient
                colors={shimmerColors as unknown as string[]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
      {showLabel ? (
        <Animated.Text style={[styles.label, { color: c.textTertiary }]}>
          {Math.round(clampedProgress)}%
        </Animated.Text>
      ) : null}
    </View>
  );
}

/** Animated golden progress bar with spring fill and sacred shimmer. */
export const GoldenProgressBar = React.memo(GoldenProgressBarInner);

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
});
