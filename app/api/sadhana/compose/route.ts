/**
 * Sadhana Compose API Proxy
 * Forwards compose requests to the FastAPI backend.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/sadhana/compose', 'POST')
