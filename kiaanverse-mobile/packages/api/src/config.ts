/**
 * API client configuration.
 *
 * Base URL is resolved from environment variables:
 * 1. EXPO_PUBLIC_API_BASE_URL — explicit override (highest priority)
 * 2. EXPO_PUBLIC_ENV — selects production / staging / development URL
 * 3. Falls back to localhost in development
 */

function resolveBaseURL(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (override) return override;

  switch (process.env.EXPO_PUBLIC_ENV) {
    case 'production':
      return 'https://api.kiaanverse.com';
    case 'staging':
      return 'https://api-staging.kiaanverse.com';
    default:
      return 'http://localhost:8000';
  }
}

export const API_CONFIG = {
  /** Base URL — resolved from EXPO_PUBLIC_ENV or EXPO_PUBLIC_API_BASE_URL */
  baseURL: resolveBaseURL(),

  /** Request timeout (ms) */
  timeout: 15_000,

  /** Max retries for transient failures */
  maxRetries: 3,

  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: 1_000,

  /** Maximum delay between retries (ms) */
  retryMaxDelay: 8_000,
} as const;
