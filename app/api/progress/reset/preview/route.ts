/**
 * Progress Reset Preview API Proxy
 *
 * GET /api/progress/reset/preview → Preview what will be reset
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/progress/reset/preview', 'GET')
