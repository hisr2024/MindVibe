/**
 * useDivineEntrance — Screen/card entrance hook.
 *
 * Web parity:
 *   opacity: 0 → 1
 *   translateY: 16 → 0
 *   Duration: DIVINE (320ms) for screens, NATURAL (320ms) for cards.
 *   Easing: lotus-bloom.
 *
 * Supports an optional delay for stagger sequences (e.g., list of cards
 * each offset by 60–80ms). Respects AccessibilityInfo.isReduceMotionEnabled
 * — if enabled, the final resting state is applied instantly.
 *
 * Usage:
 *   const { animatedStyle } = useDivineEntrance({ delay: index * 60 });
 *   return <Animated.View style={animatedStyle}>...</Animated.View>;
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import {
  DIVINE,
  ENTRANCE_TRANSLATE_Y,
  easeLotusBloom,
} from './tokens';

export interface UseDivineEntranceOptions {
  /** Delay (ms) before the entrance begins — used for staggered lists. @default 0 */
  readonly delay?: number;
  /** Override duration (ms). @default DIVINE (320ms) */
  readonly duration?: number;
  /** Starting translateY offset (px). @default 16 */
  readonly translateY?: number;
  /** Disable the entrance and render at rest immediately. @default false */
  readonly disabled?: boolean;
}

export interface UseDivineEntranceResult {
  /** Style to apply to the Animated.View wrapper. */
  readonly animatedStyle: AnimatedStyle<ViewStyle>;
}

export function useDivineEntrance(
  options: UseDivineEntranceOptions = {},
): UseDivineEntranceResult {
  const {
    delay = 0,
    duration = DIVINE,
    translateY: translateFrom = ENTRANCE_TRANSLATE_Y,
    disabled = false,
  } = options;

  const opacity = useSharedValue(disabled ? 1 : 0);
  const translateY = useSharedValue(disabled ? 0 : translateFrom);

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduceMotion(enabled);
      })
      .catch(() => {
        // Platform query failed — assume animations allowed.
      });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (disabled || reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = translateFrom;

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: easeLotusBloom }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: easeLotusBloom }),
    );
  }, [delay, disabled, duration, opacity, reduceMotion, translateFrom, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle };
}
