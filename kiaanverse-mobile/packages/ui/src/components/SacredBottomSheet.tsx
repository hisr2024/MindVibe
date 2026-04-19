/**
 * SacredBottomSheet — Bottom sheet modal with sacred styling and gesture handling.
 *
 * Slides up from the bottom with a spring animation. Supports snap points,
 * a pan gesture to drag, and a semi-transparent backdrop that dismisses on tap.
 * Golden handle bar at top, dark card background.
 */

import React, { useCallback, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { spring as springPresets, duration } from '../tokens/motion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Props for the SacredBottomSheet component. */
export interface SacredBottomSheetProps {
  /** Whether the bottom sheet is visible. */
  readonly isVisible: boolean;
  /** Called when the sheet should close (backdrop tap or drag dismiss). */
  readonly onClose: () => void;
  /** Array of snap point heights in points (e.g. [300, 500]). @default [SCREEN_HEIGHT * 0.4] */
  readonly snapPoints?: number[];
  /** Content rendered inside the sheet. */
  readonly children: React.ReactNode;
  /** Optional container style override for the sheet body. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Height of the golden drag handle. */
const HANDLE_HEIGHT = 24;
/** Minimum velocity (points/sec) to trigger a dismiss. */
const DISMISS_VELOCITY = 500;

function SacredBottomSheetComponent({
  isVisible,
  onClose,
  snapPoints = [SCREEN_HEIGHT * 0.4],
  children,
  style,
  testID,
}: SacredBottomSheetProps): React.JSX.Element | null {
  /** Sorted snap points ascending — first is smallest sheet, last is tallest. */
  const sortedSnaps = [...snapPoints].sort((a, b) => a - b);
  // `sortedSnaps` is guaranteed non-empty because snapPoints defaults to a
  // single-item array and the prop is typed `number[]`, but TypeScript's
  // `noUncheckedIndexedAccess` can't prove that — fall back to SCREEN_HEIGHT/2.
  const maxHeight: number = sortedSnaps[sortedSnaps.length - 1] ?? SCREEN_HEIGHT / 2;

  /** translateY: 0 = fully open (at maxHeight), maxHeight = fully closed. */
  const translateY = useSharedValue<number>(maxHeight);
  const backdropOpacity = useSharedValue<number>(0);
  const contextY = useSharedValue<number>(0);

  const close = useCallback(() => {
    translateY.value = withSpring(maxHeight, springPresets.sheet);
    backdropOpacity.value = withTiming(0, { duration: duration.normal });
    // Allow the animation to settle before calling onClose
    setTimeout(() => onClose(), 350);
  }, [maxHeight, translateY, backdropOpacity, onClose]);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, springPresets.sheet);
      backdropOpacity.value = withTiming(1, { duration: duration.normal });
    } else {
      translateY.value = withSpring(maxHeight, springPresets.sheet);
      backdropOpacity.value = withTiming(0, { duration: duration.normal });
    }
  }, [isVisible, maxHeight, translateY, backdropOpacity]);

  /** Pan gesture for dragging the sheet. */
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow dragging downward from current position or back up
      const nextY = contextY.value + event.translationY;
      translateY.value = Math.max(0, Math.min(nextY, maxHeight));
    })
    .onEnd((event) => {
      // Fast downward fling -> dismiss
      if (event.velocityY > DISMISS_VELOCITY) {
        runOnJS(close)();
        return;
      }

      // Snap to nearest point
      const currentY = translateY.value;
      // snapPoints in terms of translateY: 0 = open to maxHeight, etc.
      const snapTranslateValues = sortedSnaps.map((sp) => maxHeight - sp);
      // Include closed position
      const allSnaps = [...snapTranslateValues, maxHeight];

      let nearestSnap = maxHeight;
      let minDist = Infinity;
      for (const snap of allSnaps) {
        const dist = Math.abs(currentY - snap);
        if (dist < minDist) {
          minDist = dist;
          nearestSnap = snap;
        }
      }

      if (nearestSnap >= maxHeight) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(nearestSnap, springPresets.sheet);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isVisible && translateY.value >= maxHeight) {
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <View style={styles.overlay} testID={testID}>
        {/* Semi-transparent backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close bottom sheet"
          />
        </Animated.View>

        {/* Sheet body */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { height: maxHeight + HANDLE_HEIGHT },
              sheetStyle,
              style,
            ]}
          >
            {/* Golden handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Children content */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

/** Bottom sheet modal with sacred styling, gesture drag, and spring animations. */
export const SacredBottomSheet = React.memo(SacredBottomSheetComponent);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.alpha.blackHeavy,
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.alpha.goldMedium,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HANDLE_HEIGHT,
    paddingTop: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});
