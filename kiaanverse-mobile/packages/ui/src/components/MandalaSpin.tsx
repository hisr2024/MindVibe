/**
 * MandalaSpin — Rotating mandala background decoration using SVG.
 *
 * A subtle, continuously rotating mandala pattern composed of concentric
 * circles and petal shapes. Intended as a low-opacity background element
 * that adds visual depth without distracting from foreground content.
 *
 * Uses react-native-svg for the mandala geometry and Reanimated
 * withRepeat + withTiming for smooth continuous rotation on the UI thread.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';

type MandalaSpinSpeed = 'slow' | 'normal' | 'fast';

/** Speed presets mapping to rotation duration in milliseconds. */
const SPEED_DURATIONS: Record<MandalaSpinSpeed, number> = {
  slow: 20000,
  normal: 12000,
  fast: 6000,
};

/** Props for the MandalaSpin component. */
export interface MandalaSpinProps {
  /** Diameter of the mandala in points. @default 200 */
  readonly size?: number;
  /** Rotation speed preset. @default 'normal' */
  readonly speed?: 'slow' | 'normal' | 'fast';
  /** Color of the mandala strokes and fills. @default colors.primary[500] (gold) */
  readonly color?: string;
  /** Overall opacity of the mandala. @default 0.12 */
  readonly opacity?: number;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Number of outer petal shapes. */
const OUTER_PETALS = 12;
/** Number of inner petal shapes. */
const INNER_PETALS = 8;

function MandalaSpinComponent({
  size = 200,
  speed = 'normal',
  color = colors.primary[500],
  opacity = 0.12,
  style,
  testID,
}: MandalaSpinProps): React.JSX.Element {
  const rotation = useSharedValue(0);

  const durationMs = SPEED_DURATIONS[speed];

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation, durationMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const midR = outerR * 0.7;
  const innerR = outerR * 0.4;
  const coreR = outerR * 0.18;

  /** Pre-compute petal positions to avoid recalculation on re-render. */
  const outerPetals = useMemo(() => {
    return Array.from({ length: OUTER_PETALS }, (_, i) => {
      const angle = (i / OUTER_PETALS) * Math.PI * 2;
      const petalCx = cx + midR * Math.cos(angle);
      const petalCy = cy + midR * Math.sin(angle);
      const rotationDeg = (angle * 180) / Math.PI;
      return { petalCx, petalCy, rotationDeg, angle };
    });
  }, [cx, cy, midR]);

  const innerPetalPositions = useMemo(() => {
    return Array.from({ length: INNER_PETALS }, (_, i) => {
      const angle = (i / INNER_PETALS) * Math.PI * 2;
      const px = cx + innerR * Math.cos(angle);
      const py = cy + innerR * Math.sin(angle);
      return { px, py };
    });
  }, [cx, cy, innerR]);

  return (
    <View
      style={[styles.container, { width: size, height: size, opacity }, style]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outermost ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={0.5}
          />

          {/* Middle ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={midR}
            stroke={color}
            strokeWidth={0.8}
            fill="none"
            opacity={0.35}
          />

          {/* Inner ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            stroke={color}
            strokeWidth={0.8}
            fill="none"
            opacity={0.4}
          />

          {/* Core ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={coreR}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={0.5}
          />

          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={3} fill={color} opacity={0.7} />

          {/* Outer petal shapes — ellipses radiating from center */}
          {outerPetals.map((petal, i) => (
            <G
              key={`outer-petal-${i}`}
              rotation={petal.rotationDeg}
              origin={`${cx}, ${cy}`}
            >
              <Ellipse
                cx={cx}
                cy={cy - midR}
                rx={outerR * 0.08}
                ry={outerR * 0.22}
                fill={color}
                opacity={0.2}
              />
            </G>
          ))}

          {/* Radial spokes from core to outer ring */}
          {outerPetals.map((petal, i) => {
            const x1 = cx + coreR * Math.cos(petal.angle);
            const y1 = cy + coreR * Math.sin(petal.angle);
            const x2 = cx + outerR * Math.cos(petal.angle);
            const y2 = cy + outerR * Math.sin(petal.angle);
            return (
              <Line
                key={`spoke-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={i % 2 === 0 ? 1 : 0.5}
                opacity={i % 2 === 0 ? 0.3 : 0.15}
              />
            );
          })}

          {/* Inner petal dots at the inner ring */}
          {innerPetalPositions.map((pos, i) => (
            <Circle
              key={`inner-dot-${i}`}
              cx={pos.px}
              cy={pos.py}
              r={2.5}
              fill={color}
              opacity={0.4}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Rotating mandala background decoration with configurable speed and color. */
export const MandalaSpin = React.memo(MandalaSpinComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
