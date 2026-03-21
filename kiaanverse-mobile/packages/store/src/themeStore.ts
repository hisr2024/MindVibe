/**
 * Theme Store
 *
 * Persists the user's theme preference (dark/light/system)
 * using a simple JSON storage adapter.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'kiaanverse-theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
