/**
 * EmotionOrb — Mood-reactive orb that shifts color based on emotional state.
 *
 * Maps 8 spiritual moods to distinct colors and renders a softly pulsing,
 * glowing circular orb. When the mood changes, the orb smoothly transitions
 * to the new color over 800ms. A gentle scale pulse (1.0 -> 1.05) and
 * opacity oscillation create an organic, breathing effect.
 *
 * All animations run on the UI thread via Reanimated worklets.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { duration } from '../tokens/motion';

/** Available emotional states for the orb. */
export type EmotionOrbMood =
  | 'peaceful'
  | 'joyful'
  | 'confused'
  | 'anxious'
  | 'sad'
  | 'grateful'
  | 'angry'
  | 'hopeful';

/** Mood-to-color mapping. */
const MOOD_COLORS: Record<EmotionOrbMood, string> = {
  peaceful: '#17b1a7',          // Cyan
  joyful: colors.primary[500],  // Gold (#D4A017)
  confused: '#6C3483',          // Purple
  anxious: '#E67E22',           // Orange
  sad: '#2980B9',               // Blue
  grateful: '#3D8B5E',          // Green
  angry: '#C0392B',             // Red
  hopeful: colors.divine.saffron, // Saffron (#FF6600)
} as const;

/** Ordered mood keys for stable interpolation indices. */
const MOOD_KEYS: readonly EmotionOrbMood[] = [
  'peaceful', 'joyful', 'confused', 'anxious',
  'sad', 'grateful', 'angry', 'hopeful',
] as const;

/** Numeric indices for interpolateColor. */
const MOOD_INDICES = MOOD_KEYS.map((_, i) => i);
/** Color values in the same order as MOOD_KEYS. */
const MOOD_COLOR_VALUES = MOOD_KEYS.map((m) => MOOD_COLORS[m]);

/** Props for the EmotionOrb component. */
export interface EmotionOrbProps {
  /** Current emotional state driving the orb color. */
  readonly mood: EmotionOrbMood;
  /** Diameter of the orb in points. @default 120 */
  readonly size?: number;
  /** Whether the pulse animation is active. @default true */
  readonly isAnimating?: boolean;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Duration of the mood color transition in milliseconds. */
const COLOR_TRANSITION_MS = 800;

function EmotionOrbComponent({
  mood,
  size = 120,
  isAnimating = true,
  style,
  testID,
}: EmotionOrbProps): React.JSX.Element {
  /** Shared value driving the color interpolation. */
  const colorIndex = useSharedValue(MOOD_KEYS.indexOf(mood));
  /** Pulse scale oscillation. */
  const pulseScale = useSharedValue(1);
  /** Pulse opacity oscillation. */
  const pulseOpacity = useSharedValue(0.85);

  // Transition color when mood changes
  useEffect(() => {
    const targetIndex = MOOD_KEYS.indexOf(mood);
    colorIndex.value = withTiming(targetIndex, {
      duration: COLOR_TRANSITION_MS,
      easing: Easing.inOut(Easing.ease),
    });
  }, [mood, colorIndex]);

  // Pulse animation
  useEffect(() => {
    if (isAnimating) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1.0, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.75, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1.0, { duration: 400 });
      pulseOpacity.value = withTiming(0.85, { duration: 400 });
    }
  }, [isAnimating, pulseScale, pulseOpacity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
    backgroundColor: interpolateColor(
      colorIndex.value,
      MOOD_INDICES,
      MOOD_COLOR_VALUES as string[],
    ),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * 1.15 }],
    opacity: pulseOpacity.value * 0.3,
    backgroundColor: interpolateColor(
      colorIndex.value,
      MOOD_INDICES,
      MOOD_COLOR_VALUES as string[],
    ),
  }));

  const orbDiameter = size * 0.75;

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={`Emotion orb showing ${mood} mood`}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: orbDiameter + 20,
            height: orbDiameter + 20,
            borderRadius: (orbDiameter + 20) / 2,
          },
          glowStyle,
        ]}
      />

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: orbDiameter,
            height: orbDiameter,
            borderRadius: orbDiameter / 2,
          },
          orbStyle,
        ]}
      />
    </View>
  );
}

/** Mood-reactive orb that transitions color based on emotional state with a gentle pulse. */
export const EmotionOrb = React.memo(EmotionOrbComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  orb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
});
