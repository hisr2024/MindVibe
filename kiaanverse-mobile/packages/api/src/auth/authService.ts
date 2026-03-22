/**
 * Auth Service — Typed authentication operations for Kiaanverse.
 *
 * Wraps raw API calls with proper error handling and typed responses that
 * match the actual backend Pydantic schemas (LoginOut, SignupOut, MeOut, RefreshOut).
 *
 * Key backend contract details:
 * - Login returns access_token in body; refresh_token is httpOnly cookie only
 * - Signup returns NO tokens (user must verify email before login)
 * - Refresh accepts refresh_token from cookie OR body; returns access_token
 * - /api/auth/me returns user_id (not id), no name/locale/created_at
 *
 * Security: No tokens logged. All sensitive data stays in SecureStore.
 */

import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '../client';
import { AuthError } from '../errors';
import type {
  User,
  LoginResponse,
  SignupResponse,
  MeResponse,
  RefreshResponse,
} from '../types';

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
// Login Result (includes extracted tokens)
// ---------------------------------------------------------------------------

export interface LoginResult {
  loginResponse: LoginResponse;
  /** Access token from the response body */
  accessToken: string;
  /**
   * Refresh token extracted from Set-Cookie header.
   * May be null if the header is not exposed by the native HTTP stack.
   */
  refreshToken: string | null;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

function mapAxiosError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;

  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as Record<string, unknown> | undefined;

    // Backend error format: {detail: string, code: string, field?: string}
    let detail = '';
    const errorCode = typeof data?.code === 'string' ? data.code : '';

    if (data?.detail !== undefined) {
      if (typeof data.detail === 'string') {
        detail = data.detail;
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        const detailObj = data.detail as Record<string, unknown>;
        detail = typeof detailObj.message === 'string' ? detailObj.message : JSON.stringify(data.detail);
      } else if (Array.isArray(data.detail)) {
        detail = 'Please check your input.';
      }
    } else if (data?.message !== undefined && typeof data.message === 'string') {
      detail = data.message;
    }

    if (!err.response) {
      return new AuthError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR',
      );
    }

    if (status === 401) {
      return new AuthError(
        detail || 'Invalid email or password.',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    if (status === 403 && (errorCode === 'EMAIL_NOT_VERIFIED' || detail === 'email_not_verified')) {
      return new AuthError(
        'Please verify your email before signing in. Check your inbox.',
        403,
        'EMAIL_NOT_VERIFIED',
      );
    }

    if (status === 409) {
      return new AuthError(
        detail || 'This email is already registered.',
        409,
        'EMAIL_TAKEN',
      );
    }

    if (status === 422) {
      return new AuthError(
        detail || 'Please check your input.',
        422,
        'VALIDATION_ERROR',
      );
    }

    return new AuthError(
      detail || 'Something went wrong. Please try again.',
      status,
      'UNKNOWN',
    );
  }

  if (err instanceof Error) {
    return new AuthError(err.message, 0, 'UNKNOWN');
  }

  return new AuthError('Something went wrong. Please try again.', 0, 'UNKNOWN');
}

/**
 * Extract refresh_token from the Set-Cookie response header.
 *
 * React Native's native HTTP stack may or may not expose Set-Cookie headers
 * depending on the platform and version. This is best-effort — if we can't
 * extract it, the native cookie jar still stores it for subsequent requests.
 */
function extractRefreshTokenFromResponse(response: AxiosResponse): string | null {
  const setCookieHeader = response.headers['set-cookie'];
  if (!setCookieHeader) return null;

  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookie of cookies) {
    const match = /refresh_token=([^;]+)/.exec(cookie);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Map the /api/auth/me response to the User type.
 * Backend returns user_id (not id) and does NOT include name/locale/created_at.
 */
function mapMeResponseToUser(me: MeResponse): User {
  return {
    id: me.user_id,
    email: me.email,
    name: '', // Not available from /api/auth/me
    locale: 'en', // Default — not available from /api/auth/me
    subscriptionTier: (me.subscription_tier?.toUpperCase() ?? 'FREE') as User['subscriptionTier'],
    createdAt: '', // Not available from /api/auth/me
  };
}

/**
 * Map the LoginResponse to a partial User (for immediate use after login).
 */
function mapLoginResponseToUser(res: LoginResponse): User {
  return {
    id: res.user?.id ?? '',
    email: res.user?.email ?? '',
    name: res.user?.name ?? '',
    locale: 'en',
    subscriptionTier: (res.subscription_tier?.toUpperCase() ?? 'FREE') as User['subscriptionTier'],
    createdAt: '',
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Authenticate with email and password.
 *
 * Backend returns access_token in the response body.
 * Refresh token is set as an httpOnly cookie — we try to extract it
 * from the Set-Cookie header for SecureStore storage.
 */
async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      { email, password },
    );

    const refreshToken = extractRefreshTokenFromResponse(response);

    return {
      loginResponse: response.data,
      accessToken: response.data.access_token,
      refreshToken,
    };
  } catch (err) {
    throw mapAxiosError(err);
  }
}

/**
 * Create a new account.
 *
 * Backend accepts {email, password} — name is NOT a backend field (ignored).
 * Returns SignupResponse with NO tokens. User must verify email before login.
 * Validates confirmPassword match client-side.
 */
async function register(payload: RegisterData): Promise<SignupResponse> {
  if (payload.password !== payload.confirmPassword) {
    throw new AuthError('Passwords do not match.', 422, 'VALIDATION_ERROR');
  }

  try {
    const { data } = await apiClient.post<SignupResponse>(
      '/api/auth/signup',
      {
        email: payload.email,
        password: payload.password,
        // name is NOT a backend field but we send it anyway;
        // Pydantic will ignore extra fields
        name: payload.name,
      },
    );
    return data;
  } catch (err) {
    throw mapAxiosError(err);
  }
}

/**
 * Refresh the access token.
 *
 * Sends refresh_token in the body (if provided) OR relies on the httpOnly
 * cookie being sent automatically via withCredentials.
 * Returns new access_token. New refresh_token is rotated via Set-Cookie.
 */
async function refreshTokens(refreshToken?: string | null): Promise<{
  accessToken: string;
  newRefreshToken: string | null;
}> {
  try {
    const response = await apiClient.post<RefreshResponse>(
      '/api/auth/refresh',
      refreshToken ? { refresh_token: refreshToken } : {},
    );

    const newRefreshFromCookie = extractRefreshTokenFromResponse(response);

    return {
      accessToken: response.data.access_token,
      // Prefer the body refresh_token (if backend enables it), else extract from cookie
      newRefreshToken: response.data.refresh_token ?? newRefreshFromCookie,
    };
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
 * Fetch the currently authenticated user's session info.
 * Maps the backend MeOut response to the frontend User type.
 */
async function getCurrentUser(): Promise<User> {
  try {
    const { data } = await apiClient.get<MeResponse>('/api/auth/me');
    return mapMeResponseToUser(data);
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
  mapLoginResponseToUser,
} as const;
