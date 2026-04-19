/**
 * SacredScrollView — ScrollView with a custom gold right-side indicator.
 *
 * Web parity:
 *   - Hides the default vertical scroll indicator.
 *   - Renders a 2px-wide gold bar on the right edge, opacity 0.3.
 *   - Indicator size + position track content offset and visible height
 *     via Reanimated shared values (driven from `useAnimatedScrollHandler`).
 *   - Android: `bounces={false}` (set by platform prop) — web doesn't bounce.
 *
 * The indicator fades in while the user scrolls and fades back out when
 * scrolling stops (matches Framer Motion's subtle fade on the web).
 */

import React, { forwardRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SWIFT, easeDivineOut } from './tokens';

const INDICATOR_WIDTH = 2;
const INDICATOR_COLOR = '#D4A017';
const INDICATOR_OPACITY = 0.3;
const INDICATOR_MIN_LENGTH = 24;
const INDICATOR_INSET = 2;

export interface SacredScrollViewProps extends ScrollViewProps {
  /** When false, the custom gold indicator is hidden. @default true */
  readonly showIndicator?: boolean;
  /** Optional style for the gold indicator overlay track. */
  readonly goldIndicatorStyle?: ViewStyle;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function SacredScrollViewInner(
  {
    children,
    showIndicator = true,
    goldIndicatorStyle,
    style,
    contentContainerStyle,
    onScroll,
    bounces,
    ...rest
  }: SacredScrollViewProps,
  ref: React.ForwardedRef<ScrollView>,
): React.JSX.Element {
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollY = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      indicatorOpacity.value = withTiming(INDICATOR_OPACITY, {
        duration: SWIFT,
        easing: easeDivineOut,
      });
    },
    onMomentumEnd: () => {
      indicatorOpacity.value = withTiming(0, {
        duration: SWIFT * 2,
        easing: easeDivineOut,
      });
    },
    onEndDrag: () => {
      indicatorOpacity.value = withTiming(0, {
        duration: SWIFT * 2,
        easing: easeDivineOut,
      });
    },
  });

  const onLayoutContainer = (e: LayoutChangeEvent): void => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (_: number, h: number): void => {
    setContentHeight(h);
  };

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    // No-scroll case: indicator has zero height → hide.
    if (contentHeight <= containerHeight || containerHeight === 0) {
      return {
        opacity: 0,
        height: 0,
        transform: [{ translateY: 0 }],
      };
    }

    const visibleRatio = containerHeight / contentHeight;
    const rawHeight = containerHeight * visibleRatio;
    const indicatorHeight = Math.max(INDICATOR_MIN_LENGTH, rawHeight);
    const maxScroll = contentHeight - containerHeight;
    const maxIndicatorTop = containerHeight - indicatorHeight - INDICATOR_INSET * 2;
    const progress = maxScroll > 0 ? scrollY.value / maxScroll : 0;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const translateY = clampedProgress * maxIndicatorTop;

    return {
      opacity: indicatorOpacity.value,
      height: indicatorHeight,
      transform: [{ translateY }],
    };
  });

  // Android: web doesn't overscroll-bounce; iOS keeps its native bounce unless
  // caller explicitly opts in via prop.
  const resolvedBounces = bounces ?? Platform.OS !== 'android';

  return (
    <View style={[styles.wrap, style]} onLayout={onLayoutContainer}>
      <AnimatedScrollView
        ref={ref}
        {...rest}
        style={styles.inner}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        bounces={resolvedBounces}
        onScroll={onScroll ?? handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
      >
        {children}
      </AnimatedScrollView>

      {showIndicator ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              top: INDICATOR_INSET,
              right: INDICATOR_INSET,
              width: INDICATOR_WIDTH,
              backgroundColor: INDICATOR_COLOR,
              borderRadius: INDICATOR_WIDTH / 2,
            },
            indicatorAnimatedStyle,
            goldIndicatorStyle,
          ]}
        />
      ) : null}
    </View>
  );
}

/** ScrollView with a custom 2px gold indicator pinned to the right edge. */
export const SacredScrollView = forwardRef<ScrollView, SacredScrollViewProps>(
  SacredScrollViewInner,
);

SacredScrollView.displayName = 'SacredScrollView';

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    position: 'relative',
  },
  inner: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
  },
});
