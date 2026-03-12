/**
 * Sadhana Complete API Proxy
 * Forwards completion requests to the FastAPI backend.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/sadhana/complete', 'POST')
