/**
 * Themed Button with variant support and accessibility constraints.
 *
 * Enforces 44px minimum touch target (WCAG 2.1 AA).
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { typography } from '../tokens/typography';
import { accessibility } from '../tokens/motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps): React.JSX.Element {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle = getContainerStyle(variant, theme, isDisabled);
  const textStyle = getTextStyle(variant, theme);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#050507' : theme.accent}
        />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

function getContainerStyle(
  variant: ButtonVariant,
  theme: { accent: string; inputBackground: string; inputBorder: string },
  disabled: boolean,
): ViewStyle {
  const opacity = disabled ? 0.5 : 1;

  switch (variant) {
    case 'primary':
      return { backgroundColor: theme.accent, opacity };
    case 'secondary':
      return {
        backgroundColor: theme.inputBackground,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        opacity,
      };
    case 'ghost':
      return { backgroundColor: 'transparent', opacity };
  }
}

function getTextStyle(
  variant: ButtonVariant,
  theme: { accent: string; textPrimary: string },
): TextStyle {
  switch (variant) {
    case 'primary':
      return { color: '#050507' };
    case 'secondary':
      return { color: theme.textPrimary };
    case 'ghost':
      return { color: theme.accent };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: accessibility.minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    ...typography.label,
    fontWeight: '600',
  },
});
