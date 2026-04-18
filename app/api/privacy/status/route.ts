/**
 * GDPR Privacy Status BFF Route
 *
 * GET /api/privacy/status → proxies to GET /api/v1/privacy/status
 *
 * Returns combined export + deletion status so the frontend can
 * poll a single endpoint for both lifecycles.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/v1/privacy/status', 'GET')
