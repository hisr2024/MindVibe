/**
 * Arrival Ceremony — Vedic Visual Library
 *
 * Six bespoke Sacred-geometry illustrations, one per arrival page. Each is
 * built with react-native-svg + Reanimated so the animation lives on the UI
 * thread (no JS bridge frames during the breathing / rotation cycles). They
 * intentionally share a 220-point square viewport, a single accent color
 * driven from PAGES, and a quiet "breath" + "spin" idle animation pair so
 * the five+one screens feel like one continuous ceremony.
 *
 * Pages → visuals
 *   1. arjuna   → ChariotChakraVisual   — 24-spoke Ashoka Dharma Chakra +
 *                                          peacock-eye feather above the wheel.
 *   2. sakha    → SriYantraVisual       — 9 interlocking triangles inside an
 *                                          8-petal lotus, OM bindu at center.
 *   3. gita     → ManuscriptVisual      — Krishna's flute crossing concentric
 *                                          shabda (sound) rings + central OM.
 *   4. journey  → ShatkonaVisual        — Shatkona hexagram with 6 ripu orbs
 *                                          at the outer points, bindu inside.
 *   5. sacred   → PadmaSealVisual       — Layered 16+8 petal lotus encircling
 *                                          a four-fold yantra seal.
 *   6. welcome  → KiaanWelcomeVisual    — Full Sri Yantra mandala crowned by
 *                                          a peacock feather; the grand finale.
 *
 * Reduced-motion: every animation hook respects AccessibilityInfo so the
 * visual settles to a static, equally-beautiful frame for users who request it.
 */

import React, { useEffect, useMemo } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// ---------------------------------------------------------------------------
// Shared geometry helpers
// ---------------------------------------------------------------------------

export const VISUAL_SIZE = 220;
const CENTER = VISUAL_SIZE / 2;

const LOTUS_BLOOM = Easing.bezier(0.22, 1.0, 0.36, 1.0);

interface VisualProps {
  /** Accent hex used for primary strokes / glows. */
  readonly accent: string;
  /** Whether this page is on screen — pauses motion when false. */
  readonly isActive: boolean;
  /** Override the default 220pt square footprint. */
  readonly size?: number;
}

/** Build a regular-polygon point list inscribed in a circle (SVG `points`). */
function regularPolygon(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rotationDeg = -90
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = ((rotationDeg + (i * 360) / sides) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Build a multi-petal lotus path. Each petal is a teardrop cubic. */
function lotusPath(cx: number, cy: number, r: number, petals: number): string {
  let d = '';
  for (let i = 0; i < petals; i += 1) {
    const a = (i * 2 * Math.PI) / petals;
    const tipX = cx + r * Math.cos(a);
    const tipY = cy + r * Math.sin(a);
    const baseAngle = Math.PI / petals;
    const baseR = r * 0.34;
    const lX = cx + baseR * Math.cos(a + baseAngle);
    const lY = cy + baseR * Math.sin(a + baseAngle);
    const rX = cx + baseR * Math.cos(a - baseAngle);
    const rY = cy + baseR * Math.sin(a - baseAngle);
    const c1X = cx + r * 0.78 * Math.cos(a + baseAngle * 0.55);
    const c1Y = cy + r * 0.78 * Math.sin(a + baseAngle * 0.55);
    const c2X = cx + r * 0.78 * Math.cos(a - baseAngle * 0.55);
    const c2Y = cy + r * 0.78 * Math.sin(a - baseAngle * 0.55);
    d += `M ${lX.toFixed(2)} ${lY.toFixed(2)} `;
    d += `C ${c1X.toFixed(2)} ${c1Y.toFixed(2)}, ${tipX.toFixed(2)} ${tipY.toFixed(2)}, ${tipX.toFixed(2)} ${tipY.toFixed(2)} `;
    d += `C ${tipX.toFixed(2)} ${tipY.toFixed(2)}, ${c2X.toFixed(2)} ${c2Y.toFixed(2)}, ${rX.toFixed(2)} ${rY.toFixed(2)} `;
    d += `Z `;
  }
  return d;
}

/** Build N straight spokes from the inner hub radius to the outer ring. */
function spokesPath(cx: number, cy: number, rIn: number, rOut: number, count: number): string {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const a = (i * 2 * Math.PI) / count;
    const x1 = cx + rIn * Math.cos(a);
    const y1 = cy + rIn * Math.sin(a);
    const x2 = cx + rOut * Math.cos(a);
    const y2 = cy + rOut * Math.sin(a);
    d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Animation primitives — one shared "breath" + N independent spin layers
// ---------------------------------------------------------------------------

function useReducedMotionFlag(): SharedValue<number> {
  // 0 = animations on, 1 = motion-reduced (snap to static).
  const flag = useSharedValue(0);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) return;
        flag.value = reduce ? 1 : 0;
      })
      .catch(() => {
        // Probe failed — assume motion is OK.
      });
    return () => {
      cancelled = true;
    };
  }, [flag]);
  return flag;
}

function useBreath(isActive: boolean, reduced: SharedValue<number>): SharedValue<number> {
  const v = useSharedValue(1);
  useEffect(() => {
    if (!isActive || reduced.value === 1) {
      v.value = withTiming(1, { duration: 240 });
      return;
    }
    v.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1900, easing: LOTUS_BLOOM }),
        withTiming(0.95, { duration: 1900, easing: LOTUS_BLOOM })
      ),
      -1,
      false
    );
  }, [isActive, v, reduced]);
  return v;
}

function useSpin(
  isActive: boolean,
  reduced: SharedValue<number>,
  durationMs: number,
  direction: 1 | -1
): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!isActive || reduced.value === 1) {
      // Hold the current angle so the visual settles into a balanced pose.
      return;
    }
    v.value = 0;
    v.value = withRepeat(
      withTiming(360 * direction, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [isActive, v, reduced, durationMs, direction]);
  return v;
}

// ---------------------------------------------------------------------------
// 1. ChariotChakraVisual — Ashoka Dharma Chakra + peacock-eye feather
// ---------------------------------------------------------------------------

export function ChariotChakraVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const wheelSpin = useSpin(isActive, reduced, 42000, 1);
  const auraSpin = useSpin(isActive, reduced, 80000, -1);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wheelSpin.value}deg` }] }));
  const auraStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${auraSpin.value}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.42;
  const rInner = size * 0.085;
  const rRim = rOuter * 0.93;
  const spokes24 = useMemo(() => spokesPath(cx, cy, rInner, rRim, 24), [cx, cy, rInner, rRim]);

  // Peacock-feather "eye" lifted above the wheel — three concentric ovals
  // and a curling quill that grounds the chariot scene.
  const featherCx = cx;
  const featherCy = cy - rOuter * 0.78;
  const featherSize = size * 0.13;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Soft aura disc — slow counter-rotation to break monotony */}
      <Animated.View style={[StyleSheet.absoluteFill, auraStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="aura-chariot" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={accent} stopOpacity={0.22} />
              <Stop offset="65%" stopColor={accent} stopOpacity={0.05} />
              <Stop offset="100%" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={rOuter * 1.05} fill="url(#aura-chariot)" />
        </Svg>
      </Animated.View>

      {/* Static peacock feather — sits above the spinning wheel */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Quill */}
          <Path
            d={`M ${featherCx} ${featherCy + featherSize * 0.4} Q ${featherCx + featherSize * 0.6} ${cy - rOuter * 0.4} ${featherCx + featherSize * 0.2} ${cy - rOuter * 0.05}`}
            stroke={accent}
            strokeOpacity={0.45}
            strokeWidth={1}
            fill="none"
          />
          {/* Outer eye */}
          <Path
            d={`M ${featherCx} ${featherCy - featherSize} C ${featherCx + featherSize} ${featherCy - featherSize * 0.4}, ${featherCx + featherSize} ${featherCy + featherSize * 0.4}, ${featherCx} ${featherCy + featherSize} C ${featherCx - featherSize} ${featherCy + featherSize * 0.4}, ${featherCx - featherSize} ${featherCy - featherSize * 0.4}, ${featherCx} ${featherCy - featherSize} Z`}
            fill="#0E7490"
            opacity={0.55}
          />
          {/* Mid teal */}
          <Circle cx={featherCx} cy={featherCy} r={featherSize * 0.55} fill="#06B6D4" opacity={0.65} />
          {/* Gold ring of the eye */}
          <Circle cx={featherCx} cy={featherCy} r={featherSize * 0.32} fill="#D4A017" opacity={0.85} />
          {/* Indigo pupil */}
          <Circle cx={featherCx} cy={featherCy} r={featherSize * 0.13} fill="#1B0F4A" />
        </Svg>
      </View>

      {/* Spinning Dharma Chakra — 24 spokes (Ashoka style) */}
      <Animated.View style={[StyleSheet.absoluteFill, wheelStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={cx} cy={cy} r={rOuter} stroke={accent} strokeOpacity={0.65} strokeWidth={2} fill="none" />
          <Circle cx={cx} cy={cy} r={rRim} stroke={accent} strokeOpacity={0.35} strokeWidth={1} fill="none" />
          <Path d={spokes24} stroke={accent} strokeOpacity={0.55} strokeWidth={1.1} strokeLinecap="round" />
          {/* Hub */}
          <Circle cx={cx} cy={cy} r={rInner} fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={1.4} />
          <Circle cx={cx} cy={cy} r={rInner * 0.45} fill={accent} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. SriYantraVisual — 9 interlocking triangles inside an 8-petal lotus
// ---------------------------------------------------------------------------

export function SriYantraVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const lotusSpin = useSpin(isActive, reduced, 90000, -1);
  const yantraSpin = useSpin(isActive, reduced, 60000, 1);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const lotusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${lotusSpin.value}deg` }] }));
  const yantraStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${yantraSpin.value}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.46;
  const rLotus = size * 0.4;
  const rYantra = size * 0.3;

  const lotus = useMemo(() => lotusPath(cx, cy, rLotus, 8), [cx, cy, rLotus]);

  // 5 downward + 4 upward triangles, scaled in a Sri Yantra–style cascade.
  const triangles = useMemo(() => {
    const downRadii = [1.0, 0.84, 0.68, 0.52, 0.38];
    const upRadii = [0.92, 0.76, 0.6, 0.44];
    const down = downRadii.map((s) => regularPolygon(cx, cy, rYantra * s, 3, 90));
    const up = upRadii.map((s) => regularPolygon(cx, cy, rYantra * s, 3, -90));
    return { down, up };
  }, [cx, cy, rYantra]);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Aura disc */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aura-yantra" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.32} />
            <Stop offset="60%" stopColor={accent} stopOpacity={0.07} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={rOuter} fill="url(#aura-yantra)" />
      </Svg>

      {/* Outer 8-petal lotus — slow counter-rotation */}
      <Animated.View style={[StyleSheet.absoluteFill, lotusStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={lotus} stroke={accent} strokeOpacity={0.7} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r={rOuter} stroke={accent} strokeOpacity={0.3} strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>

      {/* Sri Yantra triangles — clockwise rotation */}
      <Animated.View style={[StyleSheet.absoluteFill, yantraStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {triangles.down.map((pts, i) => (
            <Polygon key={`d-${i}`} points={pts} stroke={accent} strokeOpacity={0.78 - i * 0.08} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
          ))}
          {triangles.up.map((pts, i) => (
            <Polygon key={`u-${i}`} points={pts} stroke={accent} strokeOpacity={0.78 - i * 0.08} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
          ))}
          {/* Bindu — the seed point */}
          <Circle cx={cx} cy={cy} r={size * 0.022} fill={accent} />
          <Circle cx={cx} cy={cy} r={size * 0.05} stroke={accent} strokeOpacity={0.5} strokeWidth={0.8} fill="none" />
        </Svg>
      </Animated.View>

      {/* Stationary OM */}
      <View style={[StyleSheet.absoluteFill, styles.glyphCenter]} pointerEvents="none">
        <Text allowFontScaling={false} style={[styles.omGlyph, { color: accent, fontSize: size * 0.11 }]}>
          {'ॐ'}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. ManuscriptVisual — Krishna's flute over concentric shabda rings
// ---------------------------------------------------------------------------

export function ManuscriptVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const ringPulse = useSharedValue(0);
  const fluteSpin = useSpin(isActive, reduced, 70000, 1);

  useEffect(() => {
    if (!isActive || reduced.value === 1) {
      ringPulse.value = withTiming(0, { duration: 240 });
      return;
    }
    ringPulse.value = withRepeat(
      withTiming(1, { duration: 3400, easing: LOTUS_BLOOM }),
      -1,
      false
    );
  }, [isActive, reduced, ringPulse]);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const fluteStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${fluteSpin.value}deg` }] }));
  const ring1 = useAnimatedStyle(() => ({
    opacity: 1 - ringPulse.value,
    transform: [{ scale: 0.55 + ringPulse.value * 0.7 }],
  }));
  const ring2 = useAnimatedStyle(() => ({
    opacity: 1 - ((ringPulse.value + 0.33) % 1),
    transform: [{ scale: 0.55 + ((ringPulse.value + 0.33) % 1) * 0.7 }],
  }));
  const ring3 = useAnimatedStyle(() => ({
    opacity: 1 - ((ringPulse.value + 0.66) % 1),
    transform: [{ scale: 0.55 + ((ringPulse.value + 0.66) % 1) * 0.7 }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const rRing = size * 0.42;

  // Flute: a long thin horizontal silhouette tilted slightly, with finger
  // holes implied as small dots. Drawn at native horizontal then rotated.
  const fluteLen = size * 0.78;
  const fluteThick = size * 0.034;
  const fluteY = cy;
  const fluteStartX = cx - fluteLen / 2;
  const holeY = fluteY;
  const holes = [0.5, 0.58, 0.66, 0.74, 0.82];

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Sound waves — three out-of-phase rings */}
      <Animated.View style={[StyleSheet.absoluteFill, ring1]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={cx} cy={cy} r={rRing} stroke={accent} strokeOpacity={0.55} strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ring2]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={cx} cy={cy} r={rRing} stroke={accent} strokeOpacity={0.45} strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ring3]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={cx} cy={cy} r={rRing} stroke={accent} strokeOpacity={0.35} strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>

      {/* Subtle aura behind the flute */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aura-flute" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={size * 0.28} fill="url(#aura-flute)" />
      </Svg>

      {/* Flute — slowly orbits */}
      <Animated.View style={[StyleSheet.absoluteFill, fluteStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G transform={`rotate(-18 ${cx} ${cy})`}>
            <Path
              d={`M ${fluteStartX} ${fluteY - fluteThick / 2} L ${fluteStartX + fluteLen} ${fluteY - fluteThick / 2} L ${fluteStartX + fluteLen + fluteThick * 0.6} ${fluteY} L ${fluteStartX + fluteLen} ${fluteY + fluteThick / 2} L ${fluteStartX} ${fluteY + fluteThick / 2} L ${fluteStartX - fluteThick * 0.6} ${fluteY} Z`}
              fill={accent}
              fillOpacity={0.18}
              stroke={accent}
              strokeOpacity={0.85}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            {holes.map((p, i) => (
              <Circle
                key={`hole-${i}`}
                cx={fluteStartX + fluteLen * p}
                cy={holeY}
                r={fluteThick * 0.28}
                fill="#050714"
              />
            ))}
            {/* Mouthpiece accent */}
            <Circle
              cx={fluteStartX + fluteLen * 0.36}
              cy={holeY}
              r={fluteThick * 0.32}
              fill={accent}
              fillOpacity={0.7}
            />
          </G>
        </Svg>
      </Animated.View>

      {/* Bindu OM at center */}
      <View style={[StyleSheet.absoluteFill, styles.glyphCenter]} pointerEvents="none">
        <Text allowFontScaling={false} style={[styles.omGlyph, { color: accent, fontSize: size * 0.1 }]}>
          {'ॐ'}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. ShatkonaVisual — Six-pointed star (Shadripu hexagram)
// ---------------------------------------------------------------------------

export function ShatkonaVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const orbSpin = useSpin(isActive, reduced, 50000, 1);
  const triSpin = useSpin(isActive, reduced, 75000, -1);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbSpin.value}deg` }] }));
  const triStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${triSpin.value}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.42;
  const rTri = size * 0.34;
  const rOrb = size * 0.46;

  const triUp = useMemo(() => regularPolygon(cx, cy, rTri, 3, -90), [cx, cy, rTri]);
  const triDown = useMemo(() => regularPolygon(cx, cy, rTri, 3, 90), [cx, cy, rTri]);

  // 6 ripu orbs at hexagonal positions
  const orbs = useMemo(() => {
    const arr: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 6; i += 1) {
      const a = ((i * 60 - 90) * Math.PI) / 180;
      arr.push({ x: cx + rOrb * Math.cos(a), y: cy + rOrb * Math.sin(a) });
    }
    return arr;
  }, [cx, cy, rOrb]);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Soft outer halo */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aura-shat" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={rOuter * 1.05} fill="url(#aura-shat)" />
        <Circle cx={cx} cy={cy} r={rOuter} stroke={accent} strokeOpacity={0.35} strokeWidth={1} fill="none" />
      </Svg>

      {/* Orbiting ripu orbs — 6 small filled circles connected by a hex */}
      <Animated.View style={[StyleSheet.absoluteFill, orbStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon
            points={regularPolygon(cx, cy, rOrb, 6, -90)}
            stroke={accent}
            strokeOpacity={0.25}
            strokeWidth={0.8}
            fill="none"
            strokeDasharray="2 6"
          />
          {orbs.map((o, i) => (
            <G key={`orb-${i}`}>
              <Circle cx={o.x} cy={o.y} r={size * 0.038} fill={accent} fillOpacity={0.85} />
              <Circle cx={o.x} cy={o.y} r={size * 0.06} stroke={accent} strokeOpacity={0.4} strokeWidth={1} fill="none" />
            </G>
          ))}
        </Svg>
      </Animated.View>

      {/* Counter-rotating Shatkona — interlocked triangles */}
      <Animated.View style={[StyleSheet.absoluteFill, triStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={triUp} stroke={accent} strokeOpacity={0.85} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
          <Polygon points={triDown} stroke={accent} strokeOpacity={0.85} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
          {/* Inner downward triangle (kept in same group so it co-rotates) */}
          <Polygon
            points={regularPolygon(cx, cy, rTri * 0.45, 3, 90)}
            stroke={accent}
            strokeOpacity={0.55}
            strokeWidth={1}
            fill="none"
          />
          {/* Bindu */}
          <Circle cx={cx} cy={cy} r={size * 0.025} fill={accent} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. PadmaSealVisual — Layered 16+8 petal lotus encircling a yantra seal
// ---------------------------------------------------------------------------

export function PadmaSealVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const outerSpin = useSpin(isActive, reduced, 110000, -1);
  const innerSpin = useSpin(isActive, reduced, 70000, 1);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const outerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${outerSpin.value}deg` }] }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${innerSpin.value}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.46;
  const r16 = size * 0.42;
  const r8 = size * 0.3;
  const rSeal = size * 0.16;

  const lotus16 = useMemo(() => lotusPath(cx, cy, r16, 16), [cx, cy, r16]);
  const lotus8 = useMemo(() => lotusPath(cx, cy, r8, 8), [cx, cy, r8]);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Aura */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aura-padma" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={rOuter} fill="url(#aura-padma)" />
        <Circle cx={cx} cy={cy} r={rOuter} stroke={accent} strokeOpacity={0.3} strokeWidth={1} fill="none" />
      </Svg>

      {/* Outer 16-petal lotus */}
      <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={lotus16} stroke={accent} strokeOpacity={0.55} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* Inner 8-petal lotus, counter-spin */}
      <Animated.View style={[StyleSheet.absoluteFill, innerStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={lotus8} stroke={accent} strokeOpacity={0.85} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* Yantra seal — square + diamond + bindu suggesting sealed sanctum */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon
            points={regularPolygon(cx, cy, rSeal, 4, 0)}
            stroke={accent}
            strokeOpacity={0.85}
            strokeWidth={1.4}
            fill="none"
          />
          <Polygon
            points={regularPolygon(cx, cy, rSeal * 0.78, 4, 45)}
            stroke={accent}
            strokeOpacity={0.65}
            strokeWidth={1}
            fill="none"
          />
          <Circle cx={cx} cy={cy} r={size * 0.024} fill={accent} />
        </Svg>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. KiaanWelcomeVisual — Grand finale mandala with peacock-feather crown
// ---------------------------------------------------------------------------

export function KiaanWelcomeVisual({
  accent,
  isActive,
  size = VISUAL_SIZE,
}: VisualProps): React.JSX.Element {
  const reduced = useReducedMotionFlag();
  const breath = useBreath(isActive, reduced);
  const lotusSpin = useSpin(isActive, reduced, 120000, -1);
  const yantraSpin = useSpin(isActive, reduced, 80000, 1);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const lotusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${lotusSpin.value}deg` }] }));
  const yantraStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${yantraSpin.value}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.46;
  const rLotus = size * 0.4;
  const rYantra = size * 0.28;

  const lotus16 = useMemo(() => lotusPath(cx, cy, rLotus, 16), [cx, cy, rLotus]);
  const triangles = useMemo(() => {
    const downRadii = [1.0, 0.78, 0.54, 0.36];
    const upRadii = [0.9, 0.66, 0.46];
    return {
      down: downRadii.map((s) => regularPolygon(cx, cy, rYantra * s, 3, 90)),
      up: upRadii.map((s) => regularPolygon(cx, cy, rYantra * s, 3, -90)),
    };
  }, [cx, cy, rYantra]);

  // Peacock feather "crown" above mandala — one large eye plus two smaller flank eyes.
  const crownY = cy - rOuter * 0.92;
  const crownEye = size * 0.075;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Aura halo */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aura-welcome" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.4} />
            <Stop offset="55%" stopColor={accent} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={rOuter * 1.08} fill="url(#aura-welcome)" />
        <Circle cx={cx} cy={cy} r={rOuter} stroke={accent} strokeOpacity={0.45} strokeWidth={1} fill="none" />
      </Svg>

      {/* Peacock feather crown — three feather eyes above the mandala */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Center eye */}
          <Path
            d={`M ${cx} ${crownY - crownEye} C ${cx + crownEye} ${crownY - crownEye * 0.4}, ${cx + crownEye} ${crownY + crownEye * 0.4}, ${cx} ${crownY + crownEye} C ${cx - crownEye} ${crownY + crownEye * 0.4}, ${cx - crownEye} ${crownY - crownEye * 0.4}, ${cx} ${crownY - crownEye} Z`}
            fill="#0E7490"
            opacity={0.6}
          />
          <Circle cx={cx} cy={crownY} r={crownEye * 0.55} fill="#06B6D4" opacity={0.7} />
          <Circle cx={cx} cy={crownY} r={crownEye * 0.32} fill={accent} opacity={0.9} />
          <Circle cx={cx} cy={crownY} r={crownEye * 0.13} fill="#1B0F4A" />

          {/* Flank eyes */}
          {[-1, 1].map((dir) => (
            <G key={`flank-${dir}`}>
              <Circle cx={cx + dir * crownEye * 1.4} cy={crownY + crownEye * 0.5} r={crownEye * 0.55} fill="#0E7490" opacity={0.55} />
              <Circle cx={cx + dir * crownEye * 1.4} cy={crownY + crownEye * 0.5} r={crownEye * 0.34} fill="#06B6D4" opacity={0.7} />
              <Circle cx={cx + dir * crownEye * 1.4} cy={crownY + crownEye * 0.5} r={crownEye * 0.18} fill={accent} opacity={0.9} />
            </G>
          ))}
        </Svg>
      </View>

      {/* 16-petal lotus — slow counter spin */}
      <Animated.View style={[StyleSheet.absoluteFill, lotusStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={lotus16} stroke={accent} strokeOpacity={0.65} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* Inner Sri Yantra — clockwise */}
      <Animated.View style={[StyleSheet.absoluteFill, yantraStyle, breathStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {triangles.down.map((pts, i) => (
            <Polygon key={`d-${i}`} points={pts} stroke={accent} strokeOpacity={0.78 - i * 0.12} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
          ))}
          {triangles.up.map((pts, i) => (
            <Polygon key={`u-${i}`} points={pts} stroke={accent} strokeOpacity={0.7 - i * 0.12} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
          ))}
          <Circle cx={cx} cy={cy} r={size * 0.04} fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={1} />
        </Svg>
      </Animated.View>

      {/* Stationary OM at the heart */}
      <View style={[StyleSheet.absoluteFill, styles.glyphCenter]} pointerEvents="none">
        <Text allowFontScaling={false} style={[styles.omGlyph, { color: accent, fontSize: size * 0.13 }]}>
          {'ॐ'}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  omGlyph: {
    fontFamily: 'CormorantGaramond-SemiBold',
    textAlign: 'center',
    textShadowColor: 'rgba(212, 160, 23, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
