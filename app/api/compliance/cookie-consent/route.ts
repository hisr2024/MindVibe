/**
 * Cookie Consent API Proxy
 *
 * POST /api/compliance/cookie-consent → Submit cookie consent preferences
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/compliance/cookie-consent', 'POST')
