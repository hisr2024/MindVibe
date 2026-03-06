/**
 * Auth Developer Status API Proxy Route
 *
 * Proxies GET /api/auth/developer-status to the backend.
 * Returns developer access status and effective subscription tier.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/auth/developer-status', 'GET')
