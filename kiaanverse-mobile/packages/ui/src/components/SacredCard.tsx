/**
 * SacredCard — The cornerstone surface of the Kiaanverse UI.
 *
 * Web parity:
 * - 1px outer border in rgba(212, 160, 23, 0.12).
 * - A separate 2px gold shimmer strip along the top edge
 *   (does NOT use overflow: hidden so the shimmer cannot be clipped).
 * - Indigo gradient body ['rgba(22,26,66,0.95)','rgba(17,20,53,0.98)'].
 * - BorderRadius 20 (matches web border-radius: 20px).
 * - CARD shadow by default; optional DIVINE aura glow when `glowing`.
 * - Pressable variant that scales 0.97 → 1.0 on press (Reanimated, 180ms).
 *
 * Composition rule: the top shimmer is rendered as a sibling of the body
 * (absolutely positioned) rather than a child of a clipped container,
 * guaranteeing the gold edge is always visible.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

/** Sacred body gradient — parity with web indigo glass surface. */
const SACRED_CARD_BODY = [
  'rgba(22, 26, 66, 0.95)',
  'rgba(17, 20, 53, 0.98)',
] as const;

/** Top shimmer strip — horizontal gold edge, never clipped. */
const SACRED_TOP_SHIMMER = [
  'rgba(212, 160, 23, 0)',
  'rgba(240, 192, 64, 0.9)',
  'rgba(212, 160, 23, 0)',
] as const;

const SACRED_BORDER_COLOR = 'rgba(212, 160, 23, 0.12)';
const SACRED_RADIUS = 20;
const TOP_SHIMMER_HEIGHT = 2;
const PRESS_SCALE = 0.97;
const PRESS_DURATION_MS = 180;

/** Divine-out easing (matches web cubic-bezier). */
const easeDivineOut = Easing.bezier(0.16, 1, 0.3, 1);

export interface SacredCardProps {
  /** Card content. */
  readonly children?: React.ReactNode;
  /** Render a divine aura glow around the card. @default false */
  readonly glowing?: boolean;
  /** When set, renders as a Pressable with scale-on-press and calls onPress. */
  readonly onPress?: ((event: GestureResponderEvent) => void) | undefined;
  /** Disable the Pressable variant's interaction. @default false */
  readonly disabled?: boolean;
  /** Optional style override for the outer card surface. */
  readonly style?: ViewStyle;
  /** Optional style override for the inner content wrapper. */
  readonly contentStyle?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
  /** Accessibility label (Pressable variant). */
  readonly accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SacredCardInner({
  children,
  glowing = false,
  onPress,
  disabled = false,
  style,
  contentStyle,
  testID,
  accessibilityLabel,
}: SacredCardProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(PRESS_SCALE, {
      duration: PRESS_DURATION_MS,
      easing: easeDivineOut,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: PRESS_DURATION_MS,
      easing: easeDivineOut,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle: ViewStyle = glowing
    ? {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 24,
        shadowOpacity: 0.35,
        elevation: 14,
      }
    : styles.cardShadow;

  const surface = (
    <>
      {/* Gold top shimmer — sibling of body to avoid clipping. */}
      <LinearGradient
        colors={SACRED_TOP_SHIMMER as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topShimmer}
        pointerEvents="none"
      />
      {/* Indigo body gradient. */}
      <LinearGradient
        colors={SACRED_CARD_BODY as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.body, contentStyle]}
      >
        {children}
      </LinearGradient>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        testID={testID}
        style={[styles.container, glowStyle, animatedStyle, style]}
      >
        {surface}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[styles.container, glowStyle, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {surface}
    </View>
  );
}

/** Sacred surface with gold top shimmer, indigo body, divine shadow. */
export const SacredCard = React.memo(SacredCardInner);

const styles = StyleSheet.create({
  container: {
    borderRadius: SACRED_RADIUS,
    borderWidth: 1,
    borderColor: SACRED_BORDER_COLOR,
    backgroundColor: 'rgba(17, 20, 53, 0.98)',
    position: 'relative',
  },
  body: {
    borderRadius: SACRED_RADIUS,
    padding: 20,
    overflow: 'hidden',
  },
  topShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_SHIMMER_HEIGHT,
    borderTopLeftRadius: SACRED_RADIUS,
    borderTopRightRadius: SACRED_RADIUS,
    zIndex: 2,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
});
