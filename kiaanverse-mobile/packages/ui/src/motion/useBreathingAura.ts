/**
 * useBreathingAura — gentle continuous breath for sacred elements.
 *
 * Web parity: idles at scale 1.0 → 1.04 → 1.0 on a 4 s cycle with a
 * synchronous shadow opacity swell (0.2 → 0.4 → 0.2). When `active` is
 * true the breath intensifies — scale climbs to 1.08 and shadow opacity
 * peaks at 0.6 — communicating heightened divine presence without
 * changing rhythm.
 *
 * Uses a "flame" easing (fast-in / slow-out) so the swell feels warm
 * rather than mechanical. Runs entirely on the UI thread via
 * Reanimated `withRepeat(withSequence(...))`.
 *
 * Usage:
 *   const { breathStyle, shadowOpacity } = useBreathingAura({ active });
 *   return (
 *     <Animated.View style={[styles.mandala, breathStyle]}>
 *       <Animated.View
 *         style={[styles.halo, useAnimatedStyle(() => ({ opacity: shadowOpacity.value }))]}
 *       />
 *       …
 *     </Animated.View>
 *   );
 */

import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

/** Cycle duration in milliseconds — one full inhale + exhale. */
const CYCLE_MS = 4000;

/** Idle scale range. */
const IDLE_SCALE_PEAK = 1.04;
/** Active scale range — intensifies presence without changing tempo. */
const ACTIVE_SCALE_PEAK = 1.08;

/** Idle shadow opacity range. */
const IDLE_SHADOW_PEAK = 0.4;
const IDLE_SHADOW_BASE = 0.2;

/** Active shadow opacity range. */
const ACTIVE_SHADOW_PEAK = 0.6;
const ACTIVE_SHADOW_BASE = 0.4;

/**
 * "Flame" easing curve — quick in, slow settle. Matches the web's
 * FLAME token; implemented inline so the hook stays self-contained.
 */
const flameEasing = Easing.bezier(0.4, 0, 0.2, 1);

export interface UseBreathingAuraOptions {
  /** Intensify the breath (scale + shadow peak higher). @default false */
  readonly active?: boolean;
  /** Override cycle duration (ms). @default 4000 */
  readonly cycleMs?: number;
  /** Disable the animation — useful in tests / reduced-motion. */
  readonly disabled?: boolean;
}

export interface UseBreathingAuraResult {
  /** Transform style that scales the target. Apply to an Animated.View. */
  readonly breathStyle: AnimatedStyle<ViewStyle>;
  /** Shadow opacity shared value — compose into a custom halo style. */
  readonly shadowOpacity: SharedValue<number>;
  /** Scale shared value (0-1 driver), exposed for advanced compositions. */
  readonly breath: SharedValue<number>;
}

export function useBreathingAura(
  options: UseBreathingAuraOptions = {},
): UseBreathingAuraResult {
  const {
    active = false,
    cycleMs = CYCLE_MS,
    disabled = false,
  } = options;

  // `breath` drives a 0 → 1 → 0 triangle wave; consumers interpolate it.
  const breath = useSharedValue(0);

  // Separate shared values so a consumer can bind shadowOpacity directly
  // to a halo View without interpolating `breath` itself — this keeps
  // UI-thread work minimal for the common case.
  const scalePeak = useSharedValue(active ? ACTIVE_SCALE_PEAK : IDLE_SCALE_PEAK);
  const shadowPeak = useSharedValue(active ? ACTIVE_SHADOW_PEAK : IDLE_SHADOW_PEAK);
  const shadowBase = useSharedValue(active ? ACTIVE_SHADOW_BASE : IDLE_SHADOW_BASE);
  const shadowOpacity = useSharedValue(
    active ? ACTIVE_SHADOW_BASE : IDLE_SHADOW_BASE,
  );

  // Target updates happen in an effect so transitions glide between
  // idle and active rather than snapping.
  useEffect(() => {
    scalePeak.value = withTiming(
      active ? ACTIVE_SCALE_PEAK : IDLE_SCALE_PEAK,
      { duration: 400, easing: flameEasing },
    );
    shadowPeak.value = withTiming(
      active ? ACTIVE_SHADOW_PEAK : IDLE_SHADOW_PEAK,
      { duration: 400, easing: flameEasing },
    );
    shadowBase.value = withTiming(
      active ? ACTIVE_SHADOW_BASE : IDLE_SHADOW_BASE,
      { duration: 400, easing: flameEasing },
    );
  }, [active, scalePeak, shadowPeak, shadowBase]);

  useEffect(() => {
    if (disabled) {
      breath.value = 0;
      shadowOpacity.value = shadowBase.value;
      return;
    }
    const half = Math.max(200, cycleMs / 2);
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: flameEasing }),
        withTiming(0, { duration: half, easing: flameEasing }),
      ),
      -1,
      false,
    );
    // Match the shadow cycle to the scale cycle so both peak together.
    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(shadowPeak.value, { duration: half, easing: flameEasing }),
        withTiming(shadowBase.value, { duration: half, easing: flameEasing }),
      ),
      -1,
      false,
    );
  }, [cycleMs, disabled, breath, shadowOpacity, shadowPeak, shadowBase]);

  const breathStyle = useAnimatedStyle(() => {
    // Interpolate between 1.0 and the current scalePeak using `breath`.
    const scale = 1 + breath.value * (scalePeak.value - 1);
    return { transform: [{ scale }] };
  });

  return {
    breathStyle,
    shadowOpacity,
    breath,
  };
}
