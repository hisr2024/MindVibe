/**
 * Auth Reset Password API Proxy Route
 *
 * Proxies POST /api/auth/reset-password to the backend.
 * Validates the reset token and updates the password.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/reset-password', 'POST')
