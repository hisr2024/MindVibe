/**
 * API Client Factory for Kiaanverse
 *
 * Axios-based client with:
 * - JWT auto-attach via request interceptor
 * - 401 refresh token rotation with concurrent request deduplication
 * - Exponential backoff retry for transient failures (408, 429, 502, 503, 504)
 *
 * Mirrors the pattern from mobile/react-native/src/services/apiClient.ts.
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from './config';
import type { TokenManager } from './types';

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
  _retryCount?: number;
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'kiaanverse-mobile',
      'X-Client-Version': '1.0.0',
    },
  });

  // Request interceptor: attach JWT
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
          const refreshToken = await tokenManager.getRefreshToken();
          if (!refreshToken) {
            await tokenManager.clearTokens();
            tokenManager.onAuthFailure?.();
            return Promise.reject(error);
          }

          const refreshResponse = await axios.post<{
            access_token: string;
            refresh_token: string;
          }>(
            `${API_CONFIG.baseURL}/api/auth/refresh`,
            { refresh_token: refreshToken },
          );

          const { access_token, refresh_token: newRefresh } = refreshResponse.data;
          await tokenManager.setTokens(access_token, newRefresh);
          onRefreshed(access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return client(originalRequest);
        } catch {
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
