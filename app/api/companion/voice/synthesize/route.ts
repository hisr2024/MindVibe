/**
 * Companion Voice Synthesis - Re-export
 *
 * Delegates to the voice-companion synthesize route which has better
 * error handling (empty audio detection, arrayBuffer failure recovery)
 * and uses the unified kiaan_voice_companion.py backend.
 */

export { POST } from '@/app/api/voice-companion/synthesize/route'
