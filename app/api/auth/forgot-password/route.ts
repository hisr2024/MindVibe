/**
 * Auth Forgot Password API Proxy Route
 *
 * Proxies POST /api/auth/forgot-password to the backend.
 * Sends password reset email if the account exists.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/forgot-password', 'POST')
