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
import { LinearGradient } from 'expo-linear-gradient';
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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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

function SacredArrivalInner({ onComplete }: SacredArrivalProps): React.JSX.Element {
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
  const l0o = useSharedValue(0); const l0y = useSharedValue(8);
  const l1o = useSharedValue(0); const l1y = useSharedValue(8);
  const l2o = useSharedValue(0); const l2y = useSharedValue(8);
  const l3o = useSharedValue(0); const l3y = useSharedValue(8);
  const l4o = useSharedValue(0); const l4y = useSharedValue(8);
  const l5o = useSharedValue(0); const l5y = useSharedValue(8);
  const l6o = useSharedValue(0); const l6y = useSharedValue(8);
  const l7o = useSharedValue(0); const l7y = useSharedValue(8);
  const l8o = useSharedValue(0); const l8y = useSharedValue(8);
  const l9o = useSharedValue(0); const l9y = useSharedValue(8);

  const letterOpacities: ReadonlyArray<SharedValue<number>> = useMemo(
    () => [l0o, l1o, l2o, l3o, l4o, l5o, l6o, l7o, l8o, l9o],
    [l0o, l1o, l2o, l3o, l4o, l5o, l6o, l7o, l8o, l9o],
  );
  const letterTranslates: ReadonlyArray<SharedValue<number>> = useMemo(
    () => [l0y, l1y, l2y, l3y, l4y, l5y, l6y, l7y, l8y, l9y],
    [l0y, l1y, l2y, l3y, l4y, l5y, l6y, l7y, l8y, l9y],
  );

  const titleChars = useMemo(() => Array.from(TITLE).slice(0, NAME_SLOT_COUNT), []);

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
            }),
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
            withTiming(1.0, { duration: 800, easing: LOTUS_BLOOM }),
          ),
          -1,
          false,
        );

        // ACT 2 — OM ARRIVES
        omProgress.value = withDelay(
          ACT1_POINT,
          withTiming(1, { duration: ACT2_OM, easing: LOTUS_BLOOM }),
        );
        omAuraOpacity.value = withDelay(
          ACT1_POINT + 200,
          withTiming(0.65, { duration: ACT2_OM, easing: DIVINE_IN }),
        );

        // ACT 3 — THE NAME (letter stagger)
        titleChars.forEach((_ch, idx) => {
          const oSv = letterOpacities[idx];
          const ySv = letterTranslates[idx];
          if (!oSv || !ySv) return;
          oSv.value = withDelay(
            ACT3_NAME_START + idx * ACT3_LETTER_STAGGER,
            withTiming(1, { duration: 320, easing: LOTUS_BLOOM }),
          );
          ySv.value = withDelay(
            ACT3_NAME_START + idx * ACT3_LETTER_STAGGER,
            withTiming(0, { duration: 320, easing: LOTUS_BLOOM }),
          );
        });

        // ACT 4 — INVOCATION
        invocationOpacity.value = withDelay(
          ACT4_INVOCATION,
          withTiming(0.6, { duration: 600, easing: DIVINE_IN }),
        );

        // ACT 5 — THE BLOOM
        omScale.value = withDelay(
          ACT5_BLOOM,
          withTiming(0.8, { duration: 400, easing: DIVINE_OUT }),
        );
        sceneScale.value = withDelay(
          ACT5_BLOOM,
          withTiming(1.1, { duration: 400, easing: DIVINE_OUT }),
        );
        sceneOpacity.value = withDelay(
          ACT5_BLOOM,
          withTiming(0, { duration: 400, easing: DIVINE_OUT }, (finished) => {
            if (finished) runOnJS(fireComplete)();
          }),
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
      { scale: interpolate(omProgress.value, [0, 1], [0.4, 1]) * omScale.value },
    ],
  }));
  const omAuraStyle = useAnimatedStyle(() => ({
    opacity: omAuraOpacity.value,
  }));
  const invocationStyle = useAnimatedStyle(() => ({
    opacity: invocationOpacity.value,
  }));

  // Per-letter styles — top-level hooks (not in a loop) to keep hook order stable.
  const letter0Style = useAnimatedStyle(() => ({ opacity: l0o.value, transform: [{ translateY: l0y.value }] }));
  const letter1Style = useAnimatedStyle(() => ({ opacity: l1o.value, transform: [{ translateY: l1y.value }] }));
  const letter2Style = useAnimatedStyle(() => ({ opacity: l2o.value, transform: [{ translateY: l2y.value }] }));
  const letter3Style = useAnimatedStyle(() => ({ opacity: l3o.value, transform: [{ translateY: l3y.value }] }));
  const letter4Style = useAnimatedStyle(() => ({ opacity: l4o.value, transform: [{ translateY: l4y.value }] }));
  const letter5Style = useAnimatedStyle(() => ({ opacity: l5o.value, transform: [{ translateY: l5y.value }] }));
  const letter6Style = useAnimatedStyle(() => ({ opacity: l6o.value, transform: [{ translateY: l6y.value }] }));
  const letter7Style = useAnimatedStyle(() => ({ opacity: l7o.value, transform: [{ translateY: l7y.value }] }));
  const letter8Style = useAnimatedStyle(() => ({ opacity: l8o.value, transform: [{ translateY: l8y.value }] }));
  const letter9Style = useAnimatedStyle(() => ({ opacity: l9o.value, transform: [{ translateY: l9y.value }] }));

  const letterStyles = [
    letter0Style, letter1Style, letter2Style, letter3Style, letter4Style,
    letter5Style, letter6Style, letter7Style, letter8Style, letter9Style,
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
        <Circle cx={W / 2} cy={H / 2} r={Math.max(W, H)} fill="url(#voidGlow)" />
      </Svg>

      {/* OM aura — concentric golden glow that breathes behind the glyph. */}
      <Animated.View style={[styles.auraWrap, omAuraStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(212, 160, 23, 0.35)', 'rgba(27, 79, 187, 0.12)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.auraGradient}
        />
      </Animated.View>

      {/* ACT 1 — point of light. */}
      <Animated.View style={[styles.pointWrap, pointStyle]} pointerEvents="none">
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
const AURA_SIZE = 260;
const NAME_TOP = H / 2 + 72;
const INVOCATION_TOP = NAME_TOP + 56;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VOID_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraWrap: {
    position: 'absolute',
    width: AURA_SIZE,
    height: AURA_SIZE,
    top: H / 2 - AURA_SIZE / 2,
    left: W / 2 - AURA_SIZE / 2,
    borderRadius: AURA_SIZE / 2,
    overflow: 'hidden',
  },
  auraGradient: {
    flex: 1,
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
    fontSize: 28,
    lineHeight: 34,
    color: SACRED_WHITE,
    fontFamily: 'CormorantGaramond-Italic',
    fontStyle: 'italic',
    letterSpacing: 0.3 * 28,
  },
  invocation: {
    position: 'absolute',
    top: INVOCATION_TOP,
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_MUTED,
    fontFamily: 'NotoSansDevanagari-Regular',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
