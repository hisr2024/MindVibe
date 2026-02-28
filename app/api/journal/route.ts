/**
 * Journal API Proxy
 *
 * POST /api/journal → Create a new journal entry
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/journal', 'POST')
