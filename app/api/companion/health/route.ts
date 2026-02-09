/**
 * Companion Health Check - Next.js API Route
 * Reports AI pipeline availability and wisdom corpus status.
 */

import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  let backendAvailable = false
  let wisdomCorpus = 0

  // Check Python backend
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      backendAvailable = true
      const data = await res.json()
      wisdomCorpus = data.wisdom_corpus ?? 700
    }
  } catch {
    // Backend unavailable
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
    wisdom_corpus: wisdomCorpus ?? (openaiAvailable ? 700 : 0),
    tiers: {
      tier1_backend: backendAvailable,
      tier2_openai: openaiAvailable,
      tier3_static: true,
    },
  })
}
