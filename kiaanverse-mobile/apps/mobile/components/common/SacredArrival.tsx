/**
 * SacredArrival — The 7-Act Arrival Ceremony
 *
 * A cinematic, ~3.4s entry sequence that plays the very first time a device
 * launches Kiaanverse. It is not a loading screen — it is a darshan, the
 * moment a soul crosses the threshold into the app.
 *
 * Acts (absolute timeline, ms):
 *   1. 0–600    The Void         Single golden point pulses at center.
 *   2. 600–1400 OM Arrives       ॐ glyph draws itself with a breathing aura.
 *   3. 1400–2200 The Name        "Kiaanverse" enters letter-by-letter (stagger).
 *   4. 2200–2800 Invocation      Sanskrit benediction fades in.
 *   5. 2800–3400 The Bloom       OM recedes, scene blooms open.
 *   6. 3400+    Arrival          onComplete() fires — caller routes user.
 *
 * Accessibility:
 *   - Respects AccessibilityInfo.isReduceMotionEnabled — collapses to a 600ms
 *     fade with the OM + name + invocation shown statically.
 *   - All motion runs on the UI thread via Reanimated worklets.
 *
 * Fail-safe: the caller receives onComplete even if a timer is dropped — an
 * outer timeout in the root layout is the final safety net.
 */
import React, { useEffect, useMemo } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Tokens — inlined to keep this component self-contained.
// ---------------------------------------------------------------------------

const VOID_BG = '#050714';
const DIVINE_GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212, 160, 23, 0.45)';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.6)';

const TITLE = 'Kiaanverse';
const INVOCATION = 'ॐ सर्वे भवन्तु सुखिनः';

// Fixed-length tuple of shared value slots — keeps hook order stable.
// Ten slots accommodate the 10 letters of "Kiaanverse"; excess are unused.
const NAME_SLOT_COUNT = 10;

// Web-parity easings.
const LOTUS_BLOOM = Easing.bezier(0.22, 1.0, 0.36, 1.0);
const DIVINE_IN = Easing.bezier(0.0, 0.8, 0.2, 1.0);
const DIVINE_OUT = Easing.bezier(0.16, 1.0, 0.3, 1.0);

// Act durations (ms) — sum to ~3400.
const ACT1_POINT = 600;
const ACT2_OM = 800;
const ACT3_NAME_START = 1400;
const ACT3_LETTER_STAGGER = 60;
const ACT4_INVOCATION = 2200;
const ACT5_BLOOM = 2800;
const ACT6_COMPLETE = 3400;

const REDUCED_MOTION_DURATION = 600;

export interface SacredArrivalProps {
  /** Called once the ceremony has fully completed and faded out. */
  readonly onComplete: () => void;
}

function SacredArrivalInner({
  onComplete,
}: SacredArrivalProps): React.JSX.Element {
  // Scene-level shared values.
  const pointOpacity = useSharedValue(0);
  const pointScale = useSharedValue(1);
  const omProgress = useSharedValue(0);
  const omScale = useSharedValue(0.8);
  const omAuraOpacity = useSharedValue(0);
  const invocationOpacity = useSharedValue(0);
  const sceneScale = useSharedValue(1);
  const sceneOpacity = useSharedValue(1);

  // Letter shared values — allocated as fixed-length tuple to preserve hook
  // call order across renders (React requires identical hook sequence).
  const l0o = useSharedValue(0);
  const l0y = useSharedValue(8);
  const l1o = useSharedValue(0);
  const l1y = useSharedValue(8);
  const l2o = useSharedValue(0);
  const l2y = useSharedValue(8);
  const l3o = useSharedValue(0);
  const l3y = useSharedValue(8);
  const l4o = useSharedValue(0);
  const l4y = useSharedValue(8);
  const l5o = useSharedValue(0);
  const l5y = useSharedValue(8);
  const l6o = useSharedValue(0);
  const l6y = useSharedValue(8);
  const l7o = useSharedValue(0);
  const l7y = useSharedValue(8);
  const l8o = useSharedValue(0);
  const l8y = useSharedValue(8);
  const l9o = useSharedValue(0);
  const l9y = useSharedValue(8);

  const letterOpacities: readonly SharedValue<number>[] = useMemo(
    () => [l0o, l1o, l2o, l3o, l4o, l5o, l6o, l7o, l8o, l9o],
    [l0o, l1o, l2o, l3o, l4o, l5o, l6o, l7o, l8o, l9o]
  );
  const letterTranslates: readonly SharedValue<number>[] = useMemo(
    () => [l0y, l1y, l2y, l3y, l4y, l5y, l6y, l7y, l8y, l9y],
    [l0y, l1y, l2y, l3y, l4y, l5y, l6y, l7y, l8y, l9y]
  );

  const titleChars = useMemo(
    () => Array.from(TITLE).slice(0, NAME_SLOT_COUNT),
    []
  );

  useEffect(() => {
    let cancelled = false;
    let completionTimer: ReturnType<typeof setTimeout> | null = null;

    const fireComplete = (): void => {
      if (cancelled) return;
      onComplete();
    };

    const scheduleComplete = (delayMs: number): void => {
      completionTimer = setTimeout(fireComplete, delayMs);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) return;

        if (reduce) {
          pointOpacity.value = withTiming(1, { duration: 200 });
          omProgress.value = withTiming(1, { duration: 200 });
          omAuraOpacity.value = withTiming(0.5, { duration: 200 });
          invocationOpacity.value = withTiming(0.6, { duration: 200 });
          letterOpacities.forEach((sv) => {
            sv.value = withTiming(1, { duration: 200 });
          });
          letterTranslates.forEach((sv) => {
            sv.value = withTiming(0, { duration: 200 });
          });
          sceneOpacity.value = withDelay(
            REDUCED_MOTION_DURATION - 200,
            withTiming(0, { duration: 200 }, (finished) => {
              if (finished) runOnJS(fireComplete)();
            })
          );
          scheduleComplete(REDUCED_MOTION_DURATION + 80);
          return;
        }

        // ACT 1 — THE VOID
        pointOpacity.value = withTiming(1, {
          duration: ACT1_POINT,
          easing: DIVINE_IN,
        });
        pointScale.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 800, easing: LOTUS_BLOOM }),
            withTiming(1.0, { duration: 800, easing: LOTUS_BLOOM })
          ),
          -1,
          false
        );

        // ACT 2 — OM ARRIVES
        omProgress.value = withDelay(
          ACT1_POINT,
          withTiming(1, { duration: ACT2_OM, easing: LOTUS_BLOOM })
        );
        omAuraOpacity.value = withDelay(
          ACT1_POINT + 200,
          withTiming(0.65, { duration: ACT2_OM, easing: DIVINE_IN })
        );

        // ACT 3 — THE NAME (letter stagger)
        titleChars.forEach((_ch, idx) => {
          const oSv = letterOpacities[idx];
          const ySv = letterTranslates[idx];
          if (!oSv || !ySv) return;
          oSv.value = withDelay(
            ACT3_NAME_START + idx * ACT3_LETTER_STAGGER,
            withTiming(1, { duration: 320, easing: LOTUS_BLOOM })
          );
          ySv.value = withDelay(
            ACT3_NAME_START + idx * ACT3_LETTER_STAGGER,
            withTiming(0, { duration: 320, easing: LOTUS_BLOOM })
          );
        });

        // ACT 4 — INVOCATION
        invocationOpacity.value = withDelay(
          ACT4_INVOCATION,
          withTiming(0.6, { duration: 600, easing: DIVINE_IN })
        );

        // ACT 5 — THE BLOOM
        omScale.value = withDelay(
          ACT5_BLOOM,
          withTiming(0.8, { duration: 400, easing: DIVINE_OUT })
        );
        sceneScale.value = withDelay(
          ACT5_BLOOM,
          withTiming(1.1, { duration: 400, easing: DIVINE_OUT })
        );
        sceneOpacity.value = withDelay(
          ACT5_BLOOM,
          withTiming(0, { duration: 400, easing: DIVINE_OUT }, (finished) => {
            if (finished) runOnJS(fireComplete)();
          })
        );

        // Safety net — fire if animation callback gets dropped.
        scheduleComplete(ACT6_COMPLETE + 120);
      })
      .catch(() => {
        scheduleComplete(ACT6_COMPLETE + 120);
      });

    return () => {
      cancelled = true;
      if (completionTimer) clearTimeout(completionTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
    transform: [{ scale: sceneScale.value }],
  }));
  const pointStyle = useAnimatedStyle(() => ({
    opacity: pointOpacity.value,
    transform: [{ scale: pointScale.value }],
  }));
  const omStyle = useAnimatedStyle(() => ({
    opacity: omProgress.value,
    transform: [
      {
        scale: interpolate(omProgress.value, [0, 1], [0.4, 1]) * omScale.value,
      },
    ],
  }));
  const omAuraStyle = useAnimatedStyle(() => ({
    opacity: omAuraOpacity.value,
  }));
  const invocationStyle = useAnimatedStyle(() => ({
    opacity: invocationOpacity.value,
  }));

  // Per-letter styles — top-level hooks (not in a loop) to keep hook order stable.
  const letter0Style = useAnimatedStyle(() => ({
    opacity: l0o.value,
    transform: [{ translateY: l0y.value }],
  }));
  const letter1Style = useAnimatedStyle(() => ({
    opacity: l1o.value,
    transform: [{ translateY: l1y.value }],
  }));
  const letter2Style = useAnimatedStyle(() => ({
    opacity: l2o.value,
    transform: [{ translateY: l2y.value }],
  }));
  const letter3Style = useAnimatedStyle(() => ({
    opacity: l3o.value,
    transform: [{ translateY: l3y.value }],
  }));
  const letter4Style = useAnimatedStyle(() => ({
    opacity: l4o.value,
    transform: [{ translateY: l4y.value }],
  }));
  const letter5Style = useAnimatedStyle(() => ({
    opacity: l5o.value,
    transform: [{ translateY: l5y.value }],
  }));
  const letter6Style = useAnimatedStyle(() => ({
    opacity: l6o.value,
    transform: [{ translateY: l6y.value }],
  }));
  const letter7Style = useAnimatedStyle(() => ({
    opacity: l7o.value,
    transform: [{ translateY: l7y.value }],
  }));
  const letter8Style = useAnimatedStyle(() => ({
    opacity: l8o.value,
    transform: [{ translateY: l8y.value }],
  }));
  const letter9Style = useAnimatedStyle(() => ({
    opacity: l9o.value,
    transform: [{ translateY: l9y.value }],
  }));

  const letterStyles = [
    letter0Style,
    letter1Style,
    letter2Style,
    letter3Style,
    letter4Style,
    letter5Style,
    letter6Style,
    letter7Style,
    letter8Style,
    letter9Style,
  ];

  return (
    <Animated.View
      accessibilityLabel="Kiaanverse is opening"
      accessibilityRole="image"
      style={[styles.root, sceneStyle]}
      pointerEvents="none"
    >
      {/* Starfield backdrop — radial gradient drawn in SVG. */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="voidGlow" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="#0A1030" stopOpacity="1" />
            <Stop offset="60%" stopColor={VOID_BG} stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={W / 2}
          cy={H / 2}
          r={Math.max(W, H)}
          fill="url(#voidGlow)"
        />
      </Svg>

      {/* No flat grey/brown aura disc — the previous LinearGradient with
          `borderRadius: AURA_SIZE/2 + overflow: hidden` cropped a diagonal
          gradient into a hard circle that read as a "loading spinner". The
          Veda yantra below is the only sacred geometry we need; the cosmic
          starfield bg + a soft golden text-shadow on the OM provide the
          depth that the disc used to fake. */}

      {/* Veda yantra plate — gold-stroked Sri-Yantra design (8-petal lotus +
          inscribed circle + interlocking shatkona) drawn directly into the
          starfield with no opaque backplate, so the cosmos shows through
          between the strokes. */}
      <Animated.View
        style={[styles.yantraWrap, omAuraStyle]}
        pointerEvents="none"
      >
        <Svg width={YANTRA_SIZE} height={YANTRA_SIZE} viewBox={`0 0 ${YANTRA_SIZE} ${YANTRA_SIZE}`}>
          {/* Outer ring */}
          <Circle
            cx={YANTRA_SIZE / 2}
            cy={YANTRA_SIZE / 2}
            r={YANTRA_SIZE / 2 - 2}
            stroke="rgba(212, 160, 23, 0.55)"
            strokeWidth={1.2}
            fill="none"
          />
          {/* 8-petal lotus */}
          <Path
            d={SPLASH_LOTUS_PATH}
            stroke="rgba(212, 160, 23, 0.7)"
            strokeWidth={1.4}
            fill="none"
            strokeLinejoin="round"
          />
          {/* Inner circle */}
          <Circle
            cx={YANTRA_SIZE / 2}
            cy={YANTRA_SIZE / 2}
            r={YANTRA_SIZE * 0.32}
            stroke="rgba(212, 160, 23, 0.45)"
            strokeWidth={1}
            fill="none"
          />
          {/* Shatkona — two interlocking triangles */}
          <Polygon
            points={SPLASH_TRI_UP}
            stroke="rgba(212, 160, 23, 0.85)"
            strokeWidth={1.4}
            fill="none"
            strokeLinejoin="round"
          />
          <Polygon
            points={SPLASH_TRI_DOWN}
            stroke="rgba(212, 160, 23, 0.85)"
            strokeWidth={1.4}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* ACT 1 — point of light. */}
      <Animated.View
        style={[styles.pointWrap, pointStyle]}
        pointerEvents="none"
      >
        <View style={styles.point} />
      </Animated.View>

      {/* ACT 2 — OM glyph. */}
      <Animated.View style={[styles.omWrap, omStyle]} pointerEvents="none">
        <Text style={styles.om} allowFontScaling={false}>
          {'ॐ'}
        </Text>
      </Animated.View>

      {/* ACT 3 — "Kiaanverse" name, letter-by-letter. */}
      <View style={styles.nameRow} pointerEvents="none">
        {titleChars.map((ch, i) => (
          <Animated.Text
            key={`${ch}-${i}`}
            allowFontScaling={false}
            style={[styles.nameLetter, letterStyles[i]]}
          >
            {ch}
          </Animated.Text>
        ))}
      </View>

      {/* ACT 4 — Sanskrit invocation. */}
      <Animated.Text
        allowFontScaling={false}
        style={[styles.invocation, invocationStyle]}
      >
        {INVOCATION}
      </Animated.Text>
    </Animated.View>
  );
}

/** Kiaanverse 7-Act Arrival Ceremony — plays once per device, ~3.4s. */
export const SacredArrival = React.memo(SacredArrivalInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const OM_SIZE = 96;
const YANTRA_SIZE = 220;
const NAME_TOP = H / 2 + 72;
const INVOCATION_TOP = NAME_TOP + 56;

// ---------------------------------------------------------------------------
// Splash yantra geometry — pre-computed at module load so the splash never
// re-builds these paths on each frame. The 8-petal lotus is rendered as a
// chain of cubic teardrops; the shatkona is two interlocking triangles
// inscribed in a circle of radius r = YANTRA_SIZE * 0.30.
// ---------------------------------------------------------------------------

function splashLotusPath(): string {
  const cx = YANTRA_SIZE / 2;
  const cy = YANTRA_SIZE / 2;
  const r = YANTRA_SIZE * 0.4;
  const petals = 8;
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

function splashTrianglePoints(rotationDeg: number): string {
  const cx = YANTRA_SIZE / 2;
  const cy = YANTRA_SIZE / 2;
  const r = YANTRA_SIZE * 0.3;
  const pts: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const a = ((rotationDeg + (i * 360) / 3) * Math.PI) / 180;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
    );
  }
  return pts.join(' ');
}

const SPLASH_LOTUS_PATH = splashLotusPath();
const SPLASH_TRI_UP = splashTrianglePoints(-90);
const SPLASH_TRI_DOWN = splashTrianglePoints(90);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VOID_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yantraWrap: {
    position: 'absolute',
    width: YANTRA_SIZE,
    height: YANTRA_SIZE,
    top: H / 2 - YANTRA_SIZE / 2 - 32,
    left: W / 2 - YANTRA_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointWrap: {
    position: 'absolute',
    width: 12,
    height: 12,
    top: H / 2 - 6,
    left: W / 2 - 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  point: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DIVINE_GOLD,
    shadowColor: DIVINE_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  omWrap: {
    position: 'absolute',
    top: H / 2 - OM_SIZE / 2 - 32,
    width: OM_SIZE,
    height: OM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  om: {
    fontSize: 72,
    lineHeight: 84,
    color: DIVINE_GOLD,
    fontFamily: 'CormorantGaramond-Regular',
    textShadowColor: GOLD_SOFT,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    textAlign: 'center',
  },
  nameRow: {
    position: 'absolute',
    top: NAME_TOP,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameLetter: {
    // CormorantGaramond-Italic isn't registered (only LightItalic is). The
    // previous spelling silently fell back to the system font on Android,
    // making the title look wrong. Use the registered face.
    fontSize: 28,
    lineHeight: 34,
    color: SACRED_WHITE,
    fontFamily: 'CormorantGaramond-LightItalic',
    fontStyle: 'italic',
    letterSpacing: 0.3 * 28,
  },
  invocation: {
    // Was rendered at TEXT_MUTED (#6B6355) which is the same value as the
    // splash's near-black backdrop in poor lighting — the Sanskrit looked
    // missing. Lift to a soft warm gold and give it real Devanagari
    // descender room (lineHeight 26 for fontSize 14) so ु and ्र don't clip.
    position: 'absolute',
    top: INVOCATION_TOP,
    fontSize: 14,
    lineHeight: 26,
    color: 'rgba(245, 222, 179, 0.78)',
    fontFamily: 'NotoSansDevanagari-Regular',
    textAlign: 'center',
    letterSpacing: 0.4,
    paddingVertical: 4,
  },
});
