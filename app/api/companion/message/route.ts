/**
 * Companion Message - Next.js API Route
 *
 * Re-exports the voice-companion message handler. Both /api/companion/message
 * and /api/voice-companion/message now share a single implementation that
 * proxies to the unified kiaan_voice_companion.py backend with 3-tier
 * fallback (Python backend → Next.js OpenAI → local friend engine).
 *
 * Previously this file was a 275-line copy-paste of the voice-companion route.
 */

export { POST } from '@/app/api/voice-companion/message/route'
