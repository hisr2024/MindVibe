/**
 * useGoldenPulse — Three-ring radial gold pulse for milestones.
 *
 * Web parity:
 *   - 3 rings fire in sequence, 120ms apart.
 *   - Each ring: scale 0.5 → 2.0, opacity 0.6 → 0.
 *   - Duration per ring: 800ms, peacock-shimmer easing.
 *
 * The hook returns:
 *   - `pulseElement`: a ready-to-render View to place behind the target
 *     (absolutely positioned; pointer events disabled so taps pass through).
 *   - `triggerPulse`: a function the caller invokes on milestone events
 *     (e.g., verse reveal complete, SAKHA message sent, streak unlocked).
 *
 * Usage:
 *   const { pulseElement, triggerPulse } = useGoldenPulse();
 *   return (
 *     <View>
 *       {pulseElement}
 *       <Button title="Send" onPress={() => { triggerPulse(); send(); }} />
 *     </View>
 *   );
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import {
  PULSE,
  PULSE_OPACITY_FROM,
  PULSE_RING_COUNT,
  PULSE_RING_DELAY,
  PULSE_SCALE_FROM,
  PULSE_SCALE_TO,
  easePeacockShimmer,
} from './tokens';

const GOLD = '#D4A017';

export interface UseGoldenPulseOptions {
  /** Diameter of each ring at rest (px). @default 64 */
  readonly size?: number;
  /** Override ring color. @default gold (#D4A017) */
  readonly color?: string;
  /** Ring stroke width. @default 2 */
  readonly strokeWidth?: number;
}

export interface UseGoldenPulseResult {
  /** A ready-to-place absolute element that renders the three pulse rings. */
  readonly pulseElement: React.ReactElement;
  /** Fire the pulse. Safe to call repeatedly (state resets each trigger). */
  readonly triggerPulse: () => void;
  /** Raw style for composing the primary ring if not using `pulseElement`. */
  readonly pulseStyle: AnimatedStyle<ViewStyle>;
}

interface RingProps {
  readonly size: number;
  readonly color: string;
  readonly strokeWidth: number;
  readonly scale: ReturnType<typeof useSharedValue<number>>;
  readonly opacity: ReturnType<typeof useSharedValue<number>>;
}

function PulseRing({
  size,
  color,
  strokeWidth,
  scale,
  opacity,
}: RingProps): React.JSX.Element {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: strokeWidth,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        style,
      ]}
    />
  );
}

export function useGoldenPulse(
  options: UseGoldenPulseOptions = {},
): UseGoldenPulseResult {
  const {
    size = 64,
    color = GOLD,
    strokeWidth = 2,
  } = options;

  // Three independent ring pairs (scale + opacity) — one per ring.
  const scale0 = useSharedValue(PULSE_SCALE_FROM);
  const scale1 = useSharedValue(PULSE_SCALE_FROM);
  const scale2 = useSharedValue(PULSE_SCALE_FROM);
  const opacity0 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);

  const firePair = useCallback(
    (
      scale: ReturnType<typeof useSharedValue<number>>,
      opacity: ReturnType<typeof useSharedValue<number>>,
      delayMs: number,
    ) => {
      // Reset to starting state before firing (handles repeat triggers).
      scale.value = PULSE_SCALE_FROM;
      opacity.value = 0;

      scale.value = withDelay(
        delayMs,
        withTiming(PULSE_SCALE_TO, {
          duration: PULSE,
          easing: easePeacockShimmer,
        }),
      );

      // Opacity ramps up briefly, then falls to 0 — emulate withSequence
      // via a single withTiming since withSequence would double the duration.
      opacity.value = withDelay(
        delayMs,
        withTiming(PULSE_OPACITY_FROM, {
          duration: PULSE * 0.15,
          easing: easePeacockShimmer,
        }),
      );
      opacity.value = withDelay(
        delayMs + PULSE * 0.15,
        withTiming(0, {
          duration: PULSE * 0.85,
          easing: easePeacockShimmer,
        }),
      );
    },
    [],
  );

  const triggerPulse = useCallback(() => {
    firePair(scale0, opacity0, 0);
    firePair(scale1, opacity1, PULSE_RING_DELAY);
    firePair(scale2, opacity2, PULSE_RING_DELAY * 2);
  }, [firePair, scale0, scale1, scale2, opacity0, opacity1, opacity2]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale0.value }],
    opacity: opacity0.value,
  }));

  // Element is pre-composed so callers can drop it in without juggling refs.
  const pulseElement = (
    <View pointerEvents="none" style={styles.anchor}>
      {PULSE_RING_COUNT >= 1 ? (
        <PulseRing
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          scale={scale0}
          opacity={opacity0}
        />
      ) : null}
      {PULSE_RING_COUNT >= 2 ? (
        <PulseRing
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          scale={scale1}
          opacity={opacity1}
        />
      ) : null}
      {PULSE_RING_COUNT >= 3 ? (
        <PulseRing
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          scale={scale2}
          opacity={opacity2}
        />
      ) : null}
    </View>
  );

  return { pulseElement, triggerPulse, pulseStyle };
}

const styles = StyleSheet.create({
  anchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: 'transparent',
  },
});
