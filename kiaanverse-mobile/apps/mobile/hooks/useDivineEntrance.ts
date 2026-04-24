/**
 * useDivineEntrance — staggered ceremonial entrance for Home sections.
 *
 * Mirrors the web dashboard's container + itemVariants cascade. Each
 * consumer chooses an index and the hook returns an animated style that
 * fades in, rises 14px, and scales from 0.97 → 1.0 with spring-ish easing.
 * Stagger defaults to 150ms so the cascade feels deliberate but never slow.
 */

import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export interface DivineEntranceOptions {
  /** Section index — 0-based. Stagger is (index * staggerMs). */
  readonly index?: number;
  /** Additional delay before the cascade begins. @default 80 */
  readonly baseDelayMs?: number;
  /** Gap between consecutive sections. @default 150 */
  readonly staggerMs?: number;
  /** Animation duration. @default 520 */
  readonly durationMs?: number;
}

export function useDivineEntrance({
  index = 0,
  baseDelayMs = 80,
  staggerMs = 150,
  durationMs = 520,
}: DivineEntranceOptions = {}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const scale = useSharedValue(0.97);

  useEffect(() => {
    const delay = baseDelayMs + index * staggerMs;
    const easing = Easing.out(Easing.cubic);

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: durationMs, easing })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: durationMs, easing })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: durationMs, easing })
    );
  }, [index, baseDelayMs, staggerMs, durationMs, opacity, translateY, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return style;
}
