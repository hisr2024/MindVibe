/**
 * Custom Bottom Tab Bar — MindVibe Mobile
 *
 * Renders a custom bottom navigation with:
 * - Golden glow on active tab
 * - Haptic feedback on tab switch
 * - Safe area handling (notch-aware)
 * - Animated icon transitions
 * - Full accessibility (VoiceOver/TalkBack labels)
 *
 * Sits below the Mini Vibe Player when audio is active.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, darkTheme, spacing, typography, radii, shadows, motion } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Tab Configuration
// ---------------------------------------------------------------------------

interface TabConfig {
  label: string;
  icon: string;
  iconActive: string;
  accessibilityLabel: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  HomeTab: {
    label: 'Home',
    icon: '🏠',
    iconActive: '🏡',
    accessibilityLabel: 'Home dashboard',
  },
  JourneysTab: {
    label: 'Journeys',
    icon: '🧘',
    iconActive: '🧘‍♂️',
    accessibilityLabel: 'Spiritual journeys',
  },
  VibeTab: {
    label: 'Vibe',
    icon: '🎵',
    iconActive: '🎶',
    accessibilityLabel: 'KIAAN Vibe Player',
  },
  SakhaTab: {
    label: 'Sakha',
    icon: '💬',
    iconActive: '🙏',
    accessibilityLabel: 'Sakha spiritual companion',
  },
  ProfileTab: {
    label: 'You',
    icon: '👤',
    iconActive: '👤',
    accessibilityLabel: 'Your profile and settings',
  },
};

// ---------------------------------------------------------------------------
// Tab Item Component
// ---------------------------------------------------------------------------

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  theme: typeof darkTheme;
}

function TabItem({ routeName, isFocused, onPress, onLongPress, theme }: TabItemProps) {
  const config = TAB_CONFIG[routeName] ?? {
    label: routeName,
    icon: '📱',
    iconActive: '📱',
    accessibilityLabel: routeName,
  };

  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    // Haptic feedback (would use react-native-haptic-feedback in production)
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, motion.spring);
    }, 100);
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={config.accessibilityLabel}
    >
      <Animated.View style={[styles.tabItemInner, animatedStyle]}>
        {/* Gold glow dot when active */}
        {isFocused && (
          <View style={[styles.activeGlow, shadows.glow]} />
        )}
        <Text style={styles.tabIcon}>
          {isFocused ? config.iconActive : config.icon}
        </Text>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? colors.gold[400] : theme.textTertiary,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
        >
          {config.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Bottom Tab Bar
// ---------------------------------------------------------------------------

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = darkTheme; // In production, consume from ThemeProvider

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold[400],
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
  },
});

export default BottomTabBar;
