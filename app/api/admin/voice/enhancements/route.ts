/**
 * Admin Voice Enhancements API Proxy
 *
 * GET /api/admin/voice/enhancements → Retrieve voice enhancement data
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/admin/voice/enhancements', 'GET')
