/**
 * useSacredPress — Unified Pressable animation + haptic feedback.
 *
 * Web parity:
 *   scale: 1.0 → 0.96 on press-in, back to 1.0 on press-out.
 *   Duration: SWIFT (180ms).
 *   Easing in:  ease-divine-in (soft attack).
 *   Easing out: ease-divine-out (rounded release).
 *   Haptic: ImpactFeedbackStyle.Light fires on press start.
 *
 * Returns an `animatedStyle` to apply to the pressable target and a
 * `pressHandlers` object to spread onto a Pressable or a custom
 * gesture-driven wrapper.
 *
 * Usage:
 *   const { animatedStyle, pressHandlers } = useSacredPress();
 *   return (
 *     <AnimatedPressable {...pressHandlers} style={animatedStyle}>
 *       ...
 *     </AnimatedPressable>
 *   );
 */

import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ViewStyle } from 'react-native';
import {
  PRESS_SCALE,
  SWIFT,
  easeDivineIn,
  easeDivineOut,
} from './tokens';

export type HapticStyle =
  | 'Light'
  | 'Medium'
  | 'Heavy'
  | 'None';

export interface UseSacredPressOptions {
  /** Haptic intensity on press start. @default 'Light' */
  readonly haptic?: HapticStyle;
  /** Target scale at press-in. @default 0.96 */
  readonly pressScale?: number;
  /** Disable haptic + scale interaction. @default false */
  readonly disabled?: boolean;
}

export interface SacredPressHandlers {
  readonly onPressIn: () => void;
  readonly onPressOut: () => void;
}

export interface UseSacredPressResult {
  readonly animatedStyle: AnimatedStyle<ViewStyle>;
  readonly pressHandlers: SacredPressHandlers;
}

function mapImpact(style: HapticStyle): Haptics.ImpactFeedbackStyle | null {
  switch (style) {
    case 'Light':
      return Haptics.ImpactFeedbackStyle.Light;
    case 'Medium':
      return Haptics.ImpactFeedbackStyle.Medium;
    case 'Heavy':
      return Haptics.ImpactFeedbackStyle.Heavy;
    case 'None':
      return null;
  }
}

export function useSacredPress(
  options: UseSacredPressOptions = {},
): UseSacredPressResult {
  const {
    haptic = 'Light',
    pressScale = PRESS_SCALE,
    disabled = false,
  } = options;

  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withTiming(pressScale, {
      duration: SWIFT,
      easing: easeDivineIn,
    });
    const impact = mapImpact(haptic);
    if (impact !== null) {
      void Haptics.impactAsync(impact).catch(() => {
        // Haptics unavailable (tests, web) — ignore.
      });
    }
  }, [disabled, haptic, pressScale, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: SWIFT,
      easing: easeDivineOut,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    pressHandlers: { onPressIn, onPressOut },
  };
}
