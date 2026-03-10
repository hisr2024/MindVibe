/**
 * Email 2FA Code Verify API Proxy Route
 *
 * Proxies POST /api/auth/2fa/email/verify to the backend.
 * Verifies the email 2FA code and completes the login flow.
 * Returns session tokens on success.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/2fa/email/verify', 'POST')
