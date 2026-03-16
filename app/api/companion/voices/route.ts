/**
 * Companion Voices - Next.js API Route
 *
 * Proxies to the backend at /api/voice-companion/voices.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/voice-companion/voices', 'GET')
