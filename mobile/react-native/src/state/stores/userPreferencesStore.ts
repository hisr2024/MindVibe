/**
 * User Preferences Store (Zustand + MMKV persistence)
 *
 * Persists user preferences locally using MMKV (fast key-value store).
 * Preferences sync to server on change for cross-device consistency.
 *
 * Stored preferences:
 * - Language (locale code)
 * - Theme mode (dark/light/system)
 * - Notification settings
 * - Voice preferences
 * - Privacy choices
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// ---------------------------------------------------------------------------
// MMKV instance for preferences
// ---------------------------------------------------------------------------

const storage = new MMKV({ id: 'mindvibe-preferences' });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeMode = 'dark' | 'light' | 'system';
export type VoiceGender = 'male' | 'female' | 'neutral';

interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string; // HH:mm format
  journeyUpdates: boolean;
  weeklyInsights: boolean;
  communityActivity: boolean;
}

interface VoicePreferences {
  gender: VoiceGender;
  language: string;
  speed: number; // 0.5 to 2.0
  autoPlay: boolean;
}

interface PrivacyPreferences {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  personalizedInsights: boolean;
}

interface UserPreferencesState {
  locale: string;
  themeMode: ThemeMode;
  notifications: NotificationPreferences;
  voice: VoicePreferences;
  privacy: PrivacyPreferences;
  hasCompletedOnboarding: boolean;
}

interface UserPreferencesActions {
  setLocale: (locale: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setNotifications: (prefs: Partial<NotificationPreferences>) => void;
  setVoice: (prefs: Partial<VoicePreferences>) => void;
  setPrivacy: (prefs: Partial<PrivacyPreferences>) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  /** Hydrate from MMKV on app start */
  hydrate: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultNotifications: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: '08:00',
  journeyUpdates: true,
  weeklyInsights: true,
  communityActivity: false,
};

const defaultVoice: VoicePreferences = {
  gender: 'female',
  language: 'en',
  speed: 1.0,
  autoPlay: false,
};

const defaultPrivacy: PrivacyPreferences = {
  analyticsEnabled: true,
  crashReportingEnabled: true,
  personalizedInsights: true,
};

const initialState: UserPreferencesState = {
  locale: 'en',
  themeMode: 'dark',
  notifications: defaultNotifications,
  voice: defaultVoice,
  privacy: defaultPrivacy,
  hasCompletedOnboarding: false,
};

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function persist(state: UserPreferencesState): void {
  storage.set('preferences', JSON.stringify(state));
}

function load(): Partial<UserPreferencesState> {
  const raw = storage.getString('preferences');
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<UserPreferencesState>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserPreferencesStore = create<
  UserPreferencesState & UserPreferencesActions
>((set, get) => ({
  ...initialState,

  setLocale: (locale) => {
    set({ locale });
    persist({ ...get(), locale });
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    persist({ ...get(), themeMode });
  },

  setNotifications: (prefs) => {
    const updated = { ...get().notifications, ...prefs };
    set({ notifications: updated });
    persist({ ...get(), notifications: updated });
  },

  setVoice: (prefs) => {
    const updated = { ...get().voice, ...prefs };
    set({ voice: updated });
    persist({ ...get(), voice: updated });
  },

  setPrivacy: (prefs) => {
    const updated = { ...get().privacy, ...prefs };
    set({ privacy: updated });
    persist({ ...get(), privacy: updated });
  },

  setHasCompletedOnboarding: (completed) => {
    set({ hasCompletedOnboarding: completed });
    persist({ ...get(), hasCompletedOnboarding: completed });
  },

  hydrate: () => {
    const saved = load();
    if (Object.keys(saved).length > 0) {
      set({
        ...initialState,
        ...saved,
        notifications: { ...defaultNotifications, ...saved.notifications },
        voice: { ...defaultVoice, ...saved.voice },
        privacy: { ...defaultPrivacy, ...saved.privacy },
      });
    }
  },

  reset: () => {
    storage.delete('preferences');
    set(initialState);
  },
}));
