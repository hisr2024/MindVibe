/**
 * Themed TextInput with label and error support.
 */

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { textPresets } from '../tokens/typography';
import { colors } from '../tokens/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  style?: ViewStyle;
}

export function Input({
  label,
  error,
  style,
  ...props
}: InputProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: c.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.inputBackground,
            borderColor: error ? colors.semantic.error : c.inputBorder,
            color: c.textPrimary,
          },
        ]}
        placeholderTextColor={c.textTertiary}
        selectionColor={c.accent}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...textPresets.label,
  },
  input: {
    ...textPresets.body,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  error: {
    ...textPresets.caption,
    color: colors.semantic.error,
  },
});
