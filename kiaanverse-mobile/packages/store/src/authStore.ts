/**
 * Authentication State Store
 *
 * Manages the full auth lifecycle:
 * - Token pair storage via expo-secure-store
 * - Login/signup/logout flows
 * - Token refresh deduplication (handled by @kiaanverse/api interceptors)
 * - Onboarding completion tracking
 *
 * Mirrors the pattern from mobile/react-native/src/state/stores/authStore.ts
 * but uses expo-secure-store instead of react-native-keychain.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setTokenManager } from '@kiaanverse/api';
import type { User, SubscriptionTier } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  isOnboarded: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  completeOnboarding: () => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Secure Storage Helpers
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'kiaanverse_access_token';
const REFRESH_TOKEN_KEY = 'kiaanverse_refresh_token';

async function storeTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Wire up token manager for API client
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

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  initialize: async () => {
    set({ status: 'loading', error: null });

    try {
      const token = await getAccessToken();
      if (!token) {
        set({ status: 'unauthenticated' });
        return;
      }

      const { data } = await api.profile.me();
      const profile = data as {
        id: string;
        email: string;
        name?: string;
        locale?: string;
        subscription_tier?: string;
        created_at: string;
      };

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name ?? '',
        locale: profile.locale ?? 'en',
        subscriptionTier: (profile.subscription_tier?.toUpperCase() ?? 'FREE') as SubscriptionTier,
        createdAt: profile.created_at,
      };

      set({ status: 'authenticated', user, isOnboarded: true });
    } catch {
      await clearTokens();
      set({ status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });

    try {
      const { data: authData } = await api.auth.login(email, password);
      const tokens = authData as { access_token: string; refresh_token: string };
      await storeTokens(tokens.access_token, tokens.refresh_token);

      const { data } = await api.profile.me();
      const profile = data as {
        id: string;
        email: string;
        name?: string;
        locale?: string;
        subscription_tier?: string;
        created_at: string;
      };

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
      set({ status: 'unauthenticated', error: extractErrorMessage(err) });
      return false;
    }
  },

  signup: async (email, password, name) => {
    set({ status: 'loading', error: null });

    try {
      const { data: authData } = await api.auth.signup(email, password, name);
      const tokens = authData as { access_token: string; refresh_token: string; user_id?: string; id?: string };
      await storeTokens(tokens.access_token, tokens.refresh_token);

      const user: User = {
        id: tokens.user_id ?? tokens.id ?? '',
        email,
        name,
        locale: 'en',
        subscriptionTier: 'FREE',
        createdAt: new Date().toISOString(),
      };

      set({ status: 'authenticated', user, isOnboarded: false });
      return true;
    } catch (err: unknown) {
      set({ status: 'unauthenticated', error: extractErrorMessage(err) });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Best-effort server logout
    }
    await clearTokens();
    set({ ...initialState, status: 'unauthenticated' });
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
