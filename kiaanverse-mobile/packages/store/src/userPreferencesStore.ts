/**
 * User Preferences Store
 *
 * Persists user preferences using AsyncStorage.
 * Mirrors the pattern from the existing userPreferencesStore.ts
 * but uses expo-compatible AsyncStorage instead of MMKV.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VoiceGender = 'male' | 'female' | 'neutral';

interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string;
  journeyUpdates: boolean;
  weeklyInsights: boolean;
}

interface VoicePreferences {
  gender: VoiceGender;
  language: string;
  speed: number;
  autoPlay: boolean;
}

interface UserPreferencesState {
  locale: string;
  notifications: NotificationPreferences;
  voice: VoicePreferences;
  hapticsEnabled: boolean;
  analyticsEnabled: boolean;
}

interface UserPreferencesActions {
  setLocale: (locale: string) => void;
  setNotifications: (prefs: Partial<NotificationPreferences>) => void;
  setVoice: (prefs: Partial<VoicePreferences>) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const defaultNotifications: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: '08:00',
  journeyUpdates: true,
  weeklyInsights: true,
};

const defaultVoice: VoicePreferences = {
  gender: 'female',
  language: 'en',
  speed: 1.0,
  autoPlay: false,
};

const initialState: UserPreferencesState = {
  locale: 'en',
  notifications: defaultNotifications,
  voice: defaultVoice,
  hapticsEnabled: true,
  analyticsEnabled: true,
};

export const useUserPreferencesStore = create<UserPreferencesState & UserPreferencesActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLocale: (locale) => set({ locale }),

      setNotifications: (prefs) =>
        set({ notifications: { ...get().notifications, ...prefs } }),

      setVoice: (prefs) =>
        set({ voice: { ...get().voice, ...prefs } }),

      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

      setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),

      reset: () => set(initialState),
    }),
    {
      name: 'kiaanverse-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
