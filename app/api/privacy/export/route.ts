/**
 * Privacy Export BFF Route (v1)
 *
 * Thin proxy for the backend ``/api/v1/privacy/export`` surface:
 *
 *  - POST  → queue a data export job (GDPR Art. 20).
 *  - GET   → poll the latest export status / fetch signed URL.
 *
 * Uses the shared ``createProxyHandler`` factory so this route
 * inherits the project-wide conventions automatically:
 *   * forwards auth cookies + CSRF token to the backend,
 *   * forwards X-Forwarded-For so the backend sees the real client IP
 *     (rate-limiter keys + audit IP hash depend on this),
 *   * retries transient backend failures (cold start, 502/503/504),
 *   * surfaces backend Set-Cookie headers back to the browser.
 *
 * Auth: relies on the existing cookie-based auth (httpOnly access_token)
 * that every other BFF route in this app uses — no next-auth session
 * lookup is required.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/v1/privacy/export', 'POST')
export const GET = createProxyHandler('/api/v1/privacy/export', 'GET')
