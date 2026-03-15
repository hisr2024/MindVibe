/**
 * Companion Session End - Re-export
 *
 * Both /api/companion/session/end and /api/voice-companion/session/end
 * now share a single implementation proxying to kiaan_voice_companion.py.
 */

export { POST } from '@/app/api/voice-companion/session/end/route'
