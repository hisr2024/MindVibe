/**
 * Weekly Assessment Latest API Proxy
 *
 * GET /api/kiaan/weekly-assessment/latest → most recent assessment
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/kiaan/weekly-assessment/latest', 'GET')
