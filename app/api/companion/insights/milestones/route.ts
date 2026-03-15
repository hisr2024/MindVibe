/**
 * Companion Milestones - Re-export
 *
 * Proxies to the unified kiaan_voice_companion.py backend at
 * /api/voice-companion/insights/milestones.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/voice-companion/insights/milestones', 'GET')
