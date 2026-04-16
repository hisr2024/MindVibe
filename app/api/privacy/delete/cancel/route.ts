/**
 * Privacy Deletion Cancel BFF Route (v1)
 *
 * Proxies ``POST /api/v1/privacy/delete/cancel``.  Users hit this
 * endpoint during the 30-day grace period to back out of account
 * deletion.  The backend flips the ``PrivacyRequest`` row to the
 * ``cancelled`` status.
 *
 * Uses ``createProxyHandler`` for cookie / CSRF / XFF forwarding and
 * cold-start-safe retries — see ``lib/proxy-utils.ts``.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/v1/privacy/delete/cancel', 'POST')
