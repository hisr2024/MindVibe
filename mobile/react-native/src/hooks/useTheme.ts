/**
 * Theme Hook — MindVibe Mobile
 *
 * Provides the current theme (dark/light) based on user preference
 * or system setting. Supports emotion-adaptive tinting.
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type ThemeColors } from '@theme/tokens';

export type ThemeMode = 'dark' | 'light' | 'system';

// In production, this would read from Zustand themeStore
let currentMode: ThemeMode = 'dark'; // Default to Golden Black

export function useTheme(): {
  theme: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
} {
  const systemScheme = useColorScheme();

  const resolvedTheme = useMemo(() => {
    if (currentMode === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return currentMode === 'dark' ? darkTheme : lightTheme;
  }, [systemScheme]);

  return {
    theme: resolvedTheme,
    isDark: resolvedTheme === darkTheme,
    mode: currentMode,
  };
}
