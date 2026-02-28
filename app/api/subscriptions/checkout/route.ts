/**
 * Subscriptions Checkout API Proxy
 *
 * POST /api/subscriptions/checkout → Create a checkout session
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/checkout', 'POST')
