/**
 * LoadingMandala — Rotating sacred geometry SVG spinner.
 *
 * Concentric circles and petal patterns in gold, rotating smoothly
 * and continuously via Reanimated withRepeat + withTiming (linear).
 *
 * Used as a meditative loading state — calmer than a standard spinner.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

/** Props for the LoadingMandala component. */
export interface LoadingMandalaProps {
  /** Diameter of the mandala in points. @default 120 */
  readonly size?: number;
  /** Override the mandala color. @default divine.aura (#FFD700) */
  readonly color?: string;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Number of petals/spokes in the mandala pattern. */
const PETAL_COUNT = 12;

function LoadingMandalaComponent({
  size = 120,
  color: colorProp,
  style,
  testID,
}: LoadingMandalaProps): React.JSX.Element {
  const { theme } = useTheme();
  const mandalaColor = colorProp ?? theme.palette.divine.aura;

  const rotation = useSharedValue(0);

  useEffect(() => {
    // Reanimated shared-value mutation — idiomatic worklet pattern.
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const midR = outerR * 0.65;
  const innerR = outerR * 0.35;

  return (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outermost ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={mandalaColor}
            strokeWidth={1.5}
            fill="none"
            opacity={0.4}
          />

          {/* Middle ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={midR}
            stroke={mandalaColor}
            strokeWidth={1}
            fill="none"
            opacity={0.3}
          />

          {/* Inner ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            stroke={mandalaColor}
            strokeWidth={1}
            fill="none"
            opacity={0.5}
          />

          {/* Center dot */}
          <Circle
            cx={cx}
            cy={cy}
            r={3}
            fill={mandalaColor}
            opacity={0.8}
          />

          {/* Radial spokes */}
          {Array.from({ length: PETAL_COUNT }, (_, i) => {
            const angle = (i / PETAL_COUNT) * Math.PI * 2;
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy + innerR * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy + outerR * Math.sin(angle);

            return (
              <Line
                key={`spoke-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={mandalaColor}
                strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
                strokeLinecap="round"
                opacity={i % 2 === 0 ? 0.5 : 0.25}
              />
            );
          })}

          {/* Petal diamonds at the middle ring */}
          {Array.from({ length: PETAL_COUNT }, (_, i) => {
            const angle = (i / PETAL_COUNT) * Math.PI * 2 + Math.PI / PETAL_COUNT;
            const px = cx + midR * Math.cos(angle);
            const py = cy + midR * Math.sin(angle);

            return (
              <Circle
                key={`petal-${i}`}
                cx={px}
                cy={py}
                r={2.5}
                fill={mandalaColor}
                opacity={0.4}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Sacred geometry mandala spinner with smooth continuous rotation. */
export const LoadingMandala = LoadingMandalaComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
