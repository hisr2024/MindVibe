/**
 * Kiaanverse Theme Provider
 *
 * Wraps the app in a React context carrying the full typed theme object.
 * Resolves 'system' mode via the Appearance API and memoises the theme
 * to prevent unnecessary re-renders in the component tree.
 *
 * Also threads the active **sacred color scheme** (palette) through the
 * theme. The host app reads `paletteId` from a persisted store
 * (`@kiaanverse/store/themeStore`) and passes it in; we look up the full
 * palette config from `tokens/palettes.ts` and merge it onto `theme.colorScheme`.
 */

import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './themes';
import { DEFAULT_PALETTE_ID, PALETTES } from '../tokens/palettes';
import type { ThemeContextValue, ThemeMode } from './types';
import type { PaletteId } from '../tokens/palettes';

export const ThemeContext = createContext<ThemeContextValue>({
  theme: { ...darkTheme, colorScheme: PALETTES[DEFAULT_PALETTE_ID] },
  isDark: true,
  mode: 'dark',
  setMode: () => {},
  paletteId: DEFAULT_PALETTE_ID,
  setPaletteId: () => {},
});

interface ThemeProviderProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  /** Active palette id from the host store. @default 'indigoPeacock' */
  paletteId?: PaletteId;
  /** Called when the user switches palette via the picker. No-op default
   *  keeps the provider usable in tests / Storybook without a real store. */
  onPaletteChange?: (id: PaletteId) => void;
  children: React.ReactNode;
}

export function ThemeProvider({
  mode,
  onModeChange,
  paletteId = DEFAULT_PALETTE_ID,
  onPaletteChange,
  children,
}: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedDark =
      mode === 'system' ? systemScheme !== 'light' : mode === 'dark';

    const baseTheme = resolvedDark ? darkTheme : lightTheme;
    const colorScheme = PALETTES[paletteId] ?? PALETTES[DEFAULT_PALETTE_ID];

    return {
      theme: { ...baseTheme, colorScheme },
      isDark: resolvedDark,
      mode,
      setMode: onModeChange,
      paletteId,
      setPaletteId: onPaletteChange ?? (() => {}),
    };
  }, [mode, systemScheme, onModeChange, paletteId, onPaletteChange]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
