/**
 * useGoldenPulse — breathing golden glow used on the sacred flame icon.
 *
 * Two modes:
 *   · continuous (default): infinite 2s in/out pulse on mount
 *   · triggered:           call `trigger()` on milestone (7, 21, 108 days)
 *                         for a larger single bloom + heavy haptic
 *
 * Returns an animated style suitable for a View's `transform`/`opacity`
 * plus a `trigger` function for milestone moments.
 */

import { useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface GoldenPulseOptions {
  /** Continuous breathing enabled on mount. @default true */
  readonly continuous?: boolean;
  /** Cycle duration for continuous mode (ms). @default 2000 */
  readonly cycleMs?: number;
  /** Whether the trigger() call fires a heavy haptic. @default true */
  readonly hapticOnTrigger?: boolean;
}

export function useGoldenPulse({
  continuous = true,
  cycleMs = 2000,
  hapticOnTrigger = true,
}: GoldenPulseOptions = {}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    if (!continuous) return;
    const half = cycleMs / 2;
    const easing = Easing.inOut(Easing.sin);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: half, easing }),
        withTiming(1, { duration: half, easing }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing }),
        withTiming(0.5, { duration: half, easing }),
      ),
      -1,
      false,
    );
  }, [continuous, cycleMs, scale, glow]);

  const trigger = useCallback(() => {
    if (hapticOnTrigger) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    scale.value = withSequence(
      withTiming(1.22, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 460, easing: Easing.inOut(Easing.sin) }),
    );
    glow.value = withSequence(
      withTiming(1.15, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withTiming(0.5, { duration: 460, easing: Easing.inOut(Easing.sin) }),
    );
  }, [hapticOnTrigger, scale, glow]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: Math.min(1, 0.55 + glow.value * 0.45),
  }));

  return { style, trigger };
}
