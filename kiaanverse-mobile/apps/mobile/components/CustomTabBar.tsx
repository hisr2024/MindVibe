/**
 * CustomTabBar — Kiaanverse bottom tab bar.
 *
 * Replaces the default Expo Router tab bar with a dark-themed,
 * golden-accented navigation bar. Features:
 * - Golden active indicator dot (not tint-based)
 * - Haptic feedback on tab switch
 * - Reanimated spring scale on active icon
 * - SafeArea bottom inset handling
 * - Sakha tab uses ✦ Sparkles icon
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Home, Sparkles, Compass, BookOpen, User } from 'lucide-react-native';
import { useTheme, colors, spacing } from '@kiaanverse/ui';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICON_SIZE = 22;
const DOT_SIZE = 4;

/** Map tab route name → lucide icon component. */
const TAB_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  home: Home,
  sakha: Sparkles,
  journey: Compass,
  gita: BookOpen,
  profile: User,
};

// ---------------------------------------------------------------------------
// Tab Item
// ---------------------------------------------------------------------------

interface TabItemProps {
  route: { key: string; name: string };
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
  dotColor: string;
}

function TabItem({
  route,
  label,
  isFocused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
  dotColor,
}: TabItemProps): React.JSX.Element {
  const IconComponent = TAB_ICONS[route.name] ?? Home;
  const color = isFocused ? activeColor : inactiveColor;

  const scale = useSharedValue(isFocused ? 1 : 0);

  // Drive scale when focus changes
  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });
  }, [isFocused, scale]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const s = interpolate(scale.value, [0, 1], [1, 1.15]);
    return { transform: [{ scale: s }] };
  });

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      testID={`tab-${route.name}`}
    >
      <Animated.View style={iconAnimatedStyle}>
        <IconComponent size={ICON_SIZE} color={color} />
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          { color },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      {/* Golden active dot */}
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          dotAnimatedStyle,
        ]}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Custom Tab Bar
// ---------------------------------------------------------------------------

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const handlePress = useCallback(
    (route: { key: string; name: string }, isFocused: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name);
      }
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (route: { key: string }) => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    },
    [navigation],
  );

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.tabBarBackground,
          borderTopColor: c.tabBarBorder,
          paddingBottom: bottomPadding,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key] ?? {};
        const label =
          typeof options?.tabBarLabel === 'string'
            ? options.tabBarLabel
            : typeof options?.title === 'string'
              ? options.title
              : route.name;
        const isFocused = state.index === index;

        return (
          <TabItem
            key={route.key}
            route={route}
            label={label}
            isFocused={isFocused}
            onPress={() => handlePress(route, isFocused)}
            onLongPress={() => handleLongPress(route)}
            activeColor={c.accent}
            inactiveColor={c.textTertiary}
            dotColor={colors.divine.aura}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Lato-Regular' : 'Lato-Regular',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: 2,
  },
});
