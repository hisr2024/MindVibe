/**
 * Embedded Checkout API Proxy
 *
 * POST /api/subscriptions/embedded-checkout → Create embedded checkout (client_secret)
 *
 * Returns a client_secret for use with Stripe Elements (PaymentElement +
 * PaymentRequestButton) instead of redirecting to Stripe's hosted checkout.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/embedded-checkout', 'POST', 45000)
