/**
 * Auth Refresh API Proxy Route
 *
 * Proxies POST /api/auth/refresh to the backend.
 * The backend reads the httpOnly refresh_token cookie and issues a new
 * access_token cookie. Set-Cookie forwarding is critical here — without it,
 * the new access token never reaches the browser and the session expires.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/refresh', 'POST')
