/**
 * PayPal Payment Capture API Proxy
 *
 * POST /api/subscriptions/capture-paypal-payment → Capture a PayPal payment
 *
 * Uses a 45s timeout because PayPal capture API calls can take 5-15s
 * and backend cold starts on Render add 30-60s.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/capture-paypal-payment', 'POST', 45000)
