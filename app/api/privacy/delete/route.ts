/**
 * Privacy Deletion BFF Route (v1)
 *
 * One route file, two verbs — the RESTful way:
 *
 *  - POST   → initiate soft-delete (GDPR Art. 17, 30-day grace period)
 *  - DELETE → cancel a pending deletion during the grace period
 *
 * The backend still exposes cancellation as
 * ``POST /api/v1/privacy/delete/cancel`` (FastAPI routers can't reuse
 * the same path for two different semantics), so the DELETE handler
 * here proxies to that subpath.  Clients get a cleaner surface.
 *
 * Uses ``createProxyHandler`` from ``lib/proxy-utils.ts``, which
 * already handles cookie-based auth, CSRF relay,
 * ``X-Forwarded-For`` passthrough, Render cold-start retries, and
 * ``Set-Cookie`` forwarding.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/v1/privacy/delete', 'POST')
export const DELETE = createProxyHandler(
  '/api/v1/privacy/delete/cancel',
  'POST',
)
