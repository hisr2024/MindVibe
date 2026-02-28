/**
 * Admin Voice Trends API Proxy
 *
 * GET /api/admin/voice/trends → Retrieve voice usage trends
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/admin/voice/trends', 'GET')
