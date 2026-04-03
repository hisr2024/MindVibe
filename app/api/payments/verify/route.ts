/**
 * POST /api/payments/verify — Verify Razorpay payment signature
 *
 * Validates the payment signature and activates the subscription.
 * Proxied to backend which handles HMAC signature verification.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/payments/verify', 'POST', 30000)
