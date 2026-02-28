/**
 * Auth Login API Proxy Route
 *
 * Proxies POST /api/auth/login to the backend.
 * Critical: must forward Set-Cookie headers (session tokens) back to the
 * browser so httpOnly cookies are set correctly. The next.config.js fallback
 * rewrite cannot do this reliably — which causes 401 errors on subsequent
 * authenticated requests.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/login', 'POST')
