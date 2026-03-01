/**
 * API Client for MindVibe Mobile
 *
 * Centralized HTTP client built on Axios with:
 * - JWT authentication (auto-attach token)
 * - Refresh token rotation (automatic on 401)
 * - Retry with exponential backoff for transient failures
 * - Request/response interceptors
 * - Offline detection and queuing
 * - Timeout configuration
 *
 * Connects to the same FastAPI backend used by the web app.
 * KIAAN AI Ecosystem endpoints are consumed read-only.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_CONFIG = {
  /** Base URL — overridden by environment config */
  baseURL: __DEV__
    ? 'http://localhost:8000'
    : 'https://api.mindvibe.com',

  /** Request timeout */
  timeout: 15_000,

  /** Max retries for transient failures (502, 503, 504) */
  maxRetries: 3,

  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: 1_000,

  /** Maximum delay between retries (ms) */
  retryMaxDelay: 8_000,
} as const;

// ---------------------------------------------------------------------------
// Token Management Interface
// ---------------------------------------------------------------------------

/**
 * Token storage abstraction. In production, this reads/writes
 * to react-native-keychain (Keystore/Keychain), not AsyncStorage.
 */
interface TokenManager {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
}

// Placeholder — replaced with actual secure storage in production
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
  // Add jitter (±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, API_CONFIG.retryMaxDelay);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// API Client Factory
// ---------------------------------------------------------------------------

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'mindvibe-mobile',
      'X-Client-Version': '1.0.0',
    },
  });

  // ---- Request Interceptor: Attach JWT ----
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

  // ---- Response Interceptor: Handle 401 + Retry ----
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
  }

  function onRefreshed(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
  }

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      if (!originalRequest) return Promise.reject(error);

      // Handle 401 — try token refresh
      if (error.response?.status === 401) {
        if (isRefreshing) {
          // Wait for the ongoing refresh to complete
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
            return Promise.reject(error);
          }

          const refreshResponse = await axios.post(
            `${API_CONFIG.baseURL}/api/auth/refresh`,
            { refresh_token: refreshToken },
          );

          const { access_token, refresh_token: newRefresh } =
            refreshResponse.data;

          await tokenManager.setTokens(access_token, newRefresh);
          onRefreshed(access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return client(originalRequest);
        } catch {
          await tokenManager.clearTokens();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle transient errors — retry with backoff
      if (isTransientError(error)) {
        const retryCount =
          ((originalRequest as { _retryCount?: number })._retryCount ?? 0);

        if (retryCount < API_CONFIG.maxRetries) {
          (originalRequest as { _retryCount?: number })._retryCount =
            retryCount + 1;
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

// ---------------------------------------------------------------------------
// Exported Client Instance
// ---------------------------------------------------------------------------

export const apiClient = createApiClient();

// ---------------------------------------------------------------------------
// Typed API Endpoints (mirrors web app's api.ts)
// ---------------------------------------------------------------------------

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/auth/login', { email, password }),
    signup: (email: string, password: string, name: string) =>
      apiClient.post('/api/auth/signup', { email, password, name }),
    refresh: (refreshToken: string) =>
      apiClient.post('/api/auth/refresh', { refresh_token: refreshToken }),
    logout: () => apiClient.post('/api/auth/logout'),
  },

  /** KIAAN chat — read-only consumption of KIAAN ecosystem */
  chat: {
    send: (message: string, sessionId?: string) =>
      apiClient.post('/api/chat/message', { message, session_id: sessionId }),
    history: (sessionId?: string, limit?: number, offset?: number) =>
      apiClient.get('/api/chat/history', {
        params: { session_id: sessionId, limit, offset },
      }),
    sessions: () => apiClient.get('/api/chat/sessions'),
  },

  /** Bhagavad Gita verses */
  gita: {
    chapters: () => apiClient.get('/api/gita/chapters'),
    chapter: (chapterId: number) =>
      apiClient.get(`/api/gita/chapters/${chapterId}`),
    verse: (chapter: number, verse: number) =>
      apiClient.get(`/api/gita/verses/${chapter}/${verse}`),
    search: (query: string) =>
      apiClient.get('/api/gita/search', { params: { q: query } }),
  },

  /** Mood tracking (score range: -2 to 2) */
  moods: {
    create: (mood: { score: number; tags?: string[]; note?: string }) =>
      apiClient.post('/api/moods', mood),
    /** Get KIAAN empathetic micro-response (score range: 1-10) */
    microResponse: (score: number) =>
      apiClient.get('/api/moods/micro-response', { params: { score } }),
  },

  /** Encrypted journal */
  journal: {
    list: () => apiClient.get('/api/journal/entries'),
    create: (entry: { content_encrypted: string; tags?: string[] }) =>
      apiClient.post('/api/journal/entries', entry),
    get: (entryId: string) =>
      apiClient.get(`/api/journal/entries/${entryId}`),
  },

  /** Journey engine — templates, active journeys, step completion */
  journeys: {
    templates: () => apiClient.get('/api/journey-engine/templates'),
    template: (templateId: string) =>
      apiClient.get(`/api/journey-engine/templates/${templateId}`),
    list: (status?: string) =>
      apiClient.get('/api/journey-engine/journeys', {
        params: status ? { status } : undefined,
      }),
    get: (journeyId: string) =>
      apiClient.get(`/api/journey-engine/journeys/${journeyId}`),
    start: (templateId: string) =>
      apiClient.post('/api/journey-engine/journeys', {
        template_id: templateId,
      }),
    completeStep: (journeyId: string, dayIndex: number) =>
      apiClient.post(
        `/api/journey-engine/journeys/${journeyId}/steps/${dayIndex}/complete`,
      ),
    currentStep: (journeyId: string) =>
      apiClient.get(
        `/api/journey-engine/journeys/${journeyId}/steps/current`,
      ),
    pause: (journeyId: string) =>
      apiClient.post(`/api/journey-engine/journeys/${journeyId}/pause`),
    resume: (journeyId: string) =>
      apiClient.post(`/api/journey-engine/journeys/${journeyId}/resume`),
    dashboard: () => apiClient.get('/api/journey-engine/dashboard'),
    enemies: () => apiClient.get('/api/journey-engine/enemies'),
    enemyProgress: (enemy: string) =>
      apiClient.get(`/api/journey-engine/enemies/${enemy}`),
  },

  /** Audio / TTS */
  audio: {
    synthesize: (text: string, voice?: string, language?: string) =>
      apiClient.post(
        '/api/voice/synthesize',
        { text, voice, language },
        { responseType: 'arraybuffer' },
      ),
  },

  /** User profile */
  profile: {
    /** Get current user info from auth endpoint */
    me: () => apiClient.get('/api/auth/me'),
    /** Get full profile */
    get: () => apiClient.get('/api/profile'),
    /** Create or update profile (POST handles both) */
    update: (data: Record<string, unknown>) =>
      apiClient.post('/api/profile', data),
  },
} as const;
