/**
 * Auth Signup API Proxy Route
 *
 * Proxies POST /api/auth/signup to the backend.
 * Forwards Set-Cookie headers so any session tokens set on signup
 * are properly delivered to the browser.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/signup', 'POST')
