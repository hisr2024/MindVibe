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
import type { ThemeColors } from '../theme/types';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { textPresets } from '../tokens/typography';
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
  const c = theme.colors;

  const containerStyle = getContainerStyle(variant, c, isDisabled);
  const labelStyle = getTextStyle(variant, c);

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
          color={variant === 'primary' ? theme.palette.background.dark : c.accent}
        />
      ) : (
        <Text style={[styles.text, labelStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

function getContainerStyle(
  variant: ButtonVariant,
  c: ThemeColors,
  disabled: boolean,
): ViewStyle {
  const opacity = disabled ? 0.5 : 1;

  switch (variant) {
    case 'primary':
      return { backgroundColor: c.accent, opacity };
    case 'secondary':
      return {
        backgroundColor: c.inputBackground,
        borderWidth: 1,
        borderColor: c.inputBorder,
        opacity,
      };
    case 'ghost':
      return { backgroundColor: 'transparent', opacity };
  }
}

function getTextStyle(
  variant: ButtonVariant,
  c: ThemeColors,
): TextStyle {
  switch (variant) {
    case 'primary':
      return { color: c.background };
    case 'secondary':
      return { color: c.textPrimary };
    case 'ghost':
      return { color: c.accent };
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
    ...textPresets.label,
    fontWeight: '600',
  },
});
