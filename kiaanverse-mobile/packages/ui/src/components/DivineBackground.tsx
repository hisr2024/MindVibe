/**
 * DivineBackground — Cosmic gradient backdrop with animated golden aura.
 *
 * Renders a full-screen vertical gradient (dark → surface) behind content,
 * with an optional breathing golden orb at the top that pulses gently.
 * This transforms flat screens into immersive, temple-like environments.
 *
 * Variants:
 * - cosmic: Deep navy gradient (default — most screens)
 * - sacred: Golden-accented top glow (onboarding, special moments)
 * - warm: Softer peacock-tinted gradient (wellness screens)
 *
 * Performance: All animations run on the UI thread via Reanimated worklets.
 */

import React, { useEffect } from 'react';
import {
  type ColorValue, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { duration } from '../tokens/motion';

export type DivineBackgroundVariant = 'cosmic' | 'sacred' | 'warm';

export interface DivineBackgroundProps {
  /** Visual variant. @default 'cosmic' */
  readonly variant?: DivineBackgroundVariant;
  /** Disable the breathing aura animation. @default false */
  readonly disableAura?: boolean;
  /** Optional style override for the container. */
  readonly style?: StyleProp<ViewStyle>;
  readonly children: React.ReactNode;
}

const SACRED_DURATION = duration.sacred * 2.5; // ~3s breathing cycle

function DivineBackgroundInner({
  variant = 'cosmic',
  disableAura = false,
  style,
  children,
}: DivineBackgroundProps): React.JSX.Element {
  const { theme, isDark } = useTheme();
  const scheme = theme.colorScheme;

  // Breathing aura opacity
  const auraOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (disableAura) return;
    // Reanimated shared-value mutation — idiomatic worklet pattern.
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SACRED_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: SACRED_DURATION, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [disableAura, auraOpacity]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
  }));

  // Light mode keeps a warm cream backdrop regardless of the picked palette
  // (palettes are designed for the cosmic/dark side of the app). Dark mode
  // uses the active sacred color scheme — Indigo, Maroon, Forest, or Black/Gold.
  const bgColors: readonly string[] = isDark
    ? scheme.bg.gradient
    : ['#FAF7F2', '#F5F0E8', '#EDE8DC'];

  // The aura tints the top breathing glow toward the palette's primary mood.
  // 'sacred' variant biases the aura toward divine gold for a temple feel,
  // while 'warm' and 'cosmic' use the palette's own aura ramp.
  const auraColors: readonly string[] =
    variant === 'sacred'
      ? [scheme.accent.divine + '55', scheme.accent.divine + '22', 'transparent']
      : [scheme.aura[0], scheme.aura[1], scheme.aura[2]];

  return (
    <View style={[styles.container, style]}>
      {/* Base cosmic gradient */}
      <LinearGradient
        colors={bgColors as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Breathing divine aura at top */}
      {!disableAura && (
        <Animated.View style={[styles.auraContainer, auraStyle]}>
          <LinearGradient
            colors={auraColors as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
            locations={variant === 'sacred' ? [0, 0.4, 1] : [0, 0.3, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.auraGradient}
          />
        </Animated.View>
      )}

      {/* Content */}
      {children}
    </View>
  );
}

export const DivineBackground = React.memo(DivineBackgroundInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  auraContainer: {
    ...StyleSheet.absoluteFillObject,
    height: 320,
  },
  auraGradient: {
    flex: 1,
  },
});
