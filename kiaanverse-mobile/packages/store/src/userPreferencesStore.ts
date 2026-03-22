/**
 * User Preferences Store
 *
 * Persists user preferences using AsyncStorage.
 * Covers locale, notification settings, voice preferences,
 * haptics toggle, and analytics opt-in.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

export type VoiceGender = 'male' | 'female' | 'neutral';

interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string;
  journeyUpdates: boolean;
  weeklyInsights: boolean;
  streakAlerts: boolean;
  sakhaMessages: boolean;
  milestones: boolean;
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
  streakAlerts: true,
  sakhaMessages: true,
  milestones: true,
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
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setLocale: (locale: string) => {
          set((state) => {
            state.locale = locale;
          });
        },

        setNotifications: (prefs: Partial<NotificationPreferences>) => {
          set((state) => {
            Object.assign(state.notifications, prefs);
          });
        },

        setVoice: (prefs: Partial<VoicePreferences>) => {
          set((state) => {
            Object.assign(state.voice, prefs);
          });
        },

        setHapticsEnabled: (enabled: boolean) => {
          set((state) => {
            state.hapticsEnabled = enabled;
          });
        },

        setAnalyticsEnabled: (enabled: boolean) => {
          set((state) => {
            state.analyticsEnabled = enabled;
          });
        },

        reset: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'kiaanverse-preferences',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
    {
      name: 'UserPreferencesStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
