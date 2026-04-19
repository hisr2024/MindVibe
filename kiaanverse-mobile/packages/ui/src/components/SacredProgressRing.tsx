/**
 * SacredProgressRing — Circular progress arc with gold gradient.
 *
 * Web parity:
 * - 80px default.
 * - Track: thin 2px circle, rgba(212, 160, 23, 0.15).
 * - Progress arc: 3px stroke with gold gradient (#D4A017 → #F0C040), rounded caps.
 * - Animates from 0 → `progress` (0..1) on mount with 800ms lotus-bloom timing.
 * - Center: streak count in CormorantGaramond-BoldItalic 24px, gold.
 * - On reach 1.0, emits a golden pulse ring that expands outward once.
 *
 * Uses react-native-svg (peer dep); Reanimated shared value drives stroke
 * dashoffset via animated props on the UI thread.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const TRACK_COLOR = 'rgba(212, 160, 23, 0.15)';
const GOLD = '#D4A017';
const GOLD_LIGHT = '#F0C040';

const lotusBloom = Easing.bezier(0.22, 1, 0.36, 1);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface SacredProgressRingProps {
  /** Progress value 0..1. Values are clamped. */
  readonly progress: number;
  /** Diameter in points. @default 80 */
  readonly size?: number;
  /** Streak count (or label) rendered in the center. */
  readonly label?: string | number;
  /** Optional secondary caption below the label. */
  readonly caption?: string;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function SacredProgressRingInner({
  progress,
  size = 80,
  label,
  caption,
  style,
  testID,
}: SacredProgressRingProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, progress));
  const strokeWidth = 3;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Shared value 0..1 driving stroke-dashoffset.
  const value = useSharedValue(0);
  // Secondary pulse scale & opacity for the completion ripple.
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(clamped, { duration: 800, easing: lotusBloom });
    if (clamped >= 1) {
      // Completion pulse: expand once outward.
      pulseOpacity.value = withSequence(
        withTiming(0.8, { duration: 300, easing: lotusBloom }),
        withTiming(0, { duration: 900, easing: lotusBloom }),
      );
      pulseScale.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.4, { duration: 1200, easing: lotusBloom }),
      );
    }
  }, [clamped, value, pulseOpacity, pulseScale]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const labelFontSize = Math.max(16, size * (24 / 80));

  return (
    <View
      style={[{ width: size, height: size }, styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      testID={testID}
    >
      {/* Completion pulse ring (absolute, beneath). */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: GOLD_LIGHT,
          },
          pulseStyle,
        ]}
      />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="sacredProgressGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={GOLD} />
            <Stop offset="100%" stopColor={GOLD_LIGHT} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={TRACK_COLOR}
          strokeWidth={2}
          fill="none"
        />

        {/* Progress arc — rotated -90° so it starts at 12 o'clock. */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#sacredProgressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {(label !== undefined || caption) && (
        <View style={styles.center} pointerEvents="none">
          {label !== undefined ? (
            <Text style={[styles.label, { fontSize: labelFontSize }]}>
              {String(label)}
            </Text>
          ) : null}
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
      )}
    </View>
  );
}

/** Animated golden progress ring with streak center and completion pulse. */
export const SacredProgressRing = React.memo(SacredProgressRingInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'CormorantGaramond-Regular',
    fontWeight: '700',
    fontStyle: 'italic',
    color: GOLD,
    textAlign: 'center',
  },
  caption: {
    marginTop: 2,
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: '#C8BFA8',
    letterSpacing: 0.4,
  },
});
