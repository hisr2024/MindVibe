/**
 * Auth Change Password API Proxy Route
 *
 * Proxies POST /api/auth/change-password to the backend.
 * Requires authentication (session cookie forwarded automatically).
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/change-password', 'POST')
