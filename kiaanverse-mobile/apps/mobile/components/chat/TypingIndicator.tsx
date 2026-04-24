/**
 * TypingIndicator — compact "Sakha is reflecting" card.
 *
 * Port of the web typing indicator:
 * - Three gold dots (8×8 px, radius 4) that pulse sequentially. Each dot
 *   animates scale 1.0 → 1.5 → 1.0 over 400 ms with a 150 ms stagger so
 *   the pulse travels left-to-right rather than firing simultaneously.
 * - Small ॐ (OM) glyph — NotoSansDevanagari 14 px gold — that slowly
 *   rotates (8 s full turn).
 * - Caption: "Reflecting on dharma…" — Outfit Italic 11 px muted.
 * - Wrapped in a compact SacredCard-style container with a subtle gold
 *   left-border accent to match SakhaMessage.
 * - Entrance: opacity 0 → 1 (200 ms); the parent controls exit by
 *   unmounting, so we only animate opacity in.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const BUBBLE_BG = 'rgba(19,26,61,0.92)';

/** One pulsing dot — plays 1.0 → 1.5 → 1.0 with a stagger delay. */
function PulseDot({ delay }: { delay: number }): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: 200, easing: Easing.in(Easing.quad) }),
          // Pause before the next cycle so all three dots share a 850 ms period
          // (3 dots × 150 ms stagger + 400 ms swing ≈ 850 ms).
          withTiming(1.0, { duration: 450 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0.55, { duration: 200, easing: Easing.in(Easing.quad) }),
          withTiming(0.55, { duration: 450 })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

/** Slowly rotating ॐ glyph. */
function SpinningOm(): React.JSX.Element {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.Text style={[styles.om, animatedStyle]}>ॐ</Animated.Text>;
}

function TypingIndicatorInner(): React.JSX.Element {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [entrance]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
  }));

  return (
    <Animated.View
      style={[styles.outer, entranceStyle]}
      accessibilityRole="text"
      accessibilityLabel="Sakha is reflecting"
    >
      <View style={styles.card}>
        <View style={styles.leftAccent} />
        <View style={styles.inner}>
          <View style={styles.row}>
            <PulseDot delay={0} />
            <PulseDot delay={150} />
            <PulseDot delay={300} />
            <SpinningOm />
          </View>
          <Text style={styles.caption}>Reflecting on dharma…</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** Sacred 3-dot typing indicator with spinning OM and dharma caption. */
export const TypingIndicator = React.memo(TypingIndicatorInner);

const styles = StyleSheet.create({
  outer: {
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: BUBBLE_BG,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
    overflow: 'hidden',
  },
  leftAccent: {
    width: 2,
    backgroundColor: GOLD,
    opacity: 0.7,
  },
  inner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  om: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    color: GOLD,
    marginLeft: 4,
  },
  caption: {
    fontFamily: 'Outfit-Regular',
    fontStyle: 'italic',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});
