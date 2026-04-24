/**
 * EqualizerBars — 3 vertical gold bars that bounce while a track is playing.
 *
 * Visual spec: each bar is 3 px wide, gold (#D4A017), bottom-aligned.
 * When `isPlaying` is true the bars animate between min/max heights on
 * staggered periods so the pulse looks organic rather than in-lockstep.
 * When paused, bars settle to a flat resting height.
 *
 * Performance: all three bars drive their height from independent
 * Reanimated shared values on the UI thread. No JS animation frames.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const REST_HEIGHT = 4;

/** Per-bar animation tuple: [peak height, rise ms, fall ms]. */
const BAR_CURVES: readonly (readonly [number, number, number])[] = [
  [14, 380, 320],
  [18, 320, 420],
  [10, 420, 360],
];

export interface EqualizerBarsProps {
  /** Whether the bars should bounce. @default false */
  readonly isPlaying?: boolean;
  /** Container height — bars will not exceed this. @default 20 */
  readonly height?: number;
  /** Bar color override. @default DIVINE_GOLD */
  readonly color?: string;
  /** Optional style for the container. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function Bar({
  index,
  isPlaying,
  color,
  height,
}: {
  readonly index: number;
  readonly isPlaying: boolean;
  readonly color: string;
  readonly height: number;
}): React.JSX.Element {
  const h = useSharedValue(REST_HEIGHT);

  useEffect(() => {
    const curve = BAR_CURVES[index] ?? BAR_CURVES[0];
    // Guaranteed non-null by the fallback above; narrow it for the compiler.
    const [peak, rise, fall] = curve as readonly [number, number, number];
    if (isPlaying) {
      const capped = Math.min(peak, height);
      h.value = withRepeat(
        withSequence(
          withTiming(capped, {
            duration: rise,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(REST_HEIGHT, {
            duration: fall,
            easing: Easing.in(Easing.quad),
          })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(h);
      h.value = withTiming(REST_HEIGHT, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
    }
    return () => {
      cancelAnimation(h);
    };
  }, [index, isPlaying, h, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: h.value,
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

function EqualizerBarsInner({
  isPlaying = false,
  height = 20,
  color = GOLD,
  style,
  testID,
}: EqualizerBarsProps): React.JSX.Element {
  return (
    <View
      style={[styles.container, { height, gap: BAR_GAP }, style]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {[0, 1, 2].map((i) => (
        <Bar
          key={i}
          index={i}
          isPlaying={isPlaying}
          color={color}
          height={height}
        />
      ))}
    </View>
  );
}

/** Sacred 3-bar equalizer — animates only while `isPlaying` is true. */
export const EqualizerBars = React.memo(EqualizerBarsInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: BAR_WIDTH / 2,
  },
});
