/**
 * Email Verification API Proxy Route
 *
 * Proxies POST /api/auth/verify-email to the backend.
 * Verifies the user's email address using a token from the verification link.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/verify-email', 'POST')
