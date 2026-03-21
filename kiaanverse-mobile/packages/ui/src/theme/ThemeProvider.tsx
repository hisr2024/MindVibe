/**
 * Kiaanverse Theme Provider
 *
 * Wraps the app in a React context carrying the full typed theme object.
 * Resolves 'system' mode via the Appearance API and memoises the theme
 * to prevent unnecessary re-renders in the component tree.
 */

import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './themes';
import type { ThemeContextValue, ThemeMode } from './types';

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

export function ThemeProvider({
  mode,
  onModeChange,
  children,
}: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedDark =
      mode === 'system' ? systemScheme !== 'light' : mode === 'dark';

    return {
      theme: resolvedDark ? darkTheme : lightTheme,
      isDark: resolvedDark,
      mode,
      setMode: onModeChange,
    };
  }, [mode, systemScheme, onModeChange]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
