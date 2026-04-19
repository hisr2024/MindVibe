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
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
import { gradients } from '../tokens/gradients';
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
  const { isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';

  // Breathing aura opacity
  const auraOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (disableAura) return;
    // eslint-disable-next-line react-hooks/immutability
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

  // Select gradient colors based on variant
  const bgColors = gradients.cosmicBackground[mode];
  const auraColors = variant === 'warm'
    ? gradients.peacockSheen[mode]
    : gradients.divineAura[mode];

  return (
    <View style={[styles.container, style]}>
      {/* Base cosmic gradient */}
      <LinearGradient
        colors={bgColors as unknown as string[]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Breathing divine aura at top */}
      {!disableAura && (
        <Animated.View style={[styles.auraContainer, auraStyle]}>
          <LinearGradient
            colors={auraColors as unknown as string[]}
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
