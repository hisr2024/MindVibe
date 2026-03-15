/**
 * Companion Session Start - Re-export
 *
 * Both /api/companion/session/start and /api/voice-companion/session/start
 * now share a single implementation proxying to kiaan_voice_companion.py.
 */

export { POST } from '@/app/api/voice-companion/session/start/route'
