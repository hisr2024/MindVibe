/**
 * POST /api/payments/create-order — Create Razorpay order
 *
 * Creates an order for Indian users paying via Razorpay.
 * Proxied to backend which handles Razorpay API interaction.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/payments/create-order', 'POST', 45000)
