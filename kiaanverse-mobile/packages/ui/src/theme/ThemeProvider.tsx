/**
 * Kiaanverse Theme Provider
 *
 * Provides theme colors and mode to the component tree via React context.
 * Respects system color scheme when mode is 'system'.
 */

import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type ThemeColors } from './themes';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  isDark: true,
  mode: 'dark',
  setMode: () => {},
});

interface ThemeProviderProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  children: React.ReactNode;
}

export function ThemeProvider({ mode, onModeChange, children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedDark = mode === 'system'
      ? systemScheme !== 'light'
      : mode === 'dark';

    return {
      theme: resolvedDark ? darkTheme : lightTheme,
      isDark: resolvedDark,
      mode,
      setMode: onModeChange,
    };
  }, [mode, systemScheme, onModeChange]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
