/**
 * Centralized Environment Variable Access
 *
 * Single source of truth for all environment variables used across the
 * MindVibe application. Provides validation at import time and typed access
 * to prevent runtime surprises from missing configuration.
 *
 * Usage:
 *   import { env } from '@/config/environment'
 *   const key = env.JOURNAL_ENCRYPTION_KEY  // validated, typed
 */

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

/**
 * Validated environment variables for the MindVibe application.
 * Server-side variables are accessed lazily via getters to allow
 * tree-shaking in the client bundle.
 */
export const env = {
  /** OpenAI API key for Codex helper (server-side only) */
  get OPENAI_API_KEY(): string {
    return getEnv('OPENAI_API_KEY', process.env.CODEX_API_KEY)
  },

  /** Model used for Codex AI completions */
  get CODEX_MODEL(): string {
    return getOptionalEnv('CODEX_MODEL', 'gpt-4o-mini')
  },

  /** Base encryption key for journal entries (server-side only) */
  get JOURNAL_ENCRYPTION_KEY(): string {
    return getEnv('JOURNAL_ENCRYPTION_KEY')
  },

  /** Backend API URL for server-side proxy */
  get API_URL(): string {
    return getOptionalEnv('NEXT_PUBLIC_API_URL', 'https://mindvibe-api.onrender.com')
  },

  /** Sentry DSN for frontend error tracking */
  get SENTRY_DSN(): string | undefined {
    return process.env.NEXT_PUBLIC_SENTRY_DSN
  },

  /** Current environment name */
  get NODE_ENV(): string {
    return getOptionalEnv('NODE_ENV', 'development')
  },
} as const
