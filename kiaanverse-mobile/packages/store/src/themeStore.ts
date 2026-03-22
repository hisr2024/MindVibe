/**
 * Theme Store
 *
 * Persists the user's theme preference (dark/light/system)
 * using AsyncStorage via zustand/persist.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      immer((set) => ({
        mode: 'dark' as ThemeMode,

        setMode: (mode: ThemeMode) => {
          set((state) => {
            state.mode = mode;
          });
        },
      })),
      {
        name: 'kiaanverse-theme',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
    {
      name: 'ThemeStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
