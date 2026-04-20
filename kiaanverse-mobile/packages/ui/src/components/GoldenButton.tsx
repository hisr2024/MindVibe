/**
 * GoldenButton — Premium animated CTA button for the Kiaanverse.
 *
 * Four variants for different levels of visual prominence:
 * - primary: Solid gold fill — hero actions ("Start Journey", "Begin Meditation")
 * - secondary: Gold outlined — secondary actions
 * - ghost: Transparent — tertiary / inline actions
 * - divine: Pulsing aura glow — transcendent moments ("Unlock Wisdom")
 *
 * Animations: Reanimated spring scale on press, haptic feedback,
 * divine variant gets a breathing glow via shadow opacity oscillation.
 */

import React, { useCallback, useEffect } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { textPresets } from '../tokens/typography';
import { duration, spring, accessibility } from '../tokens/motion';

/** Visual style variant for the button. */
export type GoldenButtonVariant = 'primary' | 'secondary' | 'ghost' | 'divine';

/** Props for the GoldenButton component. */
export interface GoldenButtonProps {
  /** Button label text. */
  readonly title: string;
  /** Press handler — not called when disabled or loading. */
  readonly onPress: () => void;
  /** Visual variant. @default 'primary' */
  readonly variant?: GoldenButtonVariant;
  /** Show a loading spinner instead of text. @default false */
  readonly loading?: boolean;
  /** Disable interaction and dim the button. @default false */
  readonly disabled?: boolean;
  /** Optional style override for the outer container. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing frameworks. */
  readonly testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoldenButtonInner({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  testID,
}: GoldenButtonProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const isDisabled = disabled || loading;

  // --- Spring scale animation ---
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    // Reanimated shared-value mutation — idiomatic worklet pattern.
    scale.value = withSpring(0.96, spring.default);
    if (!isDisabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [scale, isDisabled]);

  const handlePressOut = useCallback(() => {
    // Reanimated shared-value mutation — idiomatic worklet pattern.
    scale.value = withSpring(1, spring.default);
  }, [scale]);

  // --- Divine aura glow animation ---
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (variant === 'divine') {
      // Reanimated shared-value mutation — idiomatic worklet pattern.
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
       
      glowOpacity.value = 0;
    }
  }, [variant, glowOpacity]);

  const divineGlowStyle = useAnimatedStyle(() => {
    if (variant !== 'divine') return {};
    return {
      shadowOpacity: glowOpacity.value,
    };
  });

  // --- Variant-resolved styles ---
  const containerVariantStyle: ViewStyle = (() => {
    const opacity = isDisabled ? 0.5 : 1;
    switch (variant) {
      case 'primary':
        return { backgroundColor: c.accent, opacity };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: c.accent,
          opacity,
        };
      case 'ghost':
        return { backgroundColor: 'transparent', opacity };
      case 'divine':
        return {
          backgroundColor: c.accent,
          shadowColor: theme.palette.divine.aura,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 24,
          elevation: 12,
          opacity,
        };
    }
  })();

  const textColor: string = (() => {
    switch (variant) {
      case 'primary':
      case 'divine':
        return c.background;
      case 'secondary':
        return c.accent;
      case 'ghost':
        return c.accent;
    }
  })();

  const spinnerColor = variant === 'primary' || variant === 'divine'
    ? c.background
    : c.accent;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        containerVariantStyle,
        animatedStyle,
        variant === 'divine' ? divineGlowStyle : undefined,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

/** Premium animated button with spring press, haptic feedback, and divine aura variant. */
export const GoldenButton = React.memo(GoldenButtonInner);

const styles = StyleSheet.create({
  base: {
    minHeight: accessibility.minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    ...textPresets.label,
    fontWeight: '600',
  },
});
