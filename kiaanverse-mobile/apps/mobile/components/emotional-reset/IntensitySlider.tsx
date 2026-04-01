/**
 * IntensitySlider — Custom horizontal slider with gradient track (green -> yellow -> red).
 *
 * Displays the current value (1-10) above the thumb and provides haptic
 * feedback on value changes. Built with react-native-gesture-handler
 * Gesture.Pan() and Reanimated shared values for UI-thread gesture tracking.
 *
 * Performance: Gestures run entirely on the UI thread. Only integer value
 * changes trigger JS callbacks (haptic + onChange), not every pixel of drag.
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IntensitySliderProps {
  /** Current value (1-10). */
  readonly value: number;
  /** Called when the user drags the thumb to a new integer value. */
  readonly onChange: (value: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_VALUE = 1;
const MAX_VALUE = 10;
const THUMB_SIZE = 32;
const TRACK_HEIGHT = 10;

const GRADIENT_COLORS = ['#3D8B5E', '#7DBF5E', '#F0C040', '#E67E22', '#C0392B'] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntensitySlider({ value, onChange }: IntensitySliderProps): React.JSX.Element {
  const trackWidth = useSharedValue(0);
  const lastReportedValue = useRef(value);

  const thumbX = useSharedValue(0);

  /** Convert a value (1-10) to an x-offset along the track. */
  const valueToX = (v: number, width: number): number => {
    if (width <= 0) return 0;
    return ((v - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * width;
  };

  /** Convert an x-offset to the nearest integer value (1-10). */
  const xToValue = (x: number, width: number): number => {
    if (width <= 0) return MIN_VALUE;
    const ratio = Math.max(0, Math.min(1, x / width));
    return Math.round(ratio * (MAX_VALUE - MIN_VALUE) + MIN_VALUE);
  };

  const fireHapticAndChange = useCallback(
    (newValue: number) => {
      if (newValue !== lastReportedValue.current) {
        lastReportedValue.current = newValue;
        Haptics.selectionAsync();
        onChange(newValue);
      }
    },
    [onChange],
  );

  /**
   * Gesture.Pan() runs on the UI thread for smooth tracking.
   * Only fires runOnJS when the snapped integer value changes.
   */
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      thumbX.value = withSpring(x, { damping: 20, stiffness: 300 });
      const newVal = xToValue(x, trackWidth.value);
      runOnJS(fireHapticAndChange)(newVal);
    })
    .onUpdate((e) => {
      'worklet';
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      thumbX.value = x;
      const newVal = xToValue(x, trackWidth.value);
      runOnJS(fireHapticAndChange)(newVal);
    })
    .onEnd(() => {
      'worklet';
      // Snap to nearest value position
      const snappedX = valueToX(lastReportedValue.current, trackWidth.value);
      thumbX.value = withSpring(snappedX, { damping: 20, stiffness: 300 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      'worklet';
      const x = Math.max(0, Math.min(e.x, trackWidth.value));
      const newVal = xToValue(x, trackWidth.value);
      const snappedX = valueToX(newVal, trackWidth.value);
      thumbX.value = withSpring(snappedX, { damping: 20, stiffness: 300 });
      runOnJS(fireHapticAndChange)(newVal);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const handleTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      trackWidth.value = width;
      thumbX.value = valueToX(value, width);
    },
    [value, thumbX, trackWidth],
  );

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  return (
    <View style={styles.container}>
      {/* Value badge above thumb */}
      <View style={styles.valueBadgeRow}>
        <Animated.View style={[styles.valueBadge, thumbAnimatedStyle]}>
          <Text variant="label" color={colors.background.dark} align="center">
            {value}
          </Text>
        </Animated.View>
      </View>

      {/* Track with gradient — gesture detection on the UI thread */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.trackWrap} onLayout={handleTrackLayout}>
          <LinearGradient
            colors={[...GRADIENT_COLORS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.track}
          />
          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
        </View>
      </GestureDetector>

      {/* Min / Max labels */}
      <View style={styles.labelRow}>
        <Text variant="caption" color={colors.text.muted}>
          1
        </Text>
        <Text variant="caption" color={colors.text.muted}>
          10
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
  },
  valueBadgeRow: {
    height: 32,
    marginBottom: spacing.xs,
  },
  valueBadge: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackWrap: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.text.primary,
    borderWidth: 3,
    borderColor: colors.primary[500],
    elevation: 4,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
