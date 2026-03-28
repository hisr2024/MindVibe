/**
 * DivineGradient — Animated gradient background for sacred screens.
 *
 * Renders a full-screen gradient that slowly cross-fades between two
 * layered color sets, creating a meditative, breathing background.
 * Uses simple View overlays with animated opacity rather than requiring
 * expo-linear-gradient, keeping the dependency footprint minimal.
 *
 * Five variant presets map to the sacredGradients token palette:
 * peace, healing, release, renewal, divine.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { sacredGradients } from '../tokens/sacred';
import { duration } from '../tokens/motion';

/** Available gradient variant presets. */
export type DivineGradientVariant = 'peace' | 'healing' | 'release' | 'renewal' | 'divine';

/** Props for the DivineGradient component. */
export interface DivineGradientProps {
  /** Gradient color preset. @default 'divine' */
  readonly variant?: DivineGradientVariant;
  /** Content rendered on top of the gradient. */
  readonly children: React.ReactNode;
  /** Whether the cross-fade animation is active. @default true */
  readonly animated?: boolean;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Cross-fade cycle duration — uses the sacred timing for meditative feel. */
const CYCLE_DURATION = duration.sacred * 3; // ~3600ms per fade direction

function DivineGradientComponent({
  variant = 'divine',
  children,
  animated = true,
  style,
  testID,
}: DivineGradientProps): React.JSX.Element {
  const gradientColors = sacredGradients[variant];

  /**
   * We use three color layers stacked vertically to simulate a gradient.
   * Layer 0 = bottom (darkest), Layer 1 = middle, Layer 2 = top (brightest).
   * A secondary set of layers cross-fades on top for the animation.
   */
  const crossFadeOpacity = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      crossFadeOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, {
            duration: CYCLE_DURATION,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(0, {
            duration: CYCLE_DURATION,
            easing: Easing.inOut(Easing.sine),
          }),
        ),
        -1,
        false,
      );
    } else {
      crossFadeOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [animated, crossFadeOpacity]);

  const crossFadeStyle = useAnimatedStyle(() => ({
    opacity: crossFadeOpacity.value,
  }));

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Base gradient layers — three stacked color zones */}
      <View style={StyleSheet.absoluteFill}>
        {/* Bottom third: darkest color */}
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[0] },
          ]}
        />
        {/* Middle third: mid color */}
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[1], opacity: 0.7 },
          ]}
        />
        {/* Top third: brightest color */}
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[2], opacity: 0.3 },
          ]}
        />
      </View>

      {/* Cross-fade overlay — shifted color arrangement for the animated effect */}
      <Animated.View style={[StyleSheet.absoluteFill, crossFadeStyle]}>
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[1], opacity: 0.5 },
          ]}
        />
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[2], opacity: 0.4 },
          ]}
        />
        <View
          style={[
            styles.gradientLayer,
            { flex: 1, backgroundColor: gradientColors[0], opacity: 0.6 },
          ]}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/** Animated gradient background with sacred color presets for meditative screens. */
export const DivineGradient = React.memo(DivineGradientComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientLayer: {
    // Layers stack vertically to simulate a gradient
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});
