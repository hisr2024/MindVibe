/**
 * Email 2FA Code Send API Proxy Route
 *
 * Proxies POST /api/auth/2fa/email/send to the backend.
 * Sends a 2FA verification code to the user's email during login.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/2fa/email/send', 'POST')
