/**
 * Auth Service — Unit Tests
 *
 * Tests authService functions using mocked apiClient (axios).
 * The apiClient is mocked in ./setup.ts — each test configures
 * mock responses via jest.Mock for predictable behavior.
 */

import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '../client';
import { authService } from '../auth/authService';
import { AuthError } from '../errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;

function mockAxiosResponse<T>(data: T, status = 200, headers: Record<string, unknown> = {}): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers,
    config: {} as AxiosResponse['config'],
  };
}

function mockAxiosError(status: number, data: Record<string, unknown>): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: 'Error',
    data,
    headers: {},
    config: {} as AxiosResponse['config'],
  };
  return error;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('should return LoginResult with accessToken on success', async () => {
      const loginData = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        session_id: 'session-mock-1',
        expires_in: 3600,
        user_id: 'user-mock-1',
        email: 'test@kiaanverse.app',
        email_verified: true,
        subscription_tier: 'FREE',
        subscription_status: 'active',
        is_developer: false,
      };

      mockPost.mockResolvedValue(mockAxiosResponse(loginData));

      const result = await authService.login('test@kiaanverse.app', 'password123');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.loginResponse.user_id).toBe('user-mock-1');
      expect(result.loginResponse.email).toBe('test@kiaanverse.app');
      expect(result.loginResponse.token_type).toBe('bearer');

      expect(mockPost).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@kiaanverse.app',
        password: 'password123',
      });
    });

    it('should extract refresh token from Set-Cookie header', async () => {
      const loginData = {
        access_token: 'tok',
        token_type: 'bearer',
        session_id: 'sess',
        expires_in: 3600,
        user_id: 'u1',
        email: 'e@e.com',
        email_verified: true,
        subscription_tier: 'FREE',
        subscription_status: 'active',
        is_developer: false,
      };

      mockPost.mockResolvedValue(
        mockAxiosResponse(loginData, 200, {
          'set-cookie': ['refresh_token=rt-abc123; HttpOnly; Path=/; Secure'],
        }),
      );

      const result = await authService.login('e@e.com', 'pass');

      expect(result.refreshToken).toBe('rt-abc123');
    });

    it('should throw AuthError with INVALID_CREDENTIALS on 401', async () => {
      mockPost.mockRejectedValue(
        mockAxiosError(401, { detail: 'Invalid email or password.' }),
      );

      await expect(
        authService.login('bad@email.com', 'wrong'),
      ).rejects.toThrow(AuthError);

      try {
        await authService.login('bad@email.com', 'wrong');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).authCode).toBe('INVALID_CREDENTIALS');
        expect((err as AuthError).statusCode).toBe(401);
      }
    });

    it('should throw AuthError with EMAIL_NOT_VERIFIED on 403', async () => {
      mockPost.mockRejectedValue(
        mockAxiosError(403, { detail: 'email_not_verified' }),
      );

      try {
        await authService.login('unverified@email.com', 'password');
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).authCode).toBe('EMAIL_NOT_VERIFIED');
      }
    });
  });

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------

  describe('register', () => {
    it('should return SignupResponse on success', async () => {
      const signupData = {
        user_id: 'user-new-1',
        email: 'new@kiaanverse.app',
        policy_passed: true,
        subscription_tier: 'FREE',
        email_verification_sent: true,
      };

      mockPost.mockResolvedValue(mockAxiosResponse(signupData, 201));

      const result = await authService.register({
        name: 'Test User',
        email: 'new@kiaanverse.app',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.user_id).toBe('user-new-1');
      expect(result.email_verification_sent).toBe(true);
    });

    it('should throw AuthError with EMAIL_TAKEN on 409', async () => {
      mockPost.mockRejectedValue(
        mockAxiosError(409, { detail: 'This email is already registered.' }),
      );

      await expect(
        authService.register({
          name: 'Test',
          email: 'existing@kiaanverse.app',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      ).rejects.toThrow(AuthError);

      try {
        await authService.register({
          name: 'Test',
          email: 'existing@kiaanverse.app',
          password: 'password123',
          confirmPassword: 'password123',
        });
      } catch (err) {
        expect((err as AuthError).authCode).toBe('EMAIL_TAKEN');
      }
    });

    it('should throw AuthError on password mismatch (client-side)', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'test@kiaanverse.app',
          password: 'password123',
          confirmPassword: 'differentPassword',
        }),
      ).rejects.toThrow('Passwords do not match.');

      // Should not call the API
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // refreshTokens
  // -------------------------------------------------------------------------

  describe('refreshTokens', () => {
    it('should return new access token', async () => {
      mockPost.mockResolvedValue(
        mockAxiosResponse({
          access_token: 'mock-refreshed-access',
          token_type: 'bearer',
          expires_in: 3600,
          session_id: 'sess-r',
          refresh_token: null,
        }),
      );

      const result = await authService.refreshTokens('old-refresh-token');

      expect(result.accessToken).toBe('mock-refreshed-access');
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh', {
        refresh_token: 'old-refresh-token',
      });
    });

    it('should work without a refresh token (cookie-only)', async () => {
      mockPost.mockResolvedValue(
        mockAxiosResponse({
          access_token: 'mock-refreshed-access',
          token_type: 'bearer',
          expires_in: 3600,
          session_id: 'sess-r',
          refresh_token: null,
        }),
      );

      const result = await authService.refreshTokens(null);

      expect(result.accessToken).toBe('mock-refreshed-access');
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh', {});
    });
  });

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    it('should not throw on success', async () => {
      mockPost.mockResolvedValue(mockAxiosResponse({ detail: 'Logged out' }));

      await expect(authService.logout()).resolves.toBeUndefined();
    });

    it('should not throw on server error (best-effort)', async () => {
      mockPost.mockRejectedValue(
        mockAxiosError(500, { detail: 'Server error' }),
      );

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // getCurrentUser
  // -------------------------------------------------------------------------

  describe('getCurrentUser', () => {
    it('should map MeResponse to User type', async () => {
      mockGet.mockResolvedValue(
        mockAxiosResponse({
          user_id: 'user-mock-1',
          email: 'test@kiaanverse.app',
          email_verified: true,
          session_id: 'session-mock-1',
          session_active: true,
          session_expires_at: new Date(Date.now() + 3600_000).toISOString(),
          session_last_used_at: new Date().toISOString(),
          access_token_expires_in: 3600,
          subscription_tier: 'FREE',
          subscription_status: 'active',
          is_developer: false,
        }),
      );

      const user = await authService.getCurrentUser();

      // Backend returns user_id, service maps to id
      expect(user.id).toBe('user-mock-1');
      expect(user.email).toBe('test@kiaanverse.app');
      expect(user.subscriptionTier).toBe('FREE');
      // name and createdAt not available from /me endpoint
      expect(user.name).toBe('');
      expect(user.createdAt).toBe('');
    });

    it('should throw AuthError on 401', async () => {
      mockGet.mockRejectedValue(
        mockAxiosError(401, { detail: 'Not authenticated' }),
      );

      await expect(authService.getCurrentUser()).rejects.toThrow(AuthError);
    });
  });

  // -------------------------------------------------------------------------
  // mapLoginResponseToUser
  // -------------------------------------------------------------------------

  describe('mapLoginResponseToUser', () => {
    it('should map LoginResponse fields to User', () => {
      const loginResponse = {
        access_token: 'tok',
        token_type: 'bearer',
        session_id: 'sess',
        expires_in: 3600,
        user_id: 'user-42',
        email: 'mapped@kiaanverse.app',
        email_verified: true,
        subscription_tier: 'SIDDHA',
        subscription_status: 'active',
        is_developer: false,
      };

      const user = authService.mapLoginResponseToUser(loginResponse);

      expect(user.id).toBe('user-42');
      expect(user.email).toBe('mapped@kiaanverse.app');
      expect(user.subscriptionTier).toBe('SIDDHA');
    });
  });
});
