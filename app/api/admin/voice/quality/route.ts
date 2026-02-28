/**
 * Admin Voice Quality API Proxy
 *
 * GET /api/admin/voice/quality → Retrieve voice quality metrics
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/admin/voice/quality', 'GET')
