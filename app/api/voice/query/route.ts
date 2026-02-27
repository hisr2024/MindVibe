/**
 * Voice Query API Route
 * Handles voice queries to KIAAN with Gita wisdom integration
 * Returns both text response and optional audio
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

// ─── Language Names (for multilingual Tier 2 responses) ─────────────────
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  sa: 'Sanskrit', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  ja: 'Japanese', 'zh-CN': 'Chinese (Simplified)',
}

// Fallback wisdom responses when backend is unavailable
const FALLBACK_RESPONSES = [
  {
    response: "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be right now.",
    verse: { chapter: 2, verse: 48, text: "Perform actions, O Arjuna, being steadfast in yoga, abandoning attachment." },
  },
  {
    response: "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control, and release what you cannot.",
    verse: { chapter: 2, verse: 47, text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions." },
  },
  {
    response: "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength. KIAAN is here with you.",
    verse: { chapter: 2, verse: 56, text: "One who is not disturbed by misery and has no desire for happiness, free from attachment, fear, and anger, is called a sage of steady mind." },
  },
  {
    response: "The soul is eternal and unchanging. Whatever difficulties you face are temporary. Your true self remains at peace.",
    verse: { chapter: 2, verse: 20, text: "The soul is never born nor dies at any time. It is unborn, eternal, ever-existing, and primeval." },
  },
  {
    response: "Krishna says: Whenever you feel lost, remember that I am always with you. You are never alone on this journey.",
    verse: { chapter: 18, verse: 66, text: "Abandon all varieties of dharmas and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear." },
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, language = 'en', include_audio = false, context = 'voice' } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query text is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedQuery = query
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Try voice query endpoint
      const response = await fetch(`${BACKEND_URL}/api/voice/query`, {
        method: 'POST',
        headers: proxyHeaders(request),
        body: JSON.stringify({
          query: sanitizedQuery,
          language,
          include_audio,
          context,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return forwardCookies(response, NextResponse.json({
          success: true,
          response: data.response || data.text,
          verse: data.verse,
          emotion: data.detected_emotion,
          audio_url: data.audio_url,
          gita_wisdom: true,
        }))
      }

      // Try regular chat endpoint as fallback
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: proxyHeaders(request),
        body: JSON.stringify({
          message: sanitizedQuery,
          language,
          context: 'voice',
        }),
      })

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        return forwardCookies(chatResponse, NextResponse.json({
          success: true,
          response: chatData.response || chatData.message,
          gita_wisdom: true,
        }))
      }
    } catch (backendError) {
      console.warn('[Voice Query] Backend failed, trying OpenAI direct:', backendError)
    }

    // ── Tier 2: Direct OpenAI from Next.js ───────────────────────────
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey && apiKey !== 'your-api-key-here') {
        const client = new OpenAI({ apiKey })

        const langName = LANGUAGE_NAMES[language] || 'English'
        const langInstruction = language !== 'en' ? `\n\nLANGUAGE: You MUST respond entirely in ${langName}.` : ''

        const systemPrompt =
          'You are KIAAN, a wise and compassionate voice companion rooted in Bhagavad Gita wisdom. ' +
          'Respond to the user\'s voice query with warmth and insight. ' +
          'Keep your response concise (2-4 sentences) since this is a voice interaction. ' +
          'Weave in Gita principles using modern, secular language — never cite religious sources by name. ' +
          'Use contractions. Sound like a real friend, not a chatbot.' +
          langInstruction

        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedQuery },
          ],
          max_tokens: 200,
          temperature: 0.72,
        })

        const text = completion.choices[0]?.message?.content
        if (text) {
          return NextResponse.json({
            success: true,
            response: text,
            gita_wisdom: true,
            ai_tier: 'nextjs_openai',
          })
        }
      }
    } catch (openaiError) {
      console.warn('[Voice Query] OpenAI direct failed, using fallback:', openaiError)
    }

    // ── Tier 3: Use fallback response ────────────────────────────────
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      gita_wisdom: true,
      _offline: true,
    })
  } catch (error) {
    console.error('[Voice Query] Error:', error)

    // Always return a helpful response
    const fallback = FALLBACK_RESPONSES[0]
    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      gita_wisdom: true,
      _offline: true,
    })
  }
}
