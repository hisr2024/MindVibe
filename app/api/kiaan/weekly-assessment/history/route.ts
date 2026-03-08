/**
 * Weekly Assessment History API Proxy
 *
 * GET /api/kiaan/weekly-assessment/history → past assessments
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/kiaan/weekly-assessment/history', 'GET')
