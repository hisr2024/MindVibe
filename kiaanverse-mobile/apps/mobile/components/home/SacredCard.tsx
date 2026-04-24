/**
 * SacredCard — the divine container used everywhere on the Home screen.
 *
 * Gold-alpha border, deep-navy fill, soft inset golden glow. Compact
 * variant trims padding for the mood strip. Pressable variant adds a
 * subtle scale-down on press so every interaction feels intentional.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
  type AccessibilityRole,
  type AccessibilityProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing } from '@kiaanverse/ui';

export interface SacredCardProps extends AccessibilityProps {
  readonly children: React.ReactNode;
  /** Compact variant = smaller padding (used in the mood strip). */
  readonly compact?: boolean | undefined;
  /** Stretch to full container width. */
  readonly fullWidth?: boolean | undefined;
  /** When set, card becomes pressable. */
  readonly onPress?: (() => void) | undefined;
  /** Add a gold accent border (e.g. selected mood). */
  readonly selected?: boolean | undefined;
  /** Optional container style override. */
  readonly style?: ViewStyle | undefined;
  readonly accessibilityRole?: AccessibilityRole | undefined;
}

export function SacredCard({
  children,
  compact = false,
  fullWidth = false,
  onPress,
  selected = false,
  style,
  accessibilityRole,
  ...a11y
}: SacredCardProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const card = (
    <Animated.View
      style={[
        styles.card,
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        selected && styles.selected,
        style,
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) {
    return (
      <View accessibilityRole={accessibilityRole} {...a11y}>
        {card}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      {...a11y}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, {
          duration: 120,
          easing: Easing.out(Easing.quad),
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  compact: {
    padding: spacing.sm,
    borderRadius: 14,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  selected: {
    borderWidth: 1.5,
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
});
