/**
 * Razorpay Payment Verification API Proxy
 *
 * POST /api/subscriptions/verify-razorpay-payment → Verify a Razorpay payment
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/verify-razorpay-payment', 'POST')
