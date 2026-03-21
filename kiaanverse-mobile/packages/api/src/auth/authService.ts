/**
 * Auth Service — Typed authentication operations for Kiaanverse.
 *
 * Wraps raw API calls with proper error handling, typed responses,
 * and a dedicated AuthError class. Consumers (authStore) use these
 * functions instead of calling apiClient directly, eliminating
 * scattered `as` type casts and ensuring consistent error mapping.
 *
 * Security: No tokens are logged. All sensitive data stays in SecureStore.
 */

import { AxiosError } from 'axios';
import { apiClient } from '../client';
import type { AuthTokens, User, ProfileResponse } from '../types';

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'TOKEN_EXPIRED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

// ---------------------------------------------------------------------------
// AuthError
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: AuthErrorCode;

  constructor(message: string, statusCode: number, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Registration Payload
// ---------------------------------------------------------------------------

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

function mapAxiosError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;

  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const detail =
      err.response?.data?.detail ??
      err.response?.data?.message ??
      err.message;

    if (!err.response) {
      return new AuthError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR',
      );
    }

    if (status === 401) {
      return new AuthError(
        detail ?? 'Invalid email or password.',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    if (status === 409) {
      return new AuthError(
        detail ?? 'This email is already registered.',
        409,
        'EMAIL_TAKEN',
      );
    }

    if (status === 422) {
      return new AuthError(
        detail ?? 'Please check your input.',
        422,
        'VALIDATION_ERROR',
      );
    }

    return new AuthError(
      detail ?? 'Something went wrong. Please try again.',
      status,
      'UNKNOWN',
    );
  }

  if (err instanceof Error) {
    return new AuthError(err.message, 0, 'UNKNOWN');
  }

  return new AuthError('Something went wrong. Please try again.', 0, 'UNKNOWN');
}

function mapProfileToUser(profile: ProfileResponse): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? '',
    locale: profile.locale ?? 'en',
    subscriptionTier: (profile.subscription_tier?.toUpperCase() ?? 'FREE') as User['subscriptionTier'],
    createdAt: profile.created_at,
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Authenticate with email and password.
 * Returns access + refresh token pair on success.
 */
async function login(email: string, password: string): Promise<AuthTokens> {
  try {
    const { data } = await apiClient.post<AuthTokens>(
      '/api/auth/login',
      { email, password },
    );
    return data;
  } catch (err) {
    throw mapAxiosError(err);
  }
}

/**
 * Create a new account.
 * Validates that password and confirmPassword match before calling the API.
 */
async function register(payload: RegisterData): Promise<AuthTokens> {
  if (payload.password !== payload.confirmPassword) {
    throw new AuthError('Passwords do not match.', 422, 'VALIDATION_ERROR');
  }

  try {
    const { data } = await apiClient.post<AuthTokens>(
      '/api/auth/signup',
      {
        name: payload.name,
        email: payload.email,
        password: payload.password,
      },
    );
    return data;
  } catch (err) {
    throw mapAxiosError(err);
  }
}

/**
 * Exchange a refresh token for a new access + refresh pair.
 */
async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    const { data } = await apiClient.post<AuthTokens>(
      '/api/auth/refresh',
      { refresh_token: refreshToken },
    );
    return data;
  } catch (err) {
    throw mapAxiosError(err);
  }
}

/**
 * Best-effort server-side logout. Swallows errors so the client
 * can always clear local state regardless of server reachability.
 */
async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch {
    // Best-effort — local token cleanup happens in the store
  }
}

/**
 * Fetch the currently authenticated user's profile.
 * Maps the snake_case API response to the camelCase User type.
 */
async function getCurrentUser(): Promise<User> {
  try {
    const { data } = await apiClient.get<ProfileResponse>('/api/auth/me');
    return mapProfileToUser(data);
  } catch (err) {
    throw mapAxiosError(err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const authService = {
  login,
  register,
  refreshTokens,
  logout,
  getCurrentUser,
} as const;
