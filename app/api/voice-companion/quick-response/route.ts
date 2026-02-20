/**
 * Voice Companion Quick Response - Next.js API Route
 *
 * Handles wake word activation quick responses.
 * Proxies to backend, falls back to OpenAI direct, then local engine.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateLocalResponse } from '@/lib/kiaan-friend-engine'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const sanitizedQuery = body.query
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 500)

    // ── Tier 1: Proxy to Python backend ──────────────────────────────
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const cookie = request.headers.get('cookie')
      if (cookie) headers.cookie = cookie
      const authorization = request.headers.get('authorization')
      if (authorization) headers.authorization = authorization

      const backendResponse = await fetch(`${BACKEND_URL}/api/voice-companion/quick-response`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: sanitizedQuery,
          language: body.language || 'en',
          context: body.context || 'wake_word_activation',
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        if (data && typeof data.response === 'string') {
          return NextResponse.json({ ...data, ai_tier: data.ai_tier || 'backend' })
        }
      }
    } catch (err) {
      console.error('[Quick Response] Backend proxy failed:', err instanceof Error ? err.message : err)
    }

    // ── Tier 2: Direct OpenAI from Next.js ───────────────────────────
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey && apiKey !== 'your-api-key-here') {
        const OpenAI = (await import('openai')).default
        const client = new OpenAI({ apiKey })

        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are KIAAN, a divine friend and spiritual companion. ' +
                'The user just activated you with a voice wake word. ' +
                'Respond warmly and briefly. ' +
                'Keep your response under 3 sentences — this is a quick voice interaction. ' +
                'Be compassionate, wise, and concise. ' +
                'Use contractions. Sound like a real friend, not a chatbot.',
            },
            { role: 'user', content: sanitizedQuery },
          ],
          max_tokens: 200,
          temperature: 0.8,
        })

        const text = completion.choices[0]?.message?.content
        if (text) {
          return NextResponse.json({
            response: text,
            mood: 'neutral',
            ai_tier: 'nextjs_openai',
          })
        }
      }
    } catch (err) {
      console.error('[Quick Response] OpenAI direct failed:', err instanceof Error ? err.message : err)
    }

    // ── Tier 3: Local Friend Engine ──────────────────────────────────
    const engineResult = generateLocalResponse(sanitizedQuery)
    return NextResponse.json({
      response: engineResult.response,
      mood: engineResult.mood,
      ai_tier: 'local_engine',
    })
  } catch (error) {
    console.error('[Quick Response] Unexpected error:', error)
    return NextResponse.json({
      response: "I'm here, friend. What would you like to talk about?",
      mood: 'neutral',
      ai_tier: 'template',
    })
  }
}
