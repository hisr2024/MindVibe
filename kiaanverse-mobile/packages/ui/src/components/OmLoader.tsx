/**
 * OmLoader — Rotating ॐ symbol loader. Replaces every ActivityIndicator.
 *
 * Web parity:
 * - 64×64 default, overridable via `size`.
 * - Center: '॥ ॐ ॥' in CormorantGaramond italic, gold.
 * - Outer thin ring (1px, rgba(212,160,23,0.3)).
 * - Outer ring rotates continuously every 3000ms.
 * - Whole glyph pulses (scale 0.9 ↔ 1.0) every 2000ms with flame easing.
 * - Optional label below in Outfit italic, muted text.
 *
 * Note: uses react-native-svg (peer dep) for ring geometry — equivalent
 * visual fidelity to Skia for this use case, broader platform support.
 */

import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const RING_COLOR = 'rgba(212, 160, 23, 0.3)';
const TEXT_MUTED = '#7A7060';

/** Flame easing — soft peak, soft return. */
const easeFlame = Easing.bezier(0.4, 0, 0.2, 1);

export interface OmLoaderProps {
  /** Overall diameter in points. @default 64 */
  readonly size?: number;
  /** Optional caption below the glyph (e.g., "Reflecting on dharma…"). */
  readonly label?: string;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function OmLoaderInner({
  size = 64,
  label,
  style,
  testID,
}: OmLoaderProps): React.JSX.Element {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled || reduce) return;
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
          false,
        );
        pulse.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 1000, easing: easeFlame }),
            withTiming(1.0, { duration: 1000, easing: easeFlame }),
          ),
          -1,
          false,
        );
      })
      .catch(() => {
        // Accessibility query unsupported — still animate.
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
          false,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [rotation, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glyphFontSize = size * (28 / 64);

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      testID={testID}
    >
      <View style={{ width: size, height: size }}>
        <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 1}
              stroke={RING_COLOR}
              strokeWidth={1}
              fill="none"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.glyphWrap, glyphStyle]}>
          <Text
            style={[
              styles.glyph,
              { fontSize: glyphFontSize, lineHeight: glyphFontSize * 1.1 },
            ]}
          >
            {'\u0965 \u0950 \u0965'}
          </Text>
        </Animated.View>
      </View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

/** Meditative loader with rotating ring and pulsing ॐ glyph. */
export const OmLoader = React.memo(OmLoaderInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: 'CormorantGaramond-LightItalic',
    color: GOLD,
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    fontFamily: 'Outfit-Regular',
    fontStyle: 'italic',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
});
