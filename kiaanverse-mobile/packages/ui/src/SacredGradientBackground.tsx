/**
 * SacredGradientBackground — The cosmos gradient.
 *
 * Full-screen, three-stop vertical gradient that is the bedrock of every
 * Kiaanverse screen:
 *
 *     #050714 (top)  →  #0B0E2A (mid)  →  #050714 (bottom)
 *
 * Kept deliberately minimal — no animation, no logic. It is the canvas
 * on which everything else (particles, mandalas, content) is painted.
 * The gradient never intercepts touch and never re-renders unless the
 * theme colors themselves change.
 *
 * Typically mounted by DivineScreenWrapper; can be used standalone for
 * screens that want the gradient without the particle field.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  cosmosGradient,
  cosmosGradientLocations,
} from '@kiaanverse/theme';

export interface SacredGradientBackgroundProps {
  /**
   * Optional style override. Use with care — the default is
   * `StyleSheet.absoluteFill` which is the intended behavior.
   */
  readonly style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

function SacredGradientBackgroundInner({
  style,
}: SacredGradientBackgroundProps): React.JSX.Element {
  return (
    <LinearGradient
      // LinearGradient's `colors` typing wants a mutable string[]; our
      // theme token is `readonly`, so spread into a fresh tuple.
      colors={[...cosmosGradient]}
      locations={[...cosmosGradientLocations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}

export const SacredGradientBackground = React.memo(SacredGradientBackgroundInner);
