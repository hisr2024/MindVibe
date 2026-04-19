/**
 * DivineTabBar — Custom bottom tab bar for the Kiaanverse mobile app.
 *
 * Direct port of the web `components/navigation/MobileNav.tsx` — five
 * sacred doorways: Home · Journeys · KIAAN (center) · Gita · Profile.
 *
 * Visual specification:
 * - Height: 72 + safe-area bottom inset.
 * - Background: rgba(5,7,20,0.95) — solid (expo-blur is unreliable on
 *   Android; a semi-opaque navy keeps contrast + perf parity).
 * - Top border: 1 px horizontal gradient (transparent → blue → gold →
 *   blue → transparent) — echoes the web divine-threshold border.
 * - Absolute-positioned at the screen bottom, overflow visible so the
 *   elevated center KIAAN tab can extend above the bar.
 * - Haptic feedback (ImpactFeedbackStyle.Light) on tab switches.
 *
 * Tab routing:
 * - Compatible with expo-router's <Tabs tabBar={...} /> slot; consumes
 *   the `BottomTabBarProps` passed by `@react-navigation/bottom-tabs`.
 * - KIAAN tab is detected by route name 'sakha' (aligns with the
 *   existing app router at app/(tabs)/sakha.tsx).
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { TabIcon, type TabRouteName } from './TabIcon';
import { CenterKiaanTab } from './CenterKiaanTab';
import { GopuramIcon } from './icons/GopuramIcon';
import { ChakraColumnIcon } from './icons/ChakraColumnIcon';
import { ManuscriptIcon } from './icons/ManuscriptIcon';
import { MeditatorIcon } from './icons/MeditatorIcon';

/** Base height of the tab bar content (safe-area inset is added on top). */
const TAB_BAR_HEIGHT = 72;

/** Route names that are eligible to render in the bar, in order. */
const TAB_ORDER: ReadonlyArray<string> = [
  'home',
  'journey',
  'sakha',
  'gita',
  'profile',
];

/** Non-center tab → icon component mapping. */
const TAB_ICONS: Record<TabRouteName, React.ComponentType<{ size?: number; color?: string }>> = {
  home: GopuramIcon,
  journey: ChakraColumnIcon,
  gita: ManuscriptIcon,
  profile: MeditatorIcon,
};

/** Gradient color stops for the top divine-threshold border.
 *  transparent → peacock → gold → peacock → transparent (matches web). */
const TOP_BORDER_COLORS: readonly [string, string, string, string, string] = [
  'transparent',
  'rgba(27,79,187,0.4)',
  'rgba(212,160,23,0.6)',
  'rgba(27,79,187,0.4)',
  'transparent',
];

/**
 * Custom tab bar. Drop-in replacement for the default Expo Router bar:
 *
 * ```tsx
 * <Tabs tabBar={(props) => <DivineTabBar {...props} />} ... />
 * ```
 */
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

  // Filter the incoming route list down to the five sacred tabs and
  // preserve the canonical order (expo-router can inject hidden routes
  // which we drop here).
  const visibleRoutes = state.routes.filter((r) => TAB_ORDER.includes(r.name));
  const orderedRoutes = [...visibleRoutes].sort(
    (a, b) => TAB_ORDER.indexOf(a.name) - TAB_ORDER.indexOf(b.name),
  );

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
      // Overflow visible so the center KIAAN tab can elevate above.
      pointerEvents="box-none"
      accessibilityRole="tablist"
    >
      {/* Divine-threshold top border: 1 px horizontal gradient. */}
      <LinearGradient
        colors={TOP_BORDER_COLORS as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topBorder}
      />

      <View style={styles.row} pointerEvents="box-none">
        {orderedRoutes.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const { options } = descriptors[route.key] ?? {};
          const label =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options?.title === 'string'
                ? options.title
                : route.name;

          if (route.name === 'sakha') {
            return (
              <CenterKiaanTab
                key={route.key}
                isFocused={isFocused}
                label={label}
                onPress={() => handlePress(route, isFocused)}
                onLongPress={() => handleLongPress(route)}
              />
            );
          }

          const routeName = route.name as TabRouteName;
          const Icon = TAB_ICONS[routeName];
          if (!Icon) return null;

          return (
            <TabIcon
              key={route.key}
              routeName={routeName}
              label={label}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
              Icon={Icon}
            />
          );
        })}
      </View>
    </View>
  );
}

export default DivineTabBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,7,20,0.95)',
    // Overflow MUST stay visible so CenterKiaanTab can elevate above.
    overflow: 'visible',
    // Platform-specific depth to lift the bar above content.
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
});
