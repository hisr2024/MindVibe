/**
 * Theme Store
 *
 * Persists the user's theme preferences to AsyncStorage via zustand/persist:
 *   - `mode`     — dark / light / system
 *   - `palette`  — which sacred color scheme is active
 *                  (Indigo/Peacock, Maroon, Dark Green, Black & Gold)
 *
 * The palette id is a plain string union here so this package does not need
 * a runtime dependency on `@kiaanverse/ui`. The actual palette config lives
 * in `@kiaanverse/ui/tokens/palettes.ts` and is keyed by the same id.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

export type ThemeMode = 'dark' | 'light' | 'system';

/** Mirror of the `PaletteId` union exported from `@kiaanverse/ui`. Kept in
 *  sync by convention — the four ids are stable string literals. */
export type PaletteId = 'indigoPeacock' | 'maroon' | 'darkGreen' | 'blackGold';

const DEFAULT_PALETTE: PaletteId = 'indigoPeacock';

interface ThemeState {
  mode: ThemeMode;
  palette: PaletteId;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: PaletteId) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      immer((set) => ({
        mode: 'dark' as ThemeMode,
        palette: DEFAULT_PALETTE,

        setMode: (mode: ThemeMode) => {
          set((state) => {
            state.mode = mode;
          });
        },

        setPalette: (palette: PaletteId) => {
          set((state) => {
            state.palette = palette;
          });
        },
      })),
      {
        name: 'kiaanverse-theme',
        storage: createJSONStorage(() => AsyncStorage),
        // Migration: existing users will hydrate with no `palette` field.
        // Zustand's persist merges the default state, so they will land on
        // 'indigoPeacock' (the previous look) — no flash of unfamiliar color.
      },
    ),
    {
      name: 'ThemeStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
