/**
 * SacredScrollView — ScrollView with a custom gold right-side indicator
 * and an overscroll flash at the top / bottom edges.
 *
 * Web parity:
 *   - Hides the default vertical scroll indicator.
 *   - Renders a 2px-wide gold bar on the right edge, opacity 0.3.
 *   - Indicator size + position track content offset and visible height
 *     via Reanimated shared values (driven from `useAnimatedScrollHandler`).
 *   - Android: `bounces={false}` (set by platform prop) — web doesn't bounce.
 *   - Overscroll: when the user pulls past a content boundary, a gentle
 *     gold flash (opacity 0 → 0.1 → 0) blooms at the edge as a visual
 *     acknowledgement of the gesture — no bounce required.
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
import { LinearGradient } from 'expo-linear-gradient';
import { SWIFT, easeDivineOut } from './tokens';

const INDICATOR_WIDTH = 2;
const INDICATOR_COLOR = '#D4A017';
const INDICATOR_OPACITY = 0.3;
const INDICATOR_MIN_LENGTH = 24;
const INDICATOR_INSET = 2;

/** Overscroll flash tunables. */
const OVERSCROLL_FLASH_PEAK = 0.1;
const OVERSCROLL_FLASH_HEIGHT = 48;
const OVERSCROLL_FLASH_IN_MS = 120;
const OVERSCROLL_FLASH_OUT_MS = 420;
/** Pull threshold (px) before the flash triggers on drag. */
const OVERSCROLL_FLASH_THRESHOLD = 8;

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

  /** Overscroll flash drivers (top + bottom edges). */
  const topFlashOpacity = useSharedValue(0);
  const bottomFlashOpacity = useSharedValue(0);

  /**
   * Internal flash triggers — debounced via a `fired` flag so the
   * flash only runs once per overscroll gesture, not every frame of the
   * pull. Reset on drag/momentum end or when the user scrolls back
   * into range.
   */
  const topFlashFired = useSharedValue(0);
  const bottomFlashFired = useSharedValue(0);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const viewport = event.layoutMeasurement.height;
      const content = event.contentSize.height;
      scrollY.value = y;
      indicatorOpacity.value = withTiming(INDICATOR_OPACITY, {
        duration: SWIFT,
        easing: easeDivineOut,
      });

      // Top overscroll — user has pulled past y=0 by at least the
      // threshold (iOS bounce, or Android with overScrollMode="always").
      if (y < -OVERSCROLL_FLASH_THRESHOLD) {
        if (topFlashFired.value === 0) {
          topFlashFired.value = 1;
          topFlashOpacity.value = withTiming(
            OVERSCROLL_FLASH_PEAK,
            { duration: OVERSCROLL_FLASH_IN_MS, easing: easeDivineOut },
            (finished) => {
              'worklet';
              if (!finished) return;
              topFlashOpacity.value = withTiming(0, {
                duration: OVERSCROLL_FLASH_OUT_MS,
                easing: easeDivineOut,
              });
            },
          );
        }
      } else if (y >= 0) {
        topFlashFired.value = 0;
      }

      // Bottom overscroll — content + offset exceeds viewport + threshold.
      const bottomExcess = y + viewport - content;
      if (bottomExcess > OVERSCROLL_FLASH_THRESHOLD) {
        if (bottomFlashFired.value === 0) {
          bottomFlashFired.value = 1;
          bottomFlashOpacity.value = withTiming(
            OVERSCROLL_FLASH_PEAK,
            { duration: OVERSCROLL_FLASH_IN_MS, easing: easeDivineOut },
            (finished) => {
              'worklet';
              if (!finished) return;
              bottomFlashOpacity.value = withTiming(0, {
                duration: OVERSCROLL_FLASH_OUT_MS,
                easing: easeDivineOut,
              });
            },
          );
        }
      } else if (bottomExcess <= 0) {
        bottomFlashFired.value = 0;
      }
    },
    onMomentumEnd: () => {
      indicatorOpacity.value = withTiming(0, {
        duration: SWIFT * 2,
        easing: easeDivineOut,
      });
      topFlashFired.value = 0;
      bottomFlashFired.value = 0;
    },
    onEndDrag: () => {
      indicatorOpacity.value = withTiming(0, {
        duration: SWIFT * 2,
        easing: easeDivineOut,
      });
      topFlashFired.value = 0;
      bottomFlashFired.value = 0;
    },
  });

  const onLayoutContainer = (e: LayoutChangeEvent): void => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (_: number, h: number): void => {
    setContentHeight(h);
  };

  const topFlashStyle = useAnimatedStyle(() => ({
    opacity: topFlashOpacity.value,
  }));

  const bottomFlashStyle = useAnimatedStyle(() => ({
    opacity: bottomFlashOpacity.value,
  }));

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
        // Android: enable the native over-scroll so the animated handler
        // actually receives `contentOffset.y < 0` on pull. iOS honors
        // bounce natively; Android needs this flag otherwise the runtime
        // clamps the offset at 0 and the flash effect never fires.
        overScrollMode={
          rest.overScrollMode ??
          (Platform.OS === 'android' ? 'always' : undefined)
        }
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

      {/* Gold overscroll flash — top edge. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashTop, topFlashStyle]}
      >
        <LinearGradient
          colors={[
            'rgba(212,160,23,0.6)',
            'rgba(212,160,23,0)',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Gold overscroll flash — bottom edge. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashBottom, bottomFlashStyle]}
      >
        <LinearGradient
          colors={[
            'rgba(212,160,23,0)',
            'rgba(212,160,23,0.6)',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
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
  flashTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: OVERSCROLL_FLASH_HEIGHT,
  },
  flashBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: OVERSCROLL_FLASH_HEIGHT,
  },
});
