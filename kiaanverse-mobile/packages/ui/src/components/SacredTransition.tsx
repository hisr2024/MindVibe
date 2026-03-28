/**
 * SacredTransition — Page transition wrapper with sacred animation.
 *
 * Wraps children in an Animated.View that fades in with a gentle scale-up
 * (0.95 -> 1.0) on enter, and fades out with a scale-down (1.0 -> 0.95)
 * on exit. Uses Reanimated spring physics for a natural, organic feel.
 *
 * Designed as a simple visibility toggle — mount when isVisible transitions
 * to true, and the component handles the enter/exit choreography.
 */

import React, { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { spring as springPresets, duration } from '../tokens/motion';

/** Props for the SacredTransition component. */
export interface SacredTransitionProps {
  /** Content to wrap with the transition animation. */
  readonly children: React.ReactNode;
  /** Whether the content should be visible. */
  readonly isVisible: boolean;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Scale values for enter and exit states. */
const SCALE_HIDDEN = 0.95;
const SCALE_VISIBLE = 1.0;

function SacredTransitionComponent({
  children,
  isVisible,
  style,
  testID,
}: SacredTransitionProps): React.JSX.Element {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(isVisible ? SCALE_VISIBLE : SCALE_HIDDEN);

  useEffect(() => {
    if (isVisible) {
      // Entering: fade in + scale up with spring
      opacity.value = withTiming(1, {
        duration: duration.slow,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withSpring(SCALE_VISIBLE, springPresets.default);
    } else {
      // Exiting: fade out + scale down
      opacity.value = withTiming(0, {
        duration: duration.normal,
        easing: Easing.in(Easing.ease),
      });
      scale.value = withTiming(SCALE_HIDDEN, {
        duration: duration.normal,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isVisible, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle, style]}
      testID={testID}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

/** Page transition wrapper with fade + scale spring animation. */
export const SacredTransition = React.memo(SacredTransitionComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
