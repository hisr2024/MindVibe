/**
 * HeroMandala — large centerpiece yantra for the Sakha chat empty state.
 *
 * Three concentric rings, a Shatkona (6-pointed star), eight blue bindu
 * orbits, and a soft golden halo that breathes. Animates on the UI thread
 * via Reanimated so it remains buttery smooth even while the network
 * request is in flight.
 *
 * Pure SVG + Reanimated — no Skia dependency so it renders on every
 * Android device regardless of GPU tier. The halo is a plain View with
 * shadow (iOS) + elevation (Android).
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const BLUE_BINDU = '#5BA3D0';
const CORE_WHITE = '#F5F0E8';

export interface HeroMandalaProps {
  /** Overall diameter of the mandala. @default 140 */
  readonly size?: number;
  /** When true, the halo breathes faster & brighter. @default false */
  readonly active?: boolean;
  /** Container style override. */
  readonly style?: ViewStyle;
}

function HeroMandalaInner({
  size = 140,
  active = false,
  style,
}: HeroMandalaProps): React.JSX.Element {
  const breath = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: active ? 1600 : 2600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: active ? 1600 : 2600,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [breath, active]);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 48_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const haloStyle = useAnimatedStyle(() => {
    const base = active ? 0.55 : 0.35;
    const amp = active ? 0.35 : 0.2;
    const scaleAmp = active ? 0.08 : 0.04;
    return {
      opacity: base + breath.value * amp,
      transform: [{ scale: 1 + breath.value * scaleAmp }],
    };
  });

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const midR = size * 0.34;
  const innerR = size * 0.2;
  const coreR = size * 0.035;
  const binduR = size * 0.018;

  // Upward + downward triangles forming the Shatkona (6-pointed star).
  const starR = size * 0.22;
  const starPoints = useMemo(() => {
    const up = [-90, 30, 150].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return { x: cx + starR * Math.cos(a), y: cy + starR * Math.sin(a) };
    });
    const down = [90, -30, 210].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return { x: cx + starR * Math.cos(a), y: cy + starR * Math.sin(a) };
    });
    return { up, down };
  }, [cx, cy, starR]);

  // Eight small blue bindus orbiting on the outer ring.
  const bindus = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const a = ((i / 8) * Math.PI * 2) - Math.PI / 2;
      return { x: cx + outerR * Math.cos(a), y: cy + outerR * Math.sin(a) };
    });
  }, [cx, cy, outerR]);

  const halo = size * 1.35;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
        style,
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Golden ambient halo — breathes. */}
      <Animated.View
        style={[
          styles.halo,
          {
            width: halo,
            height: halo,
            borderRadius: halo / 2,
            marginLeft: -(halo - size) / 2,
            marginTop: -(halo - size) / 2,
          },
          haloStyle,
        ]}
      />

      {/* Slowly rotating geometry. */}
      <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Concentric rings */}
          <Circle cx={cx} cy={cy} r={outerR} stroke={GOLD} strokeWidth={1.1} fill="none" opacity={0.55} />
          <Circle cx={cx} cy={cy} r={midR} stroke={GOLD} strokeWidth={0.9} fill="none" opacity={0.45} />
          <Circle cx={cx} cy={cy} r={innerR} stroke={GOLD} strokeWidth={0.9} fill="none" opacity={0.7} />

          {/* Shatkona (6-pointed star) */}
          <Line x1={starPoints.up[0]!.x} y1={starPoints.up[0]!.y}
            x2={starPoints.up[1]!.x} y2={starPoints.up[1]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>
          <Line x1={starPoints.up[1]!.x} y1={starPoints.up[1]!.y}
            x2={starPoints.up[2]!.x} y2={starPoints.up[2]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>
          <Line x1={starPoints.up[2]!.x} y1={starPoints.up[2]!.y}
            x2={starPoints.up[0]!.x} y2={starPoints.up[0]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>

          <Line x1={starPoints.down[0]!.x} y1={starPoints.down[0]!.y}
            x2={starPoints.down[1]!.x} y2={starPoints.down[1]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>
          <Line x1={starPoints.down[1]!.x} y1={starPoints.down[1]!.y}
            x2={starPoints.down[2]!.x} y2={starPoints.down[2]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>
          <Line x1={starPoints.down[2]!.x} y1={starPoints.down[2]!.y}
            x2={starPoints.down[0]!.x} y2={starPoints.down[0]!.y}
            stroke={GOLD} strokeWidth={1.1} opacity={0.75}/>

          {/* Eight blue bindus on the outer ring */}
          {bindus.map((b, i) => (
            <Circle key={`bindu-${i}`} cx={b.x} cy={b.y} r={binduR} fill={BLUE_BINDU} opacity={0.85} />
          ))}

          {/* Core */}
          <Circle cx={cx} cy={cy} r={coreR * 1.8} fill={GOLD} opacity={0.18} />
          <Circle cx={cx} cy={cy} r={coreR} fill={CORE_WHITE} opacity={0.95} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Large animated sacred mandala for the Sakha empty state. */
export const HeroMandala = React.memo(HeroMandalaInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(212,160,23,0.12)',
    shadowColor: GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
});
