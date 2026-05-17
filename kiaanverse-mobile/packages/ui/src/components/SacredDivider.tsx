/**
 * SacredDivider — Horizontal divider with fading golden gradient.
 *
 * Replaces plain gray lines with a transparent → gold → transparent
 * gradient, evoking the sacred aesthetic of temple borders.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { gradients } from '../tokens/gradients';
import { spacing } from '../tokens/spacing';

export interface SacredDividerProps {
  /** Optional style override. */
  readonly style?: ViewStyle;
}

export function SacredDivider({ style }: SacredDividerProps): React.JSX.Element {
  const { isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';

  return (
    <LinearGradient
      colors={gradients.goldenDivider[mode] as unknown as string[]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.divider, style]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
});
