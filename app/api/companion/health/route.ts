/**
 * Companion Health Check - Next.js API Route
 *
 * Reports AI pipeline availability and wisdom corpus status by querying
 * the unified kiaan_voice_companion.py health endpoint.
 */

import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET() {
  let backendAvailable = false
  let wisdomCorpus = 0
  let voiceProviders: string[] = []

  // Check Python backend via the unified voice companion health endpoint
  try {
    const res = await fetch(`${BACKEND_URL}/api/voice-companion/health`, {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      backendAvailable = true
      const data = await res.json()
      wisdomCorpus = data.wisdom_corpus ?? 0
      voiceProviders = data.voice_providers ?? []
    }
  } catch {
    // Backend unavailable — fall through to local checks
  }

  // Check if OpenAI key is configured for Next.js direct calls
  const apiKey = process.env.OPENAI_API_KEY
  const openaiAvailable = !!(apiKey && apiKey !== 'your-api-key-here')

  const aiEnhanced = backendAvailable || openaiAvailable

  return NextResponse.json({
    status: 'ok',
    ai_enhanced: aiEnhanced,
    backend_available: backendAvailable,
    openai_direct: openaiAvailable,
    wisdom_corpus: wisdomCorpus || (openaiAvailable ? 700 : 0),
    voice_providers: voiceProviders,
    tiers: {
      tier1_backend: backendAvailable,
      tier2_openai: openaiAvailable,
      tier3_static: true,
    },
  })
}
