/**
 * DivinePresenceIndicator — The golden aura that breathes around SAKHA.
 *
 * Web parity: mirrors @keyframes divine-breath exactly.
 *   - Three stacked halo layers at glow radii 20, 40, 80 (approximated
 *     as concentric circles with progressively wider radii + lower opacity).
 *   - Opacity cycles 0.3 → 0.5 → 0.3.
 *   - Scale cycles 1.0 → 1.02 → 1.0.
 *   - Duration 4000ms, withRepeat infinite.
 *   - When `responding`, opacity multiplier is 2×.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const BREATH_DURATION_MS = 4000;

export interface DivinePresenceIndicatorProps {
  /** Size in points of the inner avatar the aura surrounds. @default 64 */
  readonly avatarSize?: number;
  /** When true, aura opacity is doubled — SAKHA is responding. @default false */
  readonly responding?: boolean;
  /** Optional style override for the absolute wrapper. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function DivinePresenceIndicatorInner({
  avatarSize = 64,
  responding = false,
  style,
  testID,
}: DivinePresenceIndicatorProps): React.JSX.Element {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    const halfBreath = BREATH_DURATION_MS / 2;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: halfBreath, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: halfBreath, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: halfBreath, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: halfBreath, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity, scale]);

  const multiplier = responding ? 2 : 1;
  const glow1 = avatarSize + 40; // inner halo (~20px glow ring)
  const glow2 = avatarSize + 80; // middle halo (~40px glow ring)
  const glow3 = avatarSize + 160; // outer halo (~80px glow ring)

  const halo1Style = useAnimatedStyle(() => ({
    opacity: Math.min(1, opacity.value * multiplier),
    transform: [{ scale: scale.value }],
  }));
  const halo2Style = useAnimatedStyle(() => ({
    opacity: Math.min(1, opacity.value * 0.6 * multiplier),
    transform: [{ scale: scale.value }],
  }));
  const halo3Style = useAnimatedStyle(() => ({
    opacity: Math.min(1, opacity.value * 0.3 * multiplier),
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, style]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.halo,
          {
            width: glow3,
            height: glow3,
            borderRadius: glow3 / 2,
            backgroundColor: GOLD,
          },
          halo3Style,
        ]}
      />
      <Animated.View
        style={[
          styles.halo,
          {
            width: glow2,
            height: glow2,
            borderRadius: glow2 / 2,
            backgroundColor: GOLD,
          },
          halo2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.halo,
          {
            width: glow1,
            height: glow1,
            borderRadius: glow1 / 2,
            backgroundColor: GOLD,
          },
          halo1Style,
        ]}
      />
    </View>
  );
}

/** Breathing golden aura that surrounds the SAKHA avatar. */
export const DivinePresenceIndicator = React.memo(DivinePresenceIndicatorInner);

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
});
