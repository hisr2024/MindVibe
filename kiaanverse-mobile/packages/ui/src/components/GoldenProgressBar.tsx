/**
 * GoldenProgressBar — Animated golden progress indicator.
 *
 * Fills left to right with a spring animation when progress changes.
 * Uses theme accent color for the fill and surface color for the track.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { radii } from '../tokens/radii';
import { spring } from '../tokens/motion';

/** Props for the GoldenProgressBar component. */
export interface GoldenProgressBarProps {
  /** Progress value from 0 to 100. */
  readonly progress: number;
  /** Height of the bar in points. @default 6 */
  readonly height?: number;
  /** Whether to show the percentage label. @default false */
  readonly showLabel?: boolean;
  /** Optional container style. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function GoldenProgressBarInner({
  progress,
  height = 6,
  showLabel = false,
  style,
  testID,
}: GoldenProgressBarProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const widthValue = useSharedValue(0);

  useEffect(() => {
    widthValue.value = withSpring(clampedProgress, spring.default);
  }, [clampedProgress, widthValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

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
        />
      </View>
      {showLabel ? (
        <Animated.Text style={[styles.label, { color: c.textTertiary }]}>
          {Math.round(clampedProgress)}%
        </Animated.Text>
      ) : null}
    </View>
  );
}

/** Animated golden progress bar with spring fill animation. */
export const GoldenProgressBar = React.memo(GoldenProgressBarInner);

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.full,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
});
