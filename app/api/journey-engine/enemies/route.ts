/**
 * Journey Engine Enemies API Proxy
 *
 * GET /api/journey-engine/enemies → List all inner enemies
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/journey-engine/enemies', 'GET')
