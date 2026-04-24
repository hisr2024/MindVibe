/**
 * SacredGeometryArt — full-screen album art for the Vibe Player.
 *
 * NOT a photograph. Instead, a layered mandala: three concentric Skia
 * canvases, each wrapped in an independently-rotating Animated.View so
 * every ring moves at its own tempo (outer CCW @ 60s, mid CW @ 45s,
 * inner CCW @ 90s). A six-pointed Shatkona and a stationary category
 * glyph sit at the center. The entire piece gently "breathes" — a scale
 * cycle synchronised to the track BPM (defaults to 60 bpm when the API
 * does not supply one) giving the art a living pulse.
 *
 * Category tinting: each of the five semantic categories (mantra,
 * meditation, chanting, ambient, binaural) paints the geometry in its
 * own hue so the user's mandala visibly shifts as they move through
 * the library.
 *
 * Portability: rotations are applied on Animated.View wrappers (not on
 * Skia Group transforms) so we do not have to bridge Reanimated shared
 * values into Skia — keeps the component runnable across all supported
 * Skia versions.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Supported track categories for color/icon mapping. */
export type SacredCategory =
  | 'mantra'
  | 'meditation'
  | 'chanting'
  | 'ambient'
  | 'binaural';

/** One glyph per category — rendered at the center of the mandala. */
const CATEGORY_GLYPH: Record<SacredCategory, string> = {
  mantra: 'ॐ', // ॐ
  meditation: '\u{1F338}', // 🌸 lotus
  chanting: '\u{1F4DC}', // 📜 scroll (Gita verse)
  ambient: '\u{1F30A}', // 🌊 wave
  binaural: '∞',
};

/** Semantic color per category. */
const CATEGORY_COLOR: Record<SacredCategory, string> = {
  mantra: '#D4A017',
  meditation: '#1B4FBB',
  chanting: '#8B6914',
  ambient: '#17B1A7',
  binaural: '#6C3483',
};

export interface SacredGeometryArtProps {
  /** Track category — chooses colour + center glyph. @default 'mantra' */
  readonly category?: SacredCategory;
  /** Whether the mandala should be "alive" (rotating + breathing). */
  readonly isPlaying?: boolean;
  /** Optional BPM override — defaults to 60 (1 breath per second). */
  readonly bpm?: number;
  /** Outer diameter of the mandala in points. @default 280 */
  readonly size?: number;
  /** Optional outer style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function SacredGeometryArtInner({
  category = 'mantra',
  isPlaying = false,
  bpm = 60,
  size = 280,
  style,
  testID,
}: SacredGeometryArtProps): React.JSX.Element {
  const color = CATEGORY_COLOR[category];
  const glyph = CATEGORY_GLYPH[category];

  /** Three rotation values — independent so layers visibly differ. */
  const r1 = useSharedValue(0); // outer ring, CCW, 60s
  const r2 = useSharedValue(0); // mid ring + shatkona, CW, 45s
  const r3 = useSharedValue(0); // inner ring, CCW, 90s

  /** Breath pulse: 1.0 → 1.03 → 1.0 at one full cycle per beat. */
  const breath = useSharedValue(0);

  useEffect(() => {
    if (!isPlaying) return;
    r1.value = withRepeat(
      withTiming(-360, { duration: 60_000, easing: Easing.linear }),
      -1,
      false
    );
    r2.value = withRepeat(
      withTiming(360, { duration: 45_000, easing: Easing.linear }),
      -1,
      false
    );
    r3.value = withRepeat(
      withTiming(-360, { duration: 90_000, easing: Easing.linear }),
      -1,
      false
    );
  }, [isPlaying, r1, r2, r3]);

  useEffect(() => {
    const periodMs = Math.max(400, (60 / Math.max(30, bpm)) * 1000);
    if (!isPlaying) {
      breath.value = withTiming(0, { duration: 400 });
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: periodMs / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: periodMs / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [bpm, isPlaying, breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.03 }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r2.value}deg` }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r3.value}deg` }],
  }));

  /** Outer/mid/inner radii derived from `size`. */
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const midR = outerR * 0.78;
  const innerR = outerR * 0.5;

  /** Six-pointed Shatkona star (two overlaid triangles). */
  const shatkona = useMemo(() => {
    const path = Skia.Path.Make();
    const starR = outerR * 0.62;
    const upAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
    upAngles.forEach((a, i) => {
      const x = cx + starR * Math.cos(a);
      const y = cy + starR * Math.sin(a);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();
    const downAngles = [Math.PI / 2, -Math.PI / 6, (7 * Math.PI) / 6];
    downAngles.forEach((a, i) => {
      const x = cx + starR * Math.cos(a);
      const y = cy + starR * Math.sin(a);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();
    return path;
  }, [cx, cy, outerR]);

  /** Outer ring tick marks, pre-computed. */
  const outerTicks = useMemo(() => {
    const ticks: ReturnType<typeof Skia.Path.Make>[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r0 = outerR - 6;
      const r1x = outerR + 2;
      const tick = Skia.Path.Make();
      tick.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
      tick.lineTo(cx + r1x * Math.cos(a), cy + r1x * Math.sin(a));
      ticks.push(tick);
    }
    return ticks;
  }, [cx, cy, outerR]);

  const strokeColorSoft = withAlpha(color, 0.6);
  const strokeColorFaint = withAlpha(color, 0.3);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        breathStyle,
        style,
      ]}
      testID={testID}
      accessibilityLabel={`Sacred ${category} mandala`}
      accessibilityRole="image"
    >
      {/* Outer ring — counter-clockwise, slowest. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, ring1Style]}
        pointerEvents="none"
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            color={strokeColorSoft}
            style="stroke"
            strokeWidth={1.2}
          />
          {outerTicks.map((path, i) => (
            <Path
              key={i}
              path={path}
              color={strokeColorFaint}
              style="stroke"
              strokeWidth={1}
            />
          ))}
        </Canvas>
      </Animated.View>

      {/* Mid ring + Shatkona — clockwise. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, ring2Style]}
        pointerEvents="none"
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle
            cx={cx}
            cy={cy}
            r={midR}
            color={strokeColorSoft}
            style="stroke"
            strokeWidth={1}
          />
          <Path
            path={shatkona}
            color={color}
            style="stroke"
            strokeWidth={1.2}
          />
        </Canvas>
      </Animated.View>

      {/* Inner ring + seed bindu — counter-clockwise (bindu stationary). */}
      <Animated.View
        style={[StyleSheet.absoluteFill, ring3Style]}
        pointerEvents="none"
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            color={color}
            style="stroke"
            strokeWidth={1.4}
          />
        </Canvas>
      </Animated.View>

      {/* Stationary seed bindu (in its own un-rotated canvas). */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle cx={cx} cy={cy} r={4} color={color} />
        </Canvas>
      </View>

      {/* Stationary category glyph. */}
      <View style={styles.glyphWrap} pointerEvents="none">
        <Animated.Text
          style={[styles.glyph, { color, fontSize: Math.round(size * 0.18) }]}
          allowFontScaling={false}
        >
          {glyph}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

/** Sacred geometry album art with rotating rings + breathing pulse. */
export const SacredGeometryArt = React.memo(SacredGeometryArtInner);

/** Convert `#RRGGBB` / `#RGB` into `rgba(r,g,b,a)`. */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 0xff;
  const g = (bigint >> 8) & 0xff;
  const b = bigint & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: 'CormorantGaramond-Regular',
    textAlign: 'center',
  },
});
