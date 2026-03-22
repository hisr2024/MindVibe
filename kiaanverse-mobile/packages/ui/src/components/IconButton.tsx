/**
 * Pressable icon button with 44px minimum touch target.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { accessibility } from '../tokens/motion';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: accessibility.minTouchTarget,
    minHeight: accessibility.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
