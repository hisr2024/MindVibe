/**
 * StreakFlame — Animated streak indicator with flame emoji.
 *
 * Flame size and glow intensity scale with the streak count:
 *   0-2 days:   small, subtle
 *   3-6 days:   medium, gentle glow
 *   7-13 days:  larger, warm glow
 *   14+ days:   largest, pulsing golden aura
 *
 * Uses react-native-reanimated for smooth scaling and opacity animations.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Text, colors, spacing } from '@kiaanverse/ui';

export interface StreakFlameProps {
  /** Current streak count */
  readonly streak: number;
  /** Size of the flame emoji display area (default 40) */
  readonly size?: number;
}

/** Returns a scale multiplier based on the streak tier */
function getFlameScale(streak: number): number {
  if (streak <= 0) return 0.7;
  if (streak <= 2) return 0.8;
  if (streak <= 6) return 1.0;
  if (streak <= 13) return 1.15;
  return 1.3;
}

/** Returns a glow opacity based on the streak tier */
function getGlowOpacity(streak: number): number {
  if (streak <= 0) return 0;
  if (streak <= 2) return 0.15;
  if (streak <= 6) return 0.3;
  if (streak <= 13) return 0.5;
  return 0.7;
}

function StreakFlameInner({
  streak,
  size = 40,
}: StreakFlameProps): React.JSX.Element {
  const baseScale = getFlameScale(streak);
  const glowOpacity = getGlowOpacity(streak);
  const shouldPulse = streak >= 14;

  const scale = useSharedValue(baseScale);
  const opacity = useSharedValue(glowOpacity);

  useEffect(() => {
    scale.value = withSpring(baseScale, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(glowOpacity, { duration: 400 });

    if (shouldPulse) {
      // Pulsing animation for 14+ day streaks
      scale.value = withRepeat(
        withSequence(
          withTiming(baseScale * 1.1, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(baseScale, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // infinite
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(glowOpacity * 1.3, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(glowOpacity, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    }
  }, [streak, baseScale, glowOpacity, shouldPulse, scale, opacity]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fontSize = size * 0.65;

  return (
    <View style={[styles.container, { width: size, height: size + 16 }]}>
      {/* Glow background */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
          },
        ]}
      />

      {/* Flame emoji */}
      <Animated.View style={flameStyle}>
        <Text
          variant="body"
          align="center"
          style={{ fontSize, lineHeight: fontSize * 1.3 }}
        >
          {'🔥'}
        </Text>
      </Animated.View>

      {/* Streak number */}
      <Text variant="caption" color={colors.primary[300]} align="center">
        {streak}
      </Text>
    </View>
  );
}

export const StreakFlame = React.memo(StreakFlameInner);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.divine.aura,
    top: 0,
    alignSelf: 'center',
  },
});
