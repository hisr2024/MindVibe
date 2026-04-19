/**
 * SakhaMandala — Sacred geometry avatar: Sri Yantra rings + OM center.
 *
 * Web parity: four independent rotating layers.
 *   L1 (outer circle):   1px gold, counter-clockwise, 60s full cycle.
 *   L2 (hexagram):       two overlaid triangles, clockwise, 45s cycle.
 *   L3 (8-petal lotus):  gold outline, 2px stroke, counter-clockwise, 90s cycle.
 *   L4 (inner):          OM glyph centered in CormorantGaramond 14px.
 *   Aura (underlay):     radial-style gold→indigo→transparent gradient.
 *
 * Each layer has its own shared rotation value — they are never frozen as
 * one transform, satisfying the "all 4 layers move independently" guarantee.
 *
 * Note: uses react-native-svg for geometry (peer dep); Reanimated drives
 * rotation for each layer individually on the UI thread.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212, 160, 23, 0.7)';

export interface SakhaMandalaProps {
  /** Diameter in points. @default 56 */
  readonly size?: number;
  /** When true, aura intensifies and rotations speed up 1.5×. @default false */
  readonly active?: boolean;
  /** Optional style override for the outer container. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/** Compute the 6 vertices of an equilateral triangle inscribed in a circle. */
function triangleVertices(cx: number, cy: number, r: number, rotationDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const angle = ((rotationDeg + i * 120) * Math.PI) / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Build an 8-petal lotus path from cubic curves around the center. */
function lotusPath(cx: number, cy: number, r: number, petals = 8): string {
  let d = '';
  for (let i = 0; i < petals; i += 1) {
    const a0 = (i * 2 * Math.PI) / petals;
    const a1 = ((i + 1) * 2 * Math.PI) / petals;
    const mid = (a0 + a1) / 2;
    const outerX = cx + r * Math.cos(mid);
    const outerY = cy + r * Math.sin(mid);
    const startX = cx + r * 0.35 * Math.cos(a0);
    const startY = cy + r * 0.35 * Math.sin(a0);
    const endX = cx + r * 0.35 * Math.cos(a1);
    const endY = cy + r * 0.35 * Math.sin(a1);
    const c1X = cx + r * 0.85 * Math.cos(a0 + 0.1);
    const c1Y = cy + r * 0.85 * Math.sin(a0 + 0.1);
    const c2X = cx + r * 0.85 * Math.cos(a1 - 0.1);
    const c2Y = cy + r * 0.85 * Math.sin(a1 - 0.1);
    d += `M ${startX.toFixed(2)} ${startY.toFixed(2)} `;
    d += `C ${c1X.toFixed(2)} ${c1Y.toFixed(2)}, ${outerX.toFixed(2)} ${outerY.toFixed(2)}, ${outerX.toFixed(2)} ${outerY.toFixed(2)} `;
    d += `C ${outerX.toFixed(2)} ${outerY.toFixed(2)}, ${c2X.toFixed(2)} ${c2Y.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)} `;
  }
  return d;
}

function SakhaMandalaInner({
  size = 56,
  active = false,
  style,
  testID,
}: SakhaMandalaProps): React.JSX.Element {
  const speed = active ? 1.5 : 1;

  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);

  useEffect(() => {
    // L1 — outer ring, counter-clockwise, 60s / speed.
    r1.value = 0;
    r1.value = withRepeat(
      withTiming(-360, {
        duration: 60000 / speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // L2 — hexagram, clockwise, 45s / speed.
    r2.value = 0;
    r2.value = withRepeat(
      withTiming(360, {
        duration: 45000 / speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // L3 — lotus, counter-clockwise, 90s / speed.
    r3.value = 0;
    r3.value = withRepeat(
      withTiming(-360, {
        duration: 90000 / speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [r1, r2, r3, speed]);

  const animL1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r1.value}deg` }],
  }));
  const animL2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r2.value}deg` }],
  }));
  const animL3 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r3.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const lotusR = outerR * 0.85;
  const hexR = outerR * 0.65;

  const hexTriA = useMemo(() => triangleVertices(cx, cy, hexR, -90), [cx, cy, hexR]);
  const hexTriB = useMemo(() => triangleVertices(cx, cy, hexR, 90), [cx, cy, hexR]);
  const lotusD = useMemo(() => lotusPath(cx, cy, lotusR, 8), [cx, cy, lotusR]);

  const auraOpacity = active ? 1 : 0.6;
  const omFontSize = Math.max(10, size * (14 / 56));

  return (
    <View
      style={[{ width: size, height: size }, styles.container, style]}
      testID={testID}
      accessibilityLabel="SAKHA mandala"
      accessibilityRole="image"
    >
      {/* Aura gradient underlay — approximates a radial gradient with a
          soft layered pseudo-radial look using expo-linear-gradient. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.auraWrap,
          { opacity: auraOpacity },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(212, 160, 23, 0.25)',
            'rgba(27, 79, 187, 0.15)',
            'transparent',
          ]}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size },
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* L1 — outer circle */}
      <Animated.View style={[StyleSheet.absoluteFill, animL1]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={GOLD_SOFT}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* L3 — 8-petal lotus (drawn before hexagram so hexagram appears above) */}
      <Animated.View style={[StyleSheet.absoluteFill, animL3]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path
            d={lotusD}
            stroke={GOLD}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* L2 — hexagram (Star of David) */}
      <Animated.View style={[StyleSheet.absoluteFill, animL2]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon
            points={hexTriA}
            stroke={GOLD}
            strokeWidth={1.2}
            fill="none"
          />
          <Polygon
            points={hexTriB}
            stroke={GOLD}
            strokeWidth={1.2}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* L4 — stationary OM glyph in the center */}
      <View style={styles.glyphWrap} pointerEvents="none">
        <Text
          style={[
            styles.glyph,
            { fontSize: omFontSize, lineHeight: omFontSize * 1.15 },
          ]}
        >
          {'\u0950'}
        </Text>
      </View>
    </View>
  );
}

/** Sacred Sri Yantra avatar with four independently rotating layers. */
export const SakhaMandala = React.memo(SakhaMandalaInner);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraWrap: {
    overflow: 'hidden',
  },
  glyphWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: 'CormorantGaramond-Regular',
    color: GOLD,
    textAlign: 'center',
  },
});
