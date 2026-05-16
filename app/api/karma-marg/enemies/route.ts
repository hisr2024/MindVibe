/**
 * Karma Marg (Karma Journey) Enemies API Proxy
 *
 * GET /api/karma-marg/enemies → List all inner enemies
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/karma-marg/enemies', 'GET')
