/**
 * Auth Logout API Proxy Route
 *
 * Proxies POST /api/auth/logout to the backend.
 * Forwards Set-Cookie headers so the backend can clear httpOnly
 * session cookies by setting them with Max-Age=0.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/logout', 'POST')
