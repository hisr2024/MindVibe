/**
 * DivineTabBar — Kiaanverse bottom tab bar (5 sacred doorways).
 *
 * Matches kiaanverse.com reference exactly:
 *   Home · Chat · Shlokas · Journal · Profile
 *
 * Visual specification:
 * - Dark navy background: rgba(5,7,20,0.97).
 * - Gold horizontal gradient border line at the top (transparent → gold →
 *   transparent) — echoes the web divine-threshold border.
 * - 24 × 24 outline SVG glyphs for each tab.
 * - Active state: icon tints gold (#D4A017), label fades in in gold, and a
 *   4 px gold dot appears ABOVE the icon (matches the web marker).
 * - Inactive state: icon rendered at opacity 0.38, label hidden.
 * - Sacred-spring micro-interactions (~180 ms bounce + settle).
 * - Haptic impact on tab switch.
 *
 * Drop-in for expo-router:
 * ```tsx
 * <Tabs tabBar={(props) => <DivineTabBar {...props} />} />
 * ```
 */

import React, { useCallback, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { GopuramIcon } from './icons/GopuramIcon';
import { ChatMandalasIcon } from './icons/ChatMandalasIcon';
import { ManuscriptIcon } from './icons/ManuscriptIcon';
import { ChakraColumnIcon } from './icons/ChakraColumnIcon';
import { MeditatorIcon } from './icons/MeditatorIcon';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const ACTIVE_COLOR = '#D4A017';
const INACTIVE_COLOR = 'rgba(240,235,225,0.38)';
const BACKGROUND_COLOR = 'rgba(5,7,20,0.97)';

// ---------------------------------------------------------------------------
// Tab definition — single source of truth for label + icon.
// ---------------------------------------------------------------------------

type SacredIcon = React.ComponentType<{ size?: number; color?: string }>;

interface SacredTab {
  /** Route name as declared in app/(tabs)/_layout.tsx. */
  readonly name: string;
  /** Fallback label if the screen's `title` option is missing. */
  readonly label: string;
  /** 24 × 24 outline glyph. */
  readonly Icon: SacredIcon;
}

const TABS: ReadonlyArray<SacredTab> = [
  { name: 'index', label: 'Home', Icon: GopuramIcon },
  { name: 'chat', label: 'Chat', Icon: ChatMandalasIcon },
  { name: 'shlokas', label: 'Shlokas', Icon: ManuscriptIcon },
  { name: 'journal', label: 'Journal', Icon: ChakraColumnIcon },
  { name: 'profile', label: 'Profile', Icon: MeditatorIcon },
] as const;

/** Gold gradient colour stops for the top border. */
const TOP_BORDER_COLORS: readonly [string, string, string, string, string] = [
  'transparent',
  'rgba(212,160,23,0.5)',
  'rgba(212,160,23,0.8)',
  'rgba(212,160,23,0.5)',
  'transparent',
];

/** Base height of the tab bar content (safe-area inset is added on top). */
const TAB_BAR_HEIGHT = 64;
/** Active indicator dot diameter. */
const DOT_SIZE = 4;
/** Distance between the dot's bottom edge and the icon's top edge. */
const DOT_GAP = 4;

// ---------------------------------------------------------------------------
// DivineTabBar
// ---------------------------------------------------------------------------

export function DivineTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (route: { key: string; name: string }, isFocused: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (isFocused || event.defaultPrevented) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(route.name);
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (route: { key: string }) => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    },
    [navigation],
  );

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      accessibilityRole="tablist"
    >
      {/* Gold horizontal gradient line — matches kiaanverse.com. */}
      <LinearGradient
        colors={TOP_BORDER_COLORS as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topBorder}
      />

      <View style={styles.row}>
        {TABS.map((tab, tabIndex) => {
          // Locate the matching route in the navigator state; if a tab
          // screen isn't registered (e.g. during route transitions) skip it.
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;

          const routeIndex = state.routes.indexOf(route);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key] ?? {};
          const label =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options?.title === 'string'
                ? options.title
                : tab.label;

          return (
            <TabItem
              key={route.key}
              label={label}
              Icon={tab.Icon}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
              routeName={tab.name}
              testID={`tab-${tab.name}`}
              // Hint to TabItem that the first render should not animate in.
              initialIndex={tabIndex}
            />
          );
        })}
      </View>
    </View>
  );
}

export default DivineTabBar;

// ---------------------------------------------------------------------------
// TabItem — single pressable tab with dot + icon + label.
// ---------------------------------------------------------------------------

interface TabItemProps {
  readonly label: string;
  readonly Icon: SacredIcon;
  readonly isFocused: boolean;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
  readonly routeName: string;
  readonly testID?: string;
  readonly initialIndex: number;
}

function TabItemInner({
  label,
  Icon,
  isFocused,
  onPress,
  onLongPress,
  testID,
}: TabItemProps): React.JSX.Element {
  /** 0 = inactive, 1 = active — drives dot opacity + label fade-in. */
  const focus = useSharedValue(isFocused ? 1 : 0);
  /** Drives the icon scale (divine-breath cycle on activation). */
  const iconScale = useSharedValue(1);

  useEffect(() => {
    // Sacred-spring for focus transition (~180ms settle).
    focus.value = withSpring(isFocused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });

    if (isFocused) {
      // Divine-breath: one cycle 1.0 → 1.15 → 1.0 (~480ms).
      iconScale.value = withSequence(
        withTiming(1.15, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      );
    } else {
      iconScale.value = withTiming(1.0, { duration: 200 });
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

  // We swap stroke colour on the JS thread (rgba ↔ hex) because Reanimated
  // cannot interpolate across those formats without the colour plugin; the
  // focus spring already carries the visual transition via dot + label.
  const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      testID={testID}
      hitSlop={8}
    >
      {/* Reserved slot above the icon — keeps layout height stable. */}
      <View style={styles.dotSlot} pointerEvents="none">
        <Animated.View style={[styles.dot, dotAnimatedStyle]} />
      </View>

      <Animated.View style={iconAnimatedStyle}>
        <Icon size={24} color={iconColor} />
      </Animated.View>

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

const TabItem = React.memo(TabItemInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: BACKGROUND_COLOR,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  dotSlot: {
    height: DOT_SIZE + DOT_GAP,
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
