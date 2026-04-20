/**
 * Authentication State Store
 *
 * Manages the full auth lifecycle for Kiaanverse mobile:
 * - Token storage via expo-secure-store (never AsyncStorage)
 * - Login / signup / logout flows via authService
 * - Biometric authentication via expo-local-authentication
 * - Persistent login across app restarts (Zustand persist + SecureStore adapter)
 * - Auto-logout when refresh token expires (onAuthFailure callback)
 * - Developer mode bypass in __DEV__ with mock user
 *
 * Backend contract awareness:
 * - Login returns access_token in body; refresh_token in httpOnly cookie
 * - Signup returns NO tokens (email verification required first)
 * - /api/auth/me returns user_id (not id), no name/locale/created_at
 * - Refresh accepts refresh_token from cookie OR body
 *
 * Security: Tokens stored in SecureStore (OS keychain / keystore).
 * Only non-sensitive derived state persisted via Zustand persist middleware.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { setTokenManager, authService } from '@kiaanverse/api';
import type { User } from '@kiaanverse/api';
import { secureStoreAdapter } from './persistence';

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
  /**
   * Set after successful signup. The register screen checks this to show
   * a "verify your email" message instead of navigating to tabs.
   */
  signupPendingVerification: boolean;
  /**
   * True once Zustand persist middleware has rehydrated state from storage.
   * AuthGate must wait for this before redirecting, otherwise isOnboarded
   * may be stale (false) causing a flash redirect to onboarding.
   */
  hasHydrated: boolean;
}

interface AuthActions {
  /** Hydrate auth state from stored tokens on app launch. */
  initialize: () => Promise<void>;
  /** Authenticate with email + password. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Create a new account. Does NOT authenticate — email verification required. */
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  /** Sign out and clear all stored credentials. */
  logout: () => Promise<void>;
  /** Replace the user object in state. */
  setUser: (user: User) => void;
  /** Mark onboarding as complete. */
  completeOnboarding: () => void;
  /** Clear the current error message. */
  clearError: () => void;
  /** Reset the signup pending verification flag. */
  clearSignupPending: () => void;
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
  if (refresh) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  }
}

async function storeAccessToken(access: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
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
  signupPendingVerification: false,
  hasHydrated: false,
};

// ---------------------------------------------------------------------------
// Mock User (dev mode only)
// ---------------------------------------------------------------------------

const DEV_MOCK_USER: User = {
  id: 'dev-user-000',
  email: 'dev@kiaanverse.local',
  name: 'Dev Mode',
  locale: 'en',
  subscriptionTier: 'SIDDHA',
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Error Extraction Helper
// ---------------------------------------------------------------------------

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err != null && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        initialize: async () => {
          set((state) => {
            state.status = 'loading';
            state.isLoading = true;
            state.error = null;
          });

          try {
            const token = await getAccessToken();
            if (!token) {
              set((state) => {
                state.status = 'unauthenticated';
                state.isLoading = false;
              });
              return;
            }

            // Verify the token with a 5s hard cap — if the API is slow or
            // unreachable, fall through to unauthenticated rather than
            // blocking the splash screen for the full 15s axios timeout.
            const user = await Promise.race([
              authService.getCurrentUser(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('auth-init-timeout')), 5000),
              ),
            ]);
            set((state) => {
              state.status = 'authenticated';
              state.user = user;
              state.isOnboarded = true;
              state.isLoading = false;
            });
          } catch {
            // Token invalid, network error, or timeout — clear and re-login.
            await clearTokens();
            set((state) => {
              state.status = 'unauthenticated';
              state.isLoading = false;
            });
          }
        },

        login: async (email, password) => {
          set((state) => {
            state.status = 'loading';
            state.isLoading = true;
            state.error = null;
          });

          try {
            const result = await authService.login(email, password);

            // Store access token in SecureStore
            await storeAccessToken(result.accessToken);

            // Store refresh token if we could extract it from Set-Cookie
            if (result.refreshToken) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken);
            }

            // Build user from the login response (avoid extra /me call)
            const user = authService.mapLoginResponseToUser(result.loginResponse);

            set((state) => {
              state.status = 'authenticated';
              state.user = user;
              state.isOnboarded = true;
              state.isLoading = false;
            });
            return true;
          } catch (err: unknown) {
            set((state) => {
              state.status = 'unauthenticated';
              state.isLoading = false;
              state.error = extractErrorMessage(err);
            });
            return false;
          }
        },

        signup: async (email, password, name) => {
          set((state) => {
            state.status = 'loading';
            state.isLoading = true;
            state.error = null;
            state.signupPendingVerification = false;
          });

          try {
            // Backend signup returns NO tokens — just a confirmation.
            // User must verify email before they can log in.
            const response = await authService.register({
              name,
              email,
              password,
              confirmPassword: password,
            });

            // Signup succeeded — user must verify email before login
            set((state) => {
              state.status = 'unauthenticated';
              state.isLoading = false;
              state.signupPendingVerification = response.email_verification_sent;
            });
            return true;
          } catch (err: unknown) {
            set((state) => {
              state.status = 'unauthenticated';
              state.isLoading = false;
              state.error = extractErrorMessage(err);
            });
            return false;
          }
        },

        logout: async () => {
          await authService.logout();
          await clearTokens();
          set(() => ({ ...initialState, status: 'unauthenticated' as const, hasHydrated: true }));
        },

        setUser: (user) => {
          set((state) => {
            state.user = user;
          });
        },

        completeOnboarding: () => {
          set((state) => {
            state.isOnboarded = true;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        clearSignupPending: () => {
          set((state) => {
            state.signupPendingVerification = false;
          });
        },

        // -----------------------------------------------------------------------
        // Biometric
        // -----------------------------------------------------------------------

        checkBiometricAvailability: async () => {
          try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            set((state) => {
              state.biometricAvailable = hasHardware && isEnrolled;
            });
          } catch {
            set((state) => {
              state.biometricAvailable = false;
            });
          }
        },

        authenticateWithBiometric: async () => {
          const { biometricEnabled, biometricAvailable, isLoading: alreadyLoading } = get();
          if (!biometricEnabled || !biometricAvailable || alreadyLoading) return false;

          set((state) => {
            state.status = 'loading';
            state.isLoading = true;
            state.error = null;
          });

          try {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Authenticate to continue',
              fallbackLabel: 'Use password',
              disableDeviceFallback: false,
            });

            if (!result.success) {
              set((state) => {
                state.status = 'unauthenticated';
                state.isLoading = false;
              });
              return false;
            }

            // Biometric passed — use stored refresh token to get fresh access token
            const refreshToken = await getRefreshToken();

            // Attempt refresh — either via stored token in body or via httpOnly cookie
            const tokens = await authService.refreshTokens(refreshToken);
            await storeAccessToken(tokens.accessToken);

            // Store new refresh token if available
            if (tokens.newRefreshToken) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.newRefreshToken);
            }

            const user = await authService.getCurrentUser();
            set((state) => {
              state.status = 'authenticated';
              state.user = user;
              state.isOnboarded = true;
              state.isLoading = false;
            });
            return true;
          } catch (err: unknown) {
            set((state) => {
              state.status = 'unauthenticated';
              state.isLoading = false;
              state.error = extractErrorMessage(err);
            });
            return false;
          }
        },

        enableBiometric: () => {
          set((state) => {
            state.biometricEnabled = true;
          });
        },

        disableBiometric: () => {
          set((state) => {
            state.biometricEnabled = false;
          });
        },

        // -----------------------------------------------------------------------
        // Developer Mode
        // -----------------------------------------------------------------------

        devLogin: () => {
          if (!__DEV__) return;
          set((state) => {
            state.status = 'authenticated';
            state.user = DEV_MOCK_USER;
            state.isOnboarded = true;
            state.isLoading = false;
            state.error = null;
          });
        },
      })),
      {
        name: 'kiaanverse-auth-state',
        storage: createJSONStorage(() => secureStoreAdapter),
        // Only persist non-sensitive derived state — NOT raw tokens
        partialize: (state) => ({
          user: state.user,
          isOnboarded: state.isOnboarded,
          biometricEnabled: state.biometricEnabled,
        }),
        // Mark hydration complete so AuthGate can wait for persisted isOnboarded
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.hasHydrated = true;
          }
        },
      },
    ),
    {
      name: 'AuthStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
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
      hasHydrated: true,
    });
  },
});
