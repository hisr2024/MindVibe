/**
 * MinimumTouchable — Enforces WCAG 2.1 AA minimum touch target
 *
 * Wraps Pressable with enforced 44x44pt minimum touch area.
 * Uses hitSlop to expand the touchable area when the visual
 * element is smaller than the minimum.
 */

import React from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_TOUCH_SIZE = 44;
const DEFAULT_HIT_SLOP = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MinimumTouchableProps extends Omit<PressableProps, 'style'> {
  /** Minimum touch target size in points (default: 44) */
  minSize?: number;
  /** Style prop */
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MinimumTouchable({
  minSize = MIN_TOUCH_SIZE,
  style,
  hitSlop = DEFAULT_HIT_SLOP,
  ...props
}: MinimumTouchableProps) {
  return (
    <Pressable
      style={[{ minHeight: minSize, minWidth: minSize }, style]}
      hitSlop={hitSlop}
      {...props}
    />
  );
}

export default MinimumTouchable;
