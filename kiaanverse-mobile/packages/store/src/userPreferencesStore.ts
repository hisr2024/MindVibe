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
import * as Localization from 'expo-localization';

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
  /**
   * False until the locale has been resolved at least once — either by the
   * user picking it explicitly in Language Settings, or by the first-launch
   * system-locale detection. Prevents `initLocaleFromSystem` from
   * second-guessing an explicit user choice on subsequent boots.
   */
  localeInitialized: boolean;
  notifications: NotificationPreferences;
  voice: VoicePreferences;
  hapticsEnabled: boolean;
  analyticsEnabled: boolean;
}

interface UserPreferencesActions {
  setLocale: (locale: string) => void;
  /**
   * One-shot first-launch helper: if the user hasn't selected a locale yet,
   * map the device locale onto a supported locale code and store it. Safe
   * to call on every mount — it's a no-op once a locale has been resolved.
   */
  initLocaleFromSystem: (supported: readonly string[]) => void;
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
  localeInitialized: false,
  notifications: defaultNotifications,
  voice: defaultVoice,
  hapticsEnabled: true,
  analyticsEnabled: true,
};

/**
 * Map a BCP-47 device tag (e.g. "zh-Hans-CN", "pt-BR") onto a supported
 * locale code from our catalog. Tries the full tag first, then the
 * language-region prefix, then the bare language. Returns null if no match.
 */
function matchSupportedLocale(
  deviceTags: readonly string[],
  supported: readonly string[],
): string | null {
  const supportedSet = new Set(supported);
  // Build a case-insensitive lookup that preserves the canonical casing
  // (e.g. "zh-CN") used in our catalog, since BCP-47 is case-insensitive
  // on the wire but our keys are deterministic.
  const canonical = new Map<string, string>();
  for (const code of supported) canonical.set(code.toLowerCase(), code);

  for (const raw of deviceTags) {
    if (!raw) continue;
    const tag = raw.toLowerCase();
    const direct = canonical.get(tag);
    if (direct && supportedSet.has(direct)) return direct;

    // Try language-region (drop script): "zh-hans-cn" → "zh-cn"
    const parts = tag.split('-');
    if (parts.length >= 3) {
      const lr = `${parts[0]}-${parts[parts.length - 1]}`;
      const langRegion = canonical.get(lr);
      if (langRegion && supportedSet.has(langRegion)) return langRegion;
    }

    // Try bare language: "pt-br" → "pt"
    const language = parts[0];
    if (language) {
      const bare = canonical.get(language);
      if (bare && supportedSet.has(bare)) return bare;
    }
  }
  return null;
}

export const useUserPreferencesStore = create<UserPreferencesState & UserPreferencesActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setLocale: (locale: string) => {
          set((state) => {
            state.locale = locale;
            state.localeInitialized = true;
          });
        },

        initLocaleFromSystem: (supported: readonly string[]) => {
          set((state) => {
            if (state.localeInitialized) return;
            try {
              const deviceLocales = Localization.getLocales();
              const tags = deviceLocales
                .map((l) => l.languageTag)
                .filter((t): t is string => typeof t === 'string' && t.length > 0);
              const matched = matchSupportedLocale(tags, supported);
              if (matched) state.locale = matched;
            } catch {
              // expo-localization can throw on unusual platforms; keep the
              // default English in that case.
            }
            state.localeInitialized = true;
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
