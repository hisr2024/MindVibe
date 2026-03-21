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
import { typography } from '../tokens/typography';
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

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? colors.semantic.error : theme.inputBorder,
            color: theme.textPrimary,
          },
        ]}
        placeholderTextColor={theme.textTertiary}
        selectionColor={theme.accent}
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
    ...typography.label,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  error: {
    ...typography.caption,
    color: colors.semantic.error,
  },
});
