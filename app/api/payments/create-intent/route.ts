/**
 * POST /api/payments/create-intent — Create Stripe Payment Intent
 *
 * Creates a payment intent for international users paying via Stripe.
 * Proxied to backend which handles Stripe API interaction.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/payments/create-intent', 'POST', 45000)
