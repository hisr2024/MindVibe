/**
 * SacredProgressRing — circular gold progress arc rendered with react-native-svg.
 *
 * Draws a dim track ring and a bright-gold arc that fills the ring as
 * `progress` (0–1) climbs. The arc animates from 0 on mount with a
 * lotus-bloom easing so the practice ring feels like it's breathing in.
 *
 * Used by the Nitya Sadhana Streak card to show today's completion.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface SacredProgressRingProps {
  /** Progress value 0.0 – 1.0. */
  readonly progress: number;
  /** Diameter in pts. @default 80 */
  readonly size?: number | undefined;
  /** Stroke thickness. @default 6 */
  readonly strokeWidth?: number | undefined;
  /** Centre label (usually the percentage). */
  readonly children?: React.ReactNode;
  readonly style?: ViewStyle | undefined;
}

export function SacredProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  children,
  style,
}: SacredProgressRingProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;

  const progressSv = useSharedValue(0);

  useEffect(() => {
    progressSv.value = withTiming(clamped, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progressSv]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressSv.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="sacredProgressGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F0C040" stopOpacity="1" />
            <Stop offset="1" stopColor="#D4A017" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(212, 160, 23, 0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* animated gold arc, starts at 12 o'clock */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#sacredProgressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>

      {children ? <View style={styles.centerSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
