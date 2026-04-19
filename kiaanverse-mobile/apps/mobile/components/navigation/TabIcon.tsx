/**
 * TabIcon — Single non-center tab in the DivineTabBar.
 *
 * Renders one of the sacred SVG icons (Home / Journeys / Gita / Profile)
 * plus a gold active indicator dot ABOVE the icon and a gold label below
 * that is visible only in the active state.
 *
 * Active-state transitions (sacred-spring, ~180ms):
 * - Icon color switches to #D4A017 (gold).
 * - Icon scales 1.0 → 1.1 (divine breath — single cycle, settles at 1.0).
 * - Indicator dot fades & scales 0 → 1 (6 px above the icon).
 * - Label fades in (Outfit-Medium 10 px, gold).
 *
 * Inactive state: no dot, no label, icon rendered at opacity 0.4.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Tab route identifier (one of the non-center tabs). */
export type TabRouteName = 'home' | 'journey' | 'gita' | 'profile';

/** Gold used for the active indicator, label, and icon stroke. */
const ACTIVE_COLOR = '#D4A017';
/** Matches MobileNav.tsx web `opacity: 0.4` for inactive icons. */
const INACTIVE_COLOR = 'rgba(240,235,225,0.4)';
/** Iconography stroke + fill render size (24×24 — matches SVG viewBox). */
const ICON_SIZE = 24;
/** Active indicator dot diameter. */
const DOT_SIZE = 4;
/** Distance between the dot's bottom edge and the icon's top edge. */
const DOT_GAP = 6;
/** Reserved vertical space for the dot row (dot + gap) — keeps layout stable. */
const DOT_SLOT_HEIGHT = DOT_SIZE + DOT_GAP;

export interface TabIconProps {
  /** Which sacred icon to render. */
  readonly routeName: TabRouteName;
  /** Translated tab label — only shown when active. */
  readonly label: string;
  /** Whether this tab is the currently focused one. */
  readonly isFocused: boolean;
  /** Fired when the user taps this tab. */
  readonly onPress: () => void;
  /** Long-press handler (tab lifecycle emit). */
  readonly onLongPress?: () => void;
  /** Icon component to render (injected so TabIcon stays icon-agnostic). */
  readonly Icon: React.ComponentType<{ size?: number; color?: string }>;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

function TabIconInner({
  routeName,
  label,
  isFocused,
  onPress,
  onLongPress,
  Icon,
  testID,
}: TabIconProps): React.JSX.Element {
  /** 0 = inactive, 1 = active — drives dot / label opacity + scale. */
  const focus = useSharedValue(isFocused ? 1 : 0);
  /** Scale driver for the icon (divine-breath cycle on activation). */
  const iconScale = useSharedValue(1);

  useEffect(() => {
    // Sacred-spring for focus transition (~180ms).
    focus.value = withSpring(isFocused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });

    if (isFocused) {
      // Divine-breath: one cycle 1.0 → 1.1 → 1.0 over ~360ms.
      iconScale.value = withSequence(
        withTiming(1.1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 180, easing: Easing.inOut(Easing.ease) }),
      );
    } else {
      iconScale.value = withTiming(1.0, { duration: 120 });
    }
  }, [isFocused, focus, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: focus.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
  }));

  // We swap stroke color on the JS thread (rgba→hex) because Reanimated
  // cannot interpolate between rgba() and hex on the UI thread without
  // the color plugin, and the focus-spring already carries the visual
  // transition via dot + label fade-ins plus the icon breath cycle.
  const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      testID={testID ?? `tab-${routeName}`}
      hitSlop={8}
    >
      {/* Reserved slot above the icon holds the gold dot (fixed height
          keeps icon position stable across active/inactive states). */}
      <View style={styles.dotSlot} pointerEvents="none">
        <Animated.View style={[styles.dot, dotAnimatedStyle]} />
      </View>

      <Animated.View style={iconAnimatedStyle}>
        <Icon size={ICON_SIZE} color={iconColor} />
      </Animated.View>

      {/* Label slot — fixed height so the tab doesn't resize on focus. */}
      <View style={styles.labelSlot} pointerEvents="none">
        <Animated.Text
          numberOfLines={1}
          style={[styles.label, labelAnimatedStyle]}
        >
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

/** Single tab slot for the bottom navigation bar. */
export const TabIcon = React.memo(TabIconInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dotSlot: {
    height: DOT_SLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: ACTIVE_COLOR,
  },
  labelSlot: {
    height: 14,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: 'Outfit-Medium',
      android: 'Outfit-Medium',
      default: 'Outfit-Medium',
    }),
    fontWeight: '500',
    color: ACTIVE_COLOR,
    letterSpacing: 0.3,
  },
});
