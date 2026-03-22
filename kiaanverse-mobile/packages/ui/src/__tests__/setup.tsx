/**
 * Jest Setup — UI Package
 *
 * Mocks for React Native Reanimated, Gesture Handler, and Expo modules.
 * Provides a ThemeProvider wrapper for component tests.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Mock react-native-reanimated
// ---------------------------------------------------------------------------

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component: React.ComponentType) => component,
      View,
      Text: require('react-native').Text,
    },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    withSpring: (val: number) => val,
    withTiming: (val: number) => val,
    withRepeat: (val: number) => val,
    withSequence: (...vals: number[]) => vals[0],
    withDelay: (_delay: number, val: number) => val,
    Easing: {
      inOut: (fn: unknown) => fn,
      out: (fn: unknown) => fn,
      ease: 0,
    },
  };
});

// ---------------------------------------------------------------------------
// Mock react-native-gesture-handler
// ---------------------------------------------------------------------------

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;

  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    ScrollView: require('react-native').ScrollView,
    Directions: {},
  };
});

// ---------------------------------------------------------------------------
// Mock expo-haptics
// ---------------------------------------------------------------------------

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// ---------------------------------------------------------------------------
// Mock expo-av
// ---------------------------------------------------------------------------

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { playAsync: jest.fn(), unloadAsync: jest.fn() },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock expo-speech
// ---------------------------------------------------------------------------

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// ---------------------------------------------------------------------------
// Mock useTheme — returns a static dark theme for predictable tests
// ---------------------------------------------------------------------------

jest.mock('../theme/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#080B1A',
        surface: '#0D1229',
        surfaceElevated: '#131836',
        card: '#0D1229',
        cardBorder: 'rgba(212, 175, 55, 0.1)',
        textPrimary: '#F5F1E8',
        textSecondary: '#B8B0A0',
        textTertiary: '#7A7265',
        accent: '#D4AF37',
        accentLight: '#E8C94A',
        accentMuted: '#8B7322',
        tabBarBackground: 'rgba(8, 11, 26, 0.95)',
        tabBarBorder: 'rgba(212, 175, 55, 0.1)',
        miniPlayerBackground: 'rgba(13, 18, 41, 0.98)',
        inputBackground: 'rgba(255, 255, 255, 0.05)',
        inputBorder: 'rgba(255, 255, 255, 0.1)',
        divider: 'rgba(255, 255, 255, 0.05)',
        overlay: 'rgba(0, 0, 0, 0.7)',
        statusBarStyle: 'light-content',
      },
      palette: {
        divine: { aura: '#FFD700' },
      },
    },
    isDark: true,
    mode: 'dark',
    setMode: jest.fn(),
  }),
}));
