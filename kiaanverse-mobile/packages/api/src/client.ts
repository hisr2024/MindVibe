/**
 * API Client Factory for Kiaanverse
 *
 * Axios-based client with:
 * - JWT auto-attach via request interceptor (Authorization: Bearer header)
 * - withCredentials: true for automatic cookie management (refresh_token)
 * - 401 refresh token rotation with concurrent request deduplication
 * - 403 → dispatch logout via onAuthFailure callback
 * - 500 → log to Sentry (optional dependency)
 * - Network error → throw OfflineError
 * - Exponential backoff retry for transient failures (408, 429, 502, 503, 504)
 * - __DEV__ request/response logging
 *
 * Backend contract:
 * - Access token: stored in SecureStore, sent via Authorization header
 * - Refresh token: managed as httpOnly cookie by the native HTTP stack,
 *   also stored in SecureStore as fallback (sent in request body to /api/auth/refresh)
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from './config';
import { ApiError, AuthError, OfflineError } from './errors';
import type { TokenManager, RefreshResponse } from './types';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Sentry (optional — soft dependency)
// ---------------------------------------------------------------------------

interface SentryLike {
  captureException(error: unknown, hint?: { extra?: Record<string, unknown> }): void;
}

let _sentry: SentryLike | null | undefined;

function getSentry(): SentryLike | null {
  if (_sentry !== undefined) return _sentry;
  try {
    _sentry = require('@sentry/react-native') as SentryLike;
  } catch {
    _sentry = null;
  }
  return _sentry;
}

// ---------------------------------------------------------------------------
// Token Manager (pluggable — set by the app on startup)
// ---------------------------------------------------------------------------

let tokenManager: TokenManager = {
  getAccessToken: async () => null,
  getRefreshToken: async () => null,
  setTokens: async () => {},
  clearTokens: async () => {},
};

export function setTokenManager(manager: TokenManager): void {
  tokenManager = manager;
}

// ---------------------------------------------------------------------------
// Cookie Extraction Helper
// ---------------------------------------------------------------------------

/**
 * Extract refresh_token from Set-Cookie header (best-effort).
 * React Native may or may not expose this header depending on platform.
 */
function extractRefreshTokenFromHeaders(headers: Record<string, unknown>): string | null {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;

  const cookies = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
  for (const cookie of cookies) {
    const match = /refresh_token=([^;]+)/.exec(String(cookie));
    if (match?.[1]) return match[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

const TRANSIENT_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

function isTransientError(error: AxiosError): boolean {
  if (!error.response) return true; // Network error
  return TRANSIENT_STATUS_CODES.has(error.response.status);
}

function getRetryDelay(attempt: number): number {
  const delay = API_CONFIG.retryBaseDelay * Math.pow(2, attempt);
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, API_CONFIG.retryMaxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Error Wrapping
// ---------------------------------------------------------------------------

/**
 * Parse a FastAPI error response into a structured ApiError.
 * FastAPI shape: { detail: string | { error, message, ... }, code?, field? }
 */
function wrapAxiosError(error: AxiosError): ApiError | OfflineError {
  if (!error.response) {
    return new OfflineError();
  }

  const status = error.response.status;
  const data = error.response.data as Record<string, unknown> | undefined;

  let message = 'An unexpected error occurred.';
  let code = 'UNKNOWN';
  let field: string | undefined;

  if (data) {
    // Extract message from FastAPI detail field
    if (typeof data.detail === 'string') {
      message = data.detail;
    } else if (typeof data.detail === 'object' && data.detail !== null) {
      const detailObj = data.detail as Record<string, unknown>;
      if (typeof detailObj.message === 'string') message = detailObj.message;
      if (typeof detailObj.error === 'string') code = detailObj.error;
    }

    // Extract code and field
    if (typeof data.code === 'string') code = data.code;
    if (typeof data.field === 'string') field = data.field;
  }

  return new ApiError(message, status, code, field);
}

// ---------------------------------------------------------------------------
// Client Factory
// ---------------------------------------------------------------------------

interface RequestConfigWithMeta extends InternalAxiosRequestConfig {
  _retryCount?: number | undefined;
  _isRefreshRequest?: boolean | undefined;
  _startTime?: number | undefined;
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    // Enable cookies so the native HTTP stack sends httpOnly refresh_token
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'kiaanverse-mobile',
      'X-Client-Version': '1.0.0',
    },
  });

  // -----------------------------------------------------------------------
  // Request interceptor: attach JWT + __DEV__ logging
  // -----------------------------------------------------------------------
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        (config as RequestConfigWithMeta)._startTime = Date.now();
        // eslint-disable-next-line no-console
        console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // -----------------------------------------------------------------------
  // Response interceptor: __DEV__ logging for successful responses
  // -----------------------------------------------------------------------
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const meta = response.config as RequestConfigWithMeta;
        const duration = meta._startTime ? Date.now() - meta._startTime : 0;
        // eslint-disable-next-line no-console
        console.log(`← ${response.status} ${response.config.url} (${duration}ms)`);
      }
      return response;
    },
  );

  // -----------------------------------------------------------------------
  // Response interceptor: error handling
  // -----------------------------------------------------------------------
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  function subscribeTokenRefresh(cb: (token: string) => void): void {
    refreshSubscribers.push(cb);
  }

  function onRefreshed(token: string): void {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
  }

  client.interceptors.response.use(
    undefined,
    async (error: AxiosError) => {
      const originalRequest = error.config as RequestConfigWithMeta | undefined;
      if (!originalRequest) return Promise.reject(wrapAxiosError(error));

      // __DEV__ error logging
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const duration = originalRequest._startTime ? Date.now() - originalRequest._startTime : 0;
        const status = error.response?.status ?? 'NETWORK';
        // eslint-disable-next-line no-console
        console.log(`← ${status} ${originalRequest.url} (${duration}ms) ERROR`);
      }

      // Don't process errors on the refresh endpoint itself to avoid infinite loops
      if (originalRequest._isRefreshRequest) {
        return Promise.reject(wrapAxiosError(error));
      }

      // --- Network error → OfflineError ---
      if (!error.response) {
        return Promise.reject(new OfflineError());
      }

      const status = error.response.status;

      // --- 401 → token refresh (max 1 retry) ---
      if (status === 401) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(client(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const storedRefreshToken = await tokenManager.getRefreshToken();

          const refreshResponse = await axios.post<RefreshResponse>(
            `${API_CONFIG.baseURL}/api/auth/refresh`,
            storedRefreshToken ? { refresh_token: storedRefreshToken } : {},
            { withCredentials: true },
          );

          const newAccessToken = refreshResponse.data.access_token;

          const newRefreshToken =
            refreshResponse.data.refresh_token ??
            extractRefreshTokenFromHeaders(refreshResponse.headers as Record<string, unknown>) ??
            storedRefreshToken ??
            '';

          await tokenManager.setTokens(newAccessToken, newRefreshToken);
          onRefreshed(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return client(originalRequest);
        } catch {
          await tokenManager.clearTokens();
          tokenManager.onAuthFailure?.();
          return Promise.reject(
            new AuthError('Session expired. Please sign in again.', 401, 'TOKEN_EXPIRED'),
          );
        } finally {
          isRefreshing = false;
        }
      }

      // --- 403 → check reason before forcing logout ---
      if (status === 403) {
        const data403 = error.response.data as Record<string, unknown> | undefined;
        const detail403 = typeof data403?.detail === 'string' ? data403.detail : '';

        // Email not verified is NOT an authorization failure — let the caller handle it
        if (detail403 === 'email_not_verified') {
          return Promise.reject(wrapAxiosError(error));
        }

        // True authorization failure — force logout
        await tokenManager.clearTokens();
        tokenManager.onAuthFailure?.();
        return Promise.reject(
          new AuthError('Access denied. Please sign in again.', 403, 'UNKNOWN'),
        );
      }

      // --- 500 → log to Sentry ---
      if (status >= 500) {
        const sentry = getSentry();
        if (sentry) {
          sentry.captureException(error, {
            extra: {
              url: originalRequest.url,
              method: originalRequest.method,
              status,
            },
          });
        }
      }

      // --- Transient errors → retry with backoff ---
      if (isTransientError(error)) {
        const retryCount = originalRequest._retryCount ?? 0;

        if (retryCount < API_CONFIG.maxRetries) {
          originalRequest._retryCount = retryCount + 1;
          const delay = getRetryDelay(retryCount);
          await sleep(delay);
          return client(originalRequest);
        }
      }

      // --- All other errors → wrap in ApiError ---
      return Promise.reject(wrapAxiosError(error));
    },
  );

  return client;
}

export const apiClient = createApiClient();
