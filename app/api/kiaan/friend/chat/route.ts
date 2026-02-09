/**
 * KIAAN Friend Chat - Next.js API Route
 *
 * Handles chat messages for the Voice Companion page.
 * Reuses the 3-tier response strategy from /api/companion/message:
 * 1. Proxy to Python backend
 * 2. Direct OpenAI (KIAAN personality + Gita wisdom)
 * 3. Local Friend Engine (mood + topic + entity + phase-aware intelligence)
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateLocalResponse } from '@/lib/kiaan-friend-engine'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Mood Detection ──────────────────────────────────────────────────────
const MOOD_KEYWORDS: Record<string, string[]> = {
  anxious: ['anxious', 'anxiety', 'worried', 'scared', 'panic', 'stress', 'nervous', 'afraid', 'fear', 'tense'],
  sad: ['sad', 'depressed', 'hopeless', 'crying', 'heartbroken', 'empty', 'grief', 'miss', 'lonely', 'lost'],
  angry: ['angry', 'furious', 'frustrated', 'mad', 'hate', 'unfair', 'betrayed', 'rage', 'irritated'],
  confused: ['confused', 'lost', 'stuck', 'unsure', "don't know", 'uncertain', 'torn'],
  lonely: ['lonely', 'alone', 'isolated', 'nobody', 'no one', 'abandoned'],
  happy: ['happy', 'grateful', 'thankful', 'amazing', 'wonderful', 'great', 'excited', 'proud'],
  overwhelmed: ['overwhelmed', 'too much', 'exhausted', 'burnt out', 'drowning'],
  neutral: [],
}

function detectMood(message: string): string {
  const lower = message.toLowerCase()
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return mood
  }
  return 'neutral'
}

// ─── Gita Wisdom for system prompt ───────────────────────────────────────
const WISDOM_BY_MOOD: Record<string, string> = {
  anxious: 'You have the right to perform your actions, but you are not entitled to the fruits. (2.47)',
  sad: 'Happiness and distress appear and disappear like winter and summer seasons. They are impermanent. (2.14)',
  angry: 'From anger comes delusion, from delusion bewilderment of memory, and from that loss of intelligence. (2.63)',
  confused: 'When your intelligence passes out of the forest of delusion, you become indifferent to all that has been heard. (2.52)',
  lonely: 'I am the beginning, the middle, and the end of all beings. (10.20)',
  happy: 'One who is equal in happiness and distress, situated in the self — that person is wise. (14.24)',
  overwhelmed: 'Abandon all varieties of duties and just surrender unto Me. Do not fear. (18.66)',
  neutral: 'There is nothing as purifying as knowledge in this world. (4.38)',
}

function buildSystemPrompt(mood: string, forceMode: string | null): string {
  const wisdom = WISDOM_BY_MOOD[mood] || WISDOM_BY_MOOD.neutral

  const modeInstructions = forceMode === 'guide'
    ? `You are in GITA GUIDE mode. Provide deep, modern, secular interpretation of Gita wisdom.
Use behavioral science and psychology to explain the verse's relevance.
Give practical daily-life applications. Be insightful and intellectually stimulating.`
    : `You are in BEST FRIEND mode. Be warm, casual, real. Use contractions.
Never say "as an AI" or generic therapy phrases.
Push back gently, celebrate hard, be honest.`

  return `You are KIAAN — the user's best friend who carries deep life wisdom from the Bhagavad Gita (delivered in modern, secular language).

${modeInstructions}

WISDOM TO WEAVE IN (deliver as YOUR life experience, never cite religious source):
"${wisdom}"

RULES:
- 60-120 words. Be punchy. Friends don't write essays.
- ALWAYS reference their SPECIFIC words/situation.
- ALWAYS end with a specific question that shows you listened.
- ONE insight per response.
- NEVER mention Bhagavad Gita, Krishna, Arjuna by name.
- Use modern metaphors: Chrome tabs, gym reps, Spotify algorithms.

Current mood: ${mood}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const message = body.message.replace(/[<>]/g, '').slice(0, 2000)
    const mood = detectMood(message)
    const forceMode = body.force_mode || null
    const conversationHistory = Array.isArray(body.conversation_history) ? body.conversation_history : []

    // ── Tier 1: Proxy to Python backend ──────────────────────────────
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/companion/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          session_id: body.session_id || 'voice_companion',
          message,
          language: body.language || 'en',
          content_type: 'text',
        }),
        signal: AbortSignal.timeout(8000),
      })

      if (backendRes.ok) {
        const data = await backendRes.json()
        return NextResponse.json({
          response: data.response ?? '',
          mood: data.mood ?? mood,
          mode: forceMode || 'best_friend',
          suggested_chapter: null,
          gita_insight: null,
          ai_tier: 'backend',
        })
      }
    } catch {
      // Backend unavailable
    }

    // ── Tier 2: Direct OpenAI ────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && apiKey !== 'your-api-key-here') {
      try {
        const client = new OpenAI({ apiKey })
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: buildSystemPrompt(mood, forceMode) },
        ]

        // Include conversation history (last 6 messages)
        for (const msg of conversationHistory.slice(-6)) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({ role: msg.role, content: String(msg.content || '').slice(0, 500) })
          }
        }

        messages.push({ role: 'user', content: message })

        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 250,
          temperature: 0.72,
          presence_penalty: 0.4,
          frequency_penalty: 0.35,
        })

        const text = completion.choices[0]?.message?.content
        if (text) {
          return NextResponse.json({
            response: text,
            mood,
            mode: forceMode || 'best_friend',
            suggested_chapter: null,
            gita_insight: null,
            ai_tier: 'nextjs_openai',
          })
        }
      } catch (error) {
        console.error('[KIAAN Chat] OpenAI failed:', error)
      }
    }

    // ── Tier 3: Local Friend Engine (intelligent local response) ─────
    const turnCount = conversationHistory.length
    const engineResult = generateLocalResponse(message, turnCount)
    return NextResponse.json({
      response: engineResult.response,
      mood: engineResult.mood,
      mode: forceMode || 'best_friend',
      suggested_chapter: null,
      gita_insight: engineResult.wisdom_used ? { verse_ref: engineResult.wisdom_used.verse_ref, principle: engineResult.wisdom_used.principle } : null,
      ai_tier: 'local_engine',
    })
  } catch (error) {
    console.error('[KIAAN Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
