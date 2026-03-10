/**
 * Resend Email Verification API Proxy Route
 *
 * Proxies POST /api/auth/resend-verification to the backend.
 * Resends the email verification link if the account exists and is unverified.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/resend-verification', 'POST')
