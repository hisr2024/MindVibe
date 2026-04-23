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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- lazy to avoid hard dep
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

/**
 * Read the current access token via the registered TokenManager.
 *
 * Exposed for transports that bypass the axios interceptor (e.g. SSE over
 * XHR) and therefore cannot piggy-back on the apiClient's built-in
 * Authorization header injection. Callers get the exact same token that a
 * normal apiClient POST would attach, which guarantees the streaming
 * endpoint sees the same identity as non-streaming chat.
 *
 * Returns null when the app is not authenticated, when the token manager
 * has not been configured yet, or when SecureStore throws.
 */
export async function getCurrentAccessToken(): Promise<string | null> {
  try {
    const token = await tokenManager.getAccessToken();
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Attempt to refresh the access token via the registered TokenManager.
 * Returns the new access token on success, or null if no refresh token
 * is available / the refresh call fails. Safe to call when already
 * unauthenticated — it just returns null.
 *
 * Uses a raw axios.post (not `apiClient`) so it bypasses the response
 * interceptor and can never loop on a refresh that itself returns 401.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return null;
    const response = await axios.post<RefreshResponse>(
      `${API_CONFIG.baseURL}/api/auth/refresh`,
      { refresh_token: refreshToken },
      { withCredentials: true, timeout: API_CONFIG.timeout },
    );
    const newAccess = response.data?.access_token;
    const newRefresh = response.data?.refresh_token ?? refreshToken;
    if (!newAccess) return null;
    await tokenManager.setTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
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
      'Accept': 'application/json',
      'X-Client': 'kiaanverse-mobile',
      'X-Client-Version': '1.0.0',
    },
  });

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[API] baseURL=${API_CONFIG.baseURL} timeout=${API_CONFIG.timeout}ms`);
  }

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
        // Include the absolute URL so misconfigured baseURLs are obvious at a
        // glance, and flag missing auth which is the most common "why does
        // the chat return fallback text?" root cause.
        const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
        const auth = token ? 'Bearer ***' : 'NONE';
        // eslint-disable-next-line no-console
        console.log(`→ ${config.method?.toUpperCase()} ${fullUrl}  auth=${auth}`);
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

      // __DEV__ error logging — surface the body so callers can see the real
      // FastAPI detail (e.g. "thought is required") instead of a generic
      // fallback string from the UI layer.
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const duration = originalRequest._startTime ? Date.now() - originalRequest._startTime : 0;
        const status = error.response?.status ?? 'NETWORK';
        const fullUrl = `${originalRequest.baseURL ?? ''}${originalRequest.url ?? ''}`;
        let bodyPreview = '';
        try {
          const body = error.response?.data;
          if (body !== undefined) {
            const serialised = typeof body === 'string' ? body : JSON.stringify(body);
            bodyPreview = ` body=${serialised.slice(0, 400)}`;
          }
        } catch {
          bodyPreview = '';
        }
        // eslint-disable-next-line no-console
        console.log(`← ${status} ${fullUrl} (${duration}ms) ERROR${bodyPreview}`);
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

      // --- 403 → only force-logout for actual auth failures ---
      if (status === 403) {
        const data403 = error.response.data as Record<string, unknown> | undefined;
        const detail403 = typeof data403?.detail === 'string' ? data403.detail : '';
        const code403 = typeof data403?.code === 'string' ? data403.code : '';

        // Codes that indicate a true auth/session failure (warrant logout)
        const AUTH_FAILURE_DETAILS = ['token_revoked', 'account_disabled', 'session_invalid'];
        const isAuthFailure = AUTH_FAILURE_DETAILS.includes(detail403) || code403 === 'AUTH_FAILURE';

        // Feature-gated 403s, rate-limit 403s, CSRF 403s, and email_not_verified
        // should NOT force logout — let the calling code handle them.
        if (!isAuthFailure) {
          return Promise.reject(wrapAxiosError(error));
        }

        // True authorization failure — force logout
        await tokenManager.clearTokens();
        tokenManager.onAuthFailure?.();
        const knownAuthCodes = [
          'INVALID_CREDENTIALS',
          'EMAIL_NOT_VERIFIED',
          'EMAIL_TAKEN',
          'TOKEN_EXPIRED',
          'NETWORK_ERROR',
          'VALIDATION_ERROR',
          'ACCOUNT_LOCKED',
          'UNKNOWN',
        ] as const;
        type KnownAuthCode = (typeof knownAuthCodes)[number];
        const isKnownAuthCode = (v: string): v is KnownAuthCode =>
          (knownAuthCodes as readonly string[]).includes(v);
        const authCode: KnownAuthCode = isKnownAuthCode(code403) ? code403 : 'UNKNOWN';
        return Promise.reject(
          new AuthError('Access denied. Please sign in again.', 403, authCode),
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
