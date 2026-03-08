/**
 * Authentication State Store (Zustand)
 *
 * Manages the full authentication lifecycle:
 * - JWT token pair storage via react-native-keychain
 * - User profile data
 * - Login/signup/logout flows
 * - Token refresh with concurrent request deduplication
 * - Onboarding completion tracking
 * - Subscription tier for feature gating
 *
 * Tokens are stored in the OS secure enclave (Keychain/Keystore),
 * never in AsyncStorage or MMKV.
 */

import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { api, setTokenManager } from '@services/apiClient';
import type { User, SubscriptionTier } from '@app-types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  isOnboarded: boolean;
  /** Last auth error message (cleared on next attempt) */
  error: string | null;
}

interface AuthActions {
  /** Bootstrap auth on app launch — checks for stored tokens */
  initialize: () => Promise<void>;
  /** Login with email and password */
  login: (email: string, password: string) => Promise<boolean>;
  /** Create a new account */
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  /** Clear tokens and user data */
  logout: () => Promise<void>;
  /** Update local user data (after profile edit) */
  setUser: (user: User) => void;
  /** Mark onboarding as complete */
  completeOnboarding: () => void;
  /** Clear error state */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Keychain helpers (secure token storage)
// ---------------------------------------------------------------------------

const KEYCHAIN_SERVICE = 'com.mindvibe.auth';
const KEYCHAIN_REFRESH_SERVICE = 'com.mindvibe.refresh';

async function storeTokens(access: string, refresh: string): Promise<void> {
  await Keychain.setGenericPassword('access_token', access, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await Keychain.setGenericPassword('refresh_token', refresh, {
    service: KEYCHAIN_REFRESH_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
  return credentials ? credentials.password : null;
}

async function getRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_REFRESH_SERVICE,
  });
  return credentials ? credentials.password : null;
}

async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await Keychain.resetGenericPassword({ service: KEYCHAIN_REFRESH_SERVICE });
}

// ---------------------------------------------------------------------------
// Wire up token manager for API client
// ---------------------------------------------------------------------------

setTokenManager({
  getAccessToken,
  getRefreshToken,
  setTokens: storeTokens,
  clearTokens,
});

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: AuthState = {
  status: 'idle',
  user: null,
  isOnboarded: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  initialize: async () => {
    set({ status: 'loading', error: null });

    try {
      const token = await getAccessToken();
      if (!token) {
        set({ status: 'unauthenticated' });
        return;
      }

      // Validate token by fetching user profile
      const { data } = await api.profile.me();
      const user: User = {
        id: data.id,
        email: data.email,
        name: data.name ?? '',
        locale: data.locale ?? 'en',
        subscriptionTier: (data.subscription_tier?.toUpperCase() ?? 'FREE') as SubscriptionTier,
        createdAt: data.created_at,
      };

      set({ status: 'authenticated', user, isOnboarded: true });
    } catch {
      // Token invalid or expired and refresh failed
      await clearTokens();
      set({ status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });

    try {
      const { data } = await api.auth.login(email, password);
      await storeTokens(data.access_token, data.refresh_token);

      const { data: profile } = await api.profile.me();
      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name ?? '',
        locale: profile.locale ?? 'en',
        subscriptionTier: (profile.subscription_tier?.toUpperCase() ?? 'FREE') as SubscriptionTier,
        createdAt: profile.created_at,
      };

      set({ status: 'authenticated', user, isOnboarded: true });
      return true;
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      set({ status: 'unauthenticated', error: message });
      return false;
    }
  },

  signup: async (email, password, name) => {
    set({ status: 'loading', error: null });

    try {
      const { data } = await api.auth.signup(email, password, name);
      await storeTokens(data.access_token, data.refresh_token);

      const user: User = {
        id: data.user_id ?? data.id,
        email,
        name,
        locale: 'en',
        subscriptionTier: 'FREE',
        createdAt: new Date().toISOString(),
      };

      set({ status: 'authenticated', user, isOnboarded: false });
      return true;
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      set({ status: 'unauthenticated', error: message });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Best-effort server logout; clear local state regardless
    }
    await clearTokens();
    set(initialState);
    set({ status: 'unauthenticated' });
  },

  setUser: (user) => set({ user }),

  completeOnboarding: () => set({ isOnboarded: true }),

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string; message?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
