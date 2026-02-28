/**
 * Progress Reset API Proxy
 *
 * POST /api/progress/reset → Reset user progress
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/progress/reset', 'POST')
