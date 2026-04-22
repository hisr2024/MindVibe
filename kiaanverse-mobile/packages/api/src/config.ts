/**
 * API client configuration.
 *
 * Base URL is resolved from environment variables:
 * 1. EXPO_PUBLIC_API_BASE_URL — explicit override (highest priority, set by EAS)
 * 2. EXPO_PUBLIC_ENV — selects production / staging / development URL
 * 3. Falls back to the Render production URL so builds without env vars still
 *    reach a working backend instead of a nonexistent host.
 *
 * The production & staging hosts both point at the single Render deployment —
 * `mindvibe-api.onrender.com` — which is what the backend currently ships to.
 * If/when a dedicated staging host exists, update STAGING_URL only.
 */

const PRODUCTION_URL = 'https://mindvibe-api.onrender.com';
const STAGING_URL = 'https://mindvibe-api.onrender.com';

function resolveBaseURL(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (override) return override;

  switch (process.env.EXPO_PUBLIC_ENV) {
    case 'production':
      return PRODUCTION_URL;
    case 'staging':
      return STAGING_URL;
    case 'development':
      return 'http://localhost:8000';
    default:
      // No env set → assume production build. The previous default was
      // localhost, which caused shipped builds without EXPO_PUBLIC_ENV to
      // silently try to reach the developer's laptop.
      return PRODUCTION_URL;
  }
}

export const API_CONFIG = {
  /** Base URL — resolved from EXPO_PUBLIC_ENV or EXPO_PUBLIC_API_BASE_URL */
  baseURL: resolveBaseURL(),

  /**
   * Request timeout (ms). Render's free tier cold-starts in 20–30s on the
   * first request after idle; anything under 30s makes the first AI call of a
   * session timeout and triggers the compassionate-error fallback in the UI
   * even though the backend would have answered a few seconds later.
   */
  timeout: 30_000,

  /** Max retries for transient failures */
  maxRetries: 3,

  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: 1_000,

  /** Maximum delay between retries (ms) */
  retryMaxDelay: 8_000,
} as const;
