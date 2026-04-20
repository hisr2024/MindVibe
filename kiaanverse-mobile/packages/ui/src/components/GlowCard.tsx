/**
 * GlowCard — Card with golden glow effects for divine UI moments.
 *
 * Variants:
 * - default: Standard card with subtle gold border (same as Card)
 * - golden: Enhanced card with golden shadow glow
 * - divine: Breathing golden aura via animated shadowOpacity
 * - sacred: Intensified glow for featured/highlighted content
 *
 * Performance: Divine variant uses Reanimated worklet for 60fps glow.
 */

import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { shadows } from '../tokens/shadows';
import { duration } from '../tokens/motion';
import { colors } from '../tokens/colors';

export type GlowCardVariant = 'default' | 'golden' | 'divine' | 'sacred';

export interface GlowCardProps {
  readonly children: React.ReactNode;
  /** Visual variant. @default 'default' */
  readonly variant?: GlowCardVariant;
  /** Optional style override. */
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

function GlowCardInner({
  children,
  variant = 'default',
  style,
  testID,
}: GlowCardProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  // Divine breathing glow
  const glowOpacity = useSharedValue(variant === 'divine' ? 0.2 : 0);

  useEffect(() => {
    if (variant === 'divine') {
      // Reanimated shared-value mutation — idiomatic worklet pattern.
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: duration.sacred * 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: duration.sacred * 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [variant, glowOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    if (variant !== 'divine') return {};
    return { shadowOpacity: glowOpacity.value };
  });

  // Variant-specific styles
  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'golden':
        return {
          ...shadows.glow,
          borderColor: colors.alpha.goldMedium,
          borderWidth: 1,
        };
      case 'divine':
        return {
          shadowColor: colors.divine.aura,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 20,
          elevation: 8,
          borderColor: colors.alpha.goldStrong,
          borderWidth: 1.5,
        };
      case 'sacred':
        return {
          ...shadows.glowStrong,
          borderColor: colors.primary[500],
          borderWidth: 1.5,
        };
      default:
        return {
          ...shadows.sm,
          borderColor: c.cardBorder,
          borderWidth: 1,
        };
    }
  })();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: c.card },
        variantStyle,
        variant === 'divine' ? animatedGlowStyle : undefined,
        style,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

export const GlowCard = React.memo(GlowCardInner);

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
