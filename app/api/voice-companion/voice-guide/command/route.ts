/**
 * Voice Guide Command - Next.js API Route
 *
 * Proxies voice guide commands to the backend unified voice engine.
 * Used by KiaanVoiceFAB for ecosystem navigation, tool input injection,
 * verse lookup, and control commands via voice.
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/voice-companion/voice-guide/command', 'POST')
