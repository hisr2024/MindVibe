/**
 * Horizontal divider with theme color.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';

interface DividerProps {
  style?: ViewStyle;
}

export function Divider({ style }: DividerProps): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.divider, { backgroundColor: theme.colors.divider }, style]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
});
