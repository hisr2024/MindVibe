/**
 * WaveformVisualizer — Audio waveform bars for the vibe player.
 *
 * A row of vertical bars that bounce at randomized heights when playing,
 * creating a lively audio visualization. When paused, bars settle to a
 * minimum resting height with a smooth transition.
 *
 * Uses Reanimated withRepeat and staggered timing for 60fps performance.
 * Each bar animates independently with a unique phase offset and amplitude
 * for a natural, organic waveform look.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { duration as motionDuration } from '../tokens/motion';

/** Props for the WaveformVisualizer component. */
export interface WaveformVisualizerProps {
  /** Whether the audio is currently playing. */
  readonly isPlaying: boolean;
  /** Number of waveform bars. @default 20 */
  readonly barCount?: number;
  /** Color of the bars. @default colors.primary[500] (gold) */
  readonly color?: string;
  /** Maximum height of the waveform container in points. @default 40 */
  readonly height?: number;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Width of each bar in points. */
const BAR_WIDTH = 2.5;
/** Gap between bars in points. */
const BAR_GAP = 2;
/** Minimum bar height as a fraction of container height. */
const MIN_HEIGHT_FRACTION = 0.1;

/**
 * Pre-computed amplitude and phase values for each bar position.
 * Creates a natural arc shape — center bars taller, edges shorter.
 */
function computeBarParams(barCount: number): Array<{ amplitude: number; phase: number; speed: number }> {
  const params: Array<{ amplitude: number; phase: number; speed: number }> = [];

  for (let i = 0; i < barCount; i++) {
    // Arc envelope: center bars are tallest
    const normalizedPos = i / (barCount - 1); // 0 to 1
    const arcValue = Math.sin(normalizedPos * Math.PI); // 0 -> 1 -> 0
    const amplitude = 0.3 + arcValue * 0.7; // 0.3 to 1.0

    // Staggered phase for wave effect
    const phase = (i / barCount) * Math.PI * 2;

    // Slight speed variation for organic feel
    const speed = 400 + (i % 3) * 100;

    params.push({ amplitude, phase, speed });
  }

  return params;
}

/** A single animated waveform bar. */
function WaveBar({
  isPlaying,
  index,
  containerHeight,
  color,
  amplitude,
  speed,
}: {
  readonly isPlaying: boolean;
  readonly index: number;
  readonly containerHeight: number;
  readonly color: string;
  readonly amplitude: number;
  readonly speed: number;
}): React.JSX.Element {
  const barHeight = useSharedValue(containerHeight * MIN_HEIGHT_FRACTION);
  const minH = containerHeight * MIN_HEIGHT_FRACTION;
  const maxH = containerHeight * amplitude;

  useEffect(() => {
    if (isPlaying) {
      barHeight.value = withDelay(
        index * 30, // Stagger start
        withRepeat(
          withSequence(
            withTiming(maxH, {
              duration: speed,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(minH + (maxH - minH) * 0.3, {
              duration: speed * 0.7,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(maxH * 0.8, {
              duration: speed * 0.5,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(minH, {
              duration: speed * 0.8,
              easing: Easing.inOut(Easing.sine),
            }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(barHeight);
      barHeight.value = withTiming(minH, {
        duration: motionDuration.normal,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isPlaying, barHeight, index, maxH, minH, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: BAR_WIDTH, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function WaveformVisualizerComponent({
  isPlaying,
  barCount = 20,
  color = colors.primary[500],
  height = 40,
  style,
  testID,
}: WaveformVisualizerProps): React.JSX.Element {
  const barParams = React.useMemo(() => computeBarParams(barCount), [barCount]);

  return (
    <View
      style={[styles.container, { height }, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={isPlaying ? 'Audio playing' : 'Audio paused'}
    >
      {barParams.map((params, i) => (
        <WaveBar
          key={`wave-bar-${i}`}
          index={i}
          isPlaying={isPlaying}
          containerHeight={height}
          color={color}
          amplitude={params.amplitude}
          speed={params.speed}
        />
      ))}
    </View>
  );
}

/** Audio waveform visualizer with animated bouncing bars for the vibe player. */
export const WaveformVisualizer = React.memo(WaveformVisualizerComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: BAR_GAP,
  },
  bar: {
    borderRadius: BAR_WIDTH / 2,
  },
});
