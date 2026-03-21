/**
 * API Client Factory for Kiaanverse
 *
 * Axios-based client with:
 * - JWT auto-attach via request interceptor (Authorization: Bearer header)
 * - withCredentials: true for automatic cookie management (refresh_token)
 * - 401 refresh token rotation with concurrent request deduplication
 * - Exponential backoff retry for transient failures (408, 429, 502, 503, 504)
 * - Auto-logout via onAuthFailure callback when refresh permanently fails
 *
 * Backend contract:
 * - Access token: stored in SecureStore, sent via Authorization header
 * - Refresh token: managed as httpOnly cookie by the native HTTP stack,
 *   also stored in SecureStore as fallback (sent in request body to /api/auth/refresh)
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from './config';
import type { TokenManager, RefreshResponse } from './types';

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
// Client Factory
// ---------------------------------------------------------------------------

interface RequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retryCount?: number | undefined;
  _isRefreshRequest?: boolean | undefined;
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

  // Request interceptor: attach JWT from SecureStore
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: handle 401 refresh + transient retry
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
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RequestConfigWithRetry | undefined;
      if (!originalRequest) return Promise.reject(error);

      // Don't retry 401 on the refresh endpoint itself to avoid infinite loops
      if (originalRequest._isRefreshRequest) {
        return Promise.reject(error);
      }

      // Handle 401 — token refresh
      if (error.response?.status === 401) {
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
          // Try to get refresh token from SecureStore (to send in body)
          const storedRefreshToken = await tokenManager.getRefreshToken();

          // Send refresh request — the httpOnly cookie is also sent automatically
          // via withCredentials. We send the stored token in the body as a fallback.
          const refreshResponse = await axios.post<RefreshResponse>(
            `${API_CONFIG.baseURL}/api/auth/refresh`,
            storedRefreshToken ? { refresh_token: storedRefreshToken } : {},
            { withCredentials: true },
          );

          const newAccessToken = refreshResponse.data.access_token;

          // Extract new refresh token: prefer body (if enabled), then Set-Cookie header
          const newRefreshToken =
            refreshResponse.data.refresh_token ??
            extractRefreshTokenFromHeaders(refreshResponse.headers as Record<string, unknown>) ??
            storedRefreshToken ?? // Keep existing if we can't extract the new one
            '';

          await tokenManager.setTokens(newAccessToken, newRefreshToken);
          onRefreshed(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return client(originalRequest);
        } catch {
          // Refresh failed permanently — auto-logout
          await tokenManager.clearTokens();
          tokenManager.onAuthFailure?.();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle transient errors — retry with backoff
      if (isTransientError(error)) {
        const retryCount = originalRequest._retryCount ?? 0;

        if (retryCount < API_CONFIG.maxRetries) {
          originalRequest._retryCount = retryCount + 1;
          const delay = getRetryDelay(retryCount);
          await sleep(delay);
          return client(originalRequest);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
