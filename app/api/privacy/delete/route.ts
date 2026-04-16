/**
 * Privacy Deletion BFF Route (v1)
 *
 * Proxies ``POST /api/v1/privacy/delete`` (GDPR Art. 17 — Right to
 * Erasure).  The backend records a deletion request with a 30-day
 * grace period; users can cancel via ``/api/privacy/delete/cancel``.
 *
 * Uses ``createProxyHandler`` for cookie / CSRF / XFF forwarding and
 * cold-start-safe retries — see ``lib/proxy-utils.ts``.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/v1/privacy/delete', 'POST')
