/**
 * Auth Store — Unit Tests
 *
 * Tests the full authentication lifecycle: login, logout, signup,
 * initialize (hydration), biometric auth, and developer mode bypass.
 *
 * All external dependencies (SecureStore, LocalAuthentication, authService)
 * are mocked in ./setup.ts. These tests verify state transitions only.
 */

import { useAuthStore, type AuthStatus } from '../authStore';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { authService } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = {
  status: 'idle' as AuthStatus,
  user: null,
  isOnboarded: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
  biometricAvailable: false,
  signupPendingVerification: false,
};

function resetStore() {
  useAuthStore.setState(initialState);
}

const mockUser = {
  id: 'user-abc',
  email: 'test@kiaanverse.app',
  name: '',
  locale: 'en',
  subscriptionTier: 'FREE' as const,
  createdAt: '',
};

const mockLoginResponse = {
  access_token: 'access-123',
  token_type: 'bearer',
  session_id: 'session-1',
  expires_in: 3600,
  user_id: 'user-abc',
  email: 'test@kiaanverse.app',
  email_verified: true,
  subscription_tier: 'FREE',
  subscription_status: 'active',
  is_developer: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('should transition to authenticated on successful login', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        loginResponse: mockLoginResponse,
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      });
      (authService.mapLoginResponseToUser as jest.Mock).mockReturnValue(mockUser);

      const result = await useAuthStore.getState().login('test@kiaanverse.app', 'password123');

      expect(result).toBe(true);

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(mockUser);
      expect(state.isOnboarded).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Verify tokens stored in SecureStore
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kiaanverse_access_token',
        'access-123',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kiaanverse_refresh_token',
        'refresh-456',
      );
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      (authService.login as jest.Mock).mockReturnValue(loginPromise);

      const loginCall = useAuthStore.getState().login('test@kiaanverse.app', 'password123');

      // Check intermediate loading state
      expect(useAuthStore.getState().status).toBe('loading');
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve so the promise doesn't hang
      (authService.mapLoginResponseToUser as jest.Mock).mockReturnValue(mockUser);
      resolveLogin!({
        loginResponse: mockLoginResponse,
        accessToken: 'access-123',
        refreshToken: null,
      });

      await loginCall;
    });

    it('should transition to unauthenticated on login failure', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid email or password.'),
      );

      const result = await useAuthStore.getState().login('bad@email.com', 'wrong');

      expect(result).toBe(false);

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid email or password.');
    });

    it('should handle login without refresh token (cookie-only)', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        loginResponse: mockLoginResponse,
        accessToken: 'access-123',
        refreshToken: null,
      });
      (authService.mapLoginResponseToUser as jest.Mock).mockReturnValue(mockUser);

      await useAuthStore.getState().login('test@kiaanverse.app', 'password123');

      // Should store access token but not call setItemAsync for refresh
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kiaanverse_access_token',
        'access-123',
      );
      // refresh_token setItemAsync should NOT have been called (only access_token)
      const refreshCalls = (SecureStore.setItemAsync as jest.Mock).mock.calls.filter(
        (call: string[]) => call[0] === 'kiaanverse_refresh_token',
      );
      expect(refreshCalls).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    it('should clear all auth state and tokens', async () => {
      // First set authenticated state
      useAuthStore.setState({
        status: 'authenticated',
        user: mockUser,
        isOnboarded: true,
        isLoading: false,
        error: null,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Verify server logout called
      expect(authService.logout).toHaveBeenCalled();

      // Verify tokens cleared from SecureStore
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kiaanverse_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kiaanverse_refresh_token');
    });
  });

  // -------------------------------------------------------------------------
  // Signup
  // -------------------------------------------------------------------------

  describe('signup', () => {
    it('should set signupPendingVerification on success', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        user_id: 'new-user-1',
        email: 'new@kiaanverse.app',
        policy_passed: true,
        subscription_tier: 'FREE',
        email_verification_sent: true,
      });

      const result = await useAuthStore.getState().signup(
        'new@kiaanverse.app',
        'password123',
        'New User',
      );

      expect(result).toBe(true);

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.signupPendingVerification).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should set error on signup failure', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('This email is already registered.'),
      );

      const result = await useAuthStore.getState().signup(
        'existing@kiaanverse.app',
        'password123',
        'Name',
      );

      expect(result).toBe(false);

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBe('This email is already registered.');
      expect(state.signupPendingVerification).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Initialize (token hydration)
  // -------------------------------------------------------------------------

  describe('initialize', () => {
    it('should authenticate when valid token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-access-token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(mockUser);
      expect(state.isOnboarded).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set unauthenticated when no token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should clear tokens and set unauthenticated when token is invalid', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('expired-token');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Token expired'),
      );

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kiaanverse_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('kiaanverse_refresh_token');
    });
  });

  // -------------------------------------------------------------------------
  // Biometric
  // -------------------------------------------------------------------------

  describe('checkBiometricAvailability', () => {
    it('should set biometricAvailable true when hardware+enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      await useAuthStore.getState().checkBiometricAvailability();

      expect(useAuthStore.getState().biometricAvailable).toBe(true);
    });

    it('should set biometricAvailable false when no hardware', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      await useAuthStore.getState().checkBiometricAvailability();

      expect(useAuthStore.getState().biometricAvailable).toBe(false);
    });

    it('should set biometricAvailable false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      await useAuthStore.getState().checkBiometricAvailability();

      expect(useAuthStore.getState().biometricAvailable).toBe(false);
    });

    it('should set biometricAvailable false on error', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error('Device error'),
      );

      await useAuthStore.getState().checkBiometricAvailability();

      expect(useAuthStore.getState().biometricAvailable).toBe(false);
    });
  });

  describe('enableBiometric / disableBiometric', () => {
    it('should toggle biometricEnabled', () => {
      expect(useAuthStore.getState().biometricEnabled).toBe(false);

      useAuthStore.getState().enableBiometric();
      expect(useAuthStore.getState().biometricEnabled).toBe(true);

      useAuthStore.getState().disableBiometric();
      expect(useAuthStore.getState().biometricEnabled).toBe(false);
    });
  });

  describe('authenticateWithBiometric', () => {
    it('should authenticate when biometric succeeds and refresh works', async () => {
      // Enable biometric first
      useAuthStore.setState({
        biometricEnabled: true,
        biometricAvailable: true,
      });

      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-refresh');
      (authService.refreshTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token',
        newRefreshToken: 'new-refresh-token',
      });
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await useAuthStore.getState().authenticateWithBiometric();

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(mockUser);
    });

    it('should return false when biometric is not enabled', async () => {
      useAuthStore.setState({
        biometricEnabled: false,
        biometricAvailable: true,
      });

      const result = await useAuthStore.getState().authenticateWithBiometric();

      expect(result).toBe(false);
    });

    it('should return false when biometric prompt fails', async () => {
      useAuthStore.setState({
        biometricEnabled: true,
        biometricAvailable: true,
      });

      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
      });

      const result = await useAuthStore.getState().authenticateWithBiometric();

      expect(result).toBe(false);
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('should set error when refresh fails after biometric', async () => {
      useAuthStore.setState({
        biometricEnabled: true,
        biometricAvailable: true,
      });

      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-refresh');
      (authService.refreshTokens as jest.Mock).mockRejectedValue(
        new Error('Refresh failed'),
      );

      const result = await useAuthStore.getState().authenticateWithBiometric();

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBe('Refresh failed');
    });
  });

  // -------------------------------------------------------------------------
  // State Helpers
  // -------------------------------------------------------------------------

  describe('setUser', () => {
    it('should replace user object', () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('completeOnboarding', () => {
    it('should set isOnboarded to true', () => {
      expect(useAuthStore.getState().isOnboarded).toBe(false);
      useAuthStore.getState().completeOnboarding();
      expect(useAuthStore.getState().isOnboarded).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error message', () => {
      useAuthStore.setState({ error: 'Some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('clearSignupPending', () => {
    it('should reset the signup pending verification flag', () => {
      useAuthStore.setState({ signupPendingVerification: true });
      useAuthStore.getState().clearSignupPending();
      expect(useAuthStore.getState().signupPendingVerification).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Dev Login
  // -------------------------------------------------------------------------

  describe('devLogin', () => {
    it('should set mock user in dev mode', () => {
      useAuthStore.getState().devLogin();

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('dev@kiaanverse.local');
      expect(state.isOnboarded).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });
});
