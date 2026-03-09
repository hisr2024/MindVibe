/**
 * Subscriptions Checkout API Proxy
 *
 * POST /api/subscriptions/checkout → Create a checkout session
 *
 * Uses a 45s timeout because:
 * 1. Payment provider calls (Stripe/Razorpay) can take 5-15s
 * 2. Backend cold starts on Render free tier add 30-60s
 * 3. Default 15s timeout causes premature 503 errors during checkout
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/checkout', 'POST', 45000)
