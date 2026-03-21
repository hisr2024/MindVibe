/**
 * API client configuration.
 *
 * Base URL is read from environment variables via expo-constants.
 * Falls back to localhost in development.
 */

export const API_CONFIG = {
  /** Base URL — overridden by environment config */
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',

  /** Request timeout (ms) */
  timeout: 15_000,

  /** Max retries for transient failures */
  maxRetries: 3,

  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: 1_000,

  /** Maximum delay between retries (ms) */
  retryMaxDelay: 8_000,
} as const;
