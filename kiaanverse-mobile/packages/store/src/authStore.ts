/**
 * Authentication State Store
 *
 * Manages the full auth lifecycle for Kiaanverse mobile:
 * - Token pair storage via expo-secure-store (never AsyncStorage)
 * - Login / signup / logout flows via authService
 * - Biometric authentication via expo-local-authentication
 * - Persistent login across app restarts (Zustand persist + SecureStore adapter)
 * - Auto-logout when refresh token expires (onAuthFailure callback)
 * - Developer mode bypass in __DEV__ with mock user
 *
 * Security: Tokens are stored in SecureStore (OS keychain / keystore).
 * Only non-sensitive derived state (user profile, prefs) is persisted
 * via the Zustand persist middleware.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { setTokenManager, authService } from '@kiaanverse/api';
import type { User, SubscriptionTier } from '@kiaanverse/api';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
}

interface AuthActions {
  /** Hydrate auth state from stored tokens on app launch. */
  initialize: () => Promise<void>;
  /** Authenticate with email + password. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Create a new account. */
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  /** Sign out and clear all stored credentials. */
  logout: () => Promise<void>;
  /** Replace the user object in state. */
  setUser: (user: User) => void;
  /** Mark onboarding as complete. */
  completeOnboarding: () => void;
  /** Clear the current error message. */
  clearError: () => void;
  /** Check whether the device supports biometric authentication. */
  checkBiometricAvailability: () => Promise<void>;
  /** Prompt biometric and re-authenticate using stored refresh token. */
  authenticateWithBiometric: () => Promise<boolean>;
  /** Enable biometric unlock for future sessions. */
  enableBiometric: () => void;
  /** Disable biometric unlock. */
  disableBiometric: () => void;
  /** DEV-only: skip backend and authenticate with a mock user. */
  devLogin: () => void;
}

// ---------------------------------------------------------------------------
// Secure Storage Keys
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'kiaanverse_access_token';
const REFRESH_TOKEN_KEY = 'kiaanverse_refresh_token';

// ---------------------------------------------------------------------------
// Secure Storage Helpers (raw token management)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SecureStore adapter for Zustand persist middleware
// ---------------------------------------------------------------------------

const secureStoreAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: AuthState = {
  status: 'idle',
  user: null,
  isOnboarded: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  biometricAvailable: false,
};

// ---------------------------------------------------------------------------
// Mock User (dev mode only)
// ---------------------------------------------------------------------------

const DEV_MOCK_USER: User = {
  id: 'dev-user-000',
  email: 'dev@kiaanverse.local',
  name: 'Dev Mode',
  locale: 'en',
  subscriptionTier: 'SIDDHA' as SubscriptionTier,
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Error Extraction Helper
// ---------------------------------------------------------------------------

function extractErrorMessage(err: unknown): string {
  // AuthError from authService
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async () => {
        set({ status: 'loading', isLoading: true, error: null });

        try {
          const token = await getAccessToken();
          if (!token) {
            set({ status: 'unauthenticated', isLoading: false });
            return;
          }

          const user = await authService.getCurrentUser();
          set({
            status: 'authenticated',
            user,
            isOnboarded: true,
            isLoading: false,
          });
        } catch {
          // Token invalid or network error — clear and require re-login
          await clearTokens();
          set({ status: 'unauthenticated', isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ status: 'loading', isLoading: true, error: null });

        try {
          const tokens = await authService.login(email, password);
          await storeTokens(tokens.access_token, tokens.refresh_token);

          const user = await authService.getCurrentUser();
          set({
            status: 'authenticated',
            user,
            isOnboarded: true,
            isLoading: false,
          });
          return true;
        } catch (err: unknown) {
          set({
            status: 'unauthenticated',
            isLoading: false,
            error: extractErrorMessage(err),
          });
          return false;
        }
      },

      signup: async (email, password, name) => {
        set({ status: 'loading', isLoading: true, error: null });

        try {
          const tokens = await authService.register({
            name,
            email,
            password,
            confirmPassword: password,
          });
          await storeTokens(tokens.access_token, tokens.refresh_token);

          // Build user from known registration data
          // The tokens response may include user_id — extract via unknown cast
          const tokensRaw = tokens as unknown as Record<string, unknown>;
          const userId =
            (typeof tokensRaw['user_id'] === 'string' ? tokensRaw['user_id'] : undefined) ??
            (typeof tokensRaw['id'] === 'string' ? tokensRaw['id'] : undefined) ??
            '';

          const user: User = {
            id: userId,
            email,
            name,
            locale: 'en',
            subscriptionTier: 'FREE',
            createdAt: new Date().toISOString(),
          };

          set({
            status: 'authenticated',
            user,
            isOnboarded: false,
            isLoading: false,
          });
          return true;
        } catch (err: unknown) {
          set({
            status: 'unauthenticated',
            isLoading: false,
            error: extractErrorMessage(err),
          });
          return false;
        }
      },

      logout: async () => {
        await authService.logout();
        await clearTokens();
        set({ ...initialState, status: 'unauthenticated' });
      },

      setUser: (user) => set({ user }),
      completeOnboarding: () => set({ isOnboarded: true }),
      clearError: () => set({ error: null }),

      // -----------------------------------------------------------------------
      // Biometric
      // -----------------------------------------------------------------------

      checkBiometricAvailability: async () => {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          set({ biometricAvailable: hasHardware && isEnrolled });
        } catch {
          set({ biometricAvailable: false });
        }
      },

      authenticateWithBiometric: async () => {
        const { biometricEnabled, biometricAvailable } = get();
        if (!biometricEnabled || !biometricAvailable) return false;

        set({ status: 'loading', isLoading: true, error: null });

        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to continue',
            fallbackLabel: 'Use password',
            disableDeviceFallback: false,
          });

          if (!result.success) {
            set({ status: 'unauthenticated', isLoading: false });
            return false;
          }

          // Biometric passed — use stored refresh token to get fresh access token
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            set({
              status: 'unauthenticated',
              isLoading: false,
              error: 'Session expired. Please sign in again.',
            });
            return false;
          }

          const tokens = await authService.refreshTokens(refreshToken);
          await storeTokens(tokens.access_token, tokens.refresh_token);

          const user = await authService.getCurrentUser();
          set({
            status: 'authenticated',
            user,
            isOnboarded: true,
            isLoading: false,
          });
          return true;
        } catch (err: unknown) {
          set({
            status: 'unauthenticated',
            isLoading: false,
            error: extractErrorMessage(err),
          });
          return false;
        }
      },

      enableBiometric: () => set({ biometricEnabled: true }),
      disableBiometric: () => set({ biometricEnabled: false }),

      // -----------------------------------------------------------------------
      // Developer Mode
      // -----------------------------------------------------------------------

      devLogin: () => {
        if (!__DEV__) return;
        set({
          status: 'authenticated',
          user: DEV_MOCK_USER,
          isOnboarded: true,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'kiaanverse-auth-state',
      storage: createJSONStorage(() => secureStoreAdapter),
      // Only persist non-sensitive derived state — NOT raw tokens
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        biometricEnabled: state.biometricEnabled,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Wire up token manager for API client (runs at module load time)
// ---------------------------------------------------------------------------

setTokenManager({
  getAccessToken,
  getRefreshToken,
  setTokens: storeTokens,
  clearTokens,
  /** Auto-logout: when the API client's 401 interceptor fails to refresh. */
  onAuthFailure: () => {
    useAuthStore.setState({
      ...initialState,
      status: 'unauthenticated',
    });
  },
});
