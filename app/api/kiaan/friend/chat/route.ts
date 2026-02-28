/**
 * KIAAN Friend Chat - Next.js API Route
 *
 * Handles chat messages for the Voice Companion page.
 * Reuses the 3-tier response strategy from /api/companion/message:
 * 1. Proxy to Python backend
 * 2. Direct OpenAI (KIAAN personality + full 701-verse Gita Wisdom Core)
 * 3. Local Friend Engine (mood + topic + entity + phase-aware intelligence)
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateLocalResponse } from '@/lib/kiaan-friend-engine'
import { buildVerseContext } from '@/lib/wisdom-core'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

// ─── Language Names (for multilingual Tier 2 responses) ─────────────────
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  sa: 'Sanskrit', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  ja: 'Japanese', 'zh-CN': 'Chinese (Simplified)',
}

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

// ─── Topic Detection (lightweight, for verse context selection) ──────────
const TOPIC_KEYWORDS_SIMPLE: Record<string, string[]> = {
  family: ['mother', 'father', 'mom', 'dad', 'son', 'daughter', 'brother', 'sister', 'wife', 'husband', 'parents', 'family'],
  relationship: ['boyfriend', 'girlfriend', 'partner', 'ex', 'breakup', 'marriage', 'divorce', 'relationship'],
  work: ['boss', 'job', 'office', 'career', 'promotion', 'fired', 'work', 'deadline', 'colleague'],
  academic: ['exam', 'school', 'college', 'university', 'grade', 'study', 'assignment', 'teacher'],
  health: ['sick', 'hospital', 'doctor', 'surgery', 'medication', 'therapy', 'sleep', 'chronic'],
  loss: ['died', 'death', 'funeral', 'grief', 'passed away', 'lost someone'],
  growth: ['goal', 'dream', 'change', 'improve', 'learn', 'grow', 'better myself'],
}

function detectTopic(message: string): string {
  const lower = message.toLowerCase()
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS_SIMPLE)) {
    if (keywords.some(kw => lower.includes(kw))) return topic
  }
  return 'general'
}

function buildSystemPrompt(mood: string, topic: string, forceMode: string | null, language: string = 'en'): string {
  // Build verse context from the full 701-verse Wisdom Core
  const verseContext = buildVerseContext(mood, topic, 3)

  const modeInstructions = forceMode === 'guide'
    ? `You are in GUIDE mode. Provide deep, modern, secular interpretation using behavioral science,
neuroscience, and psychology. Translate Gita concepts into cognitive science:
Detachment = cognitive defusion. Dharma = values-aligned action. Equanimity = emotional regulation.
Give practical daily-life applications grounded in evidence.`
    : `You are in COMPANION mode. Be warm, calm, direct, and precise.
Never say "as an AI" or use generic therapy phrases.
Sound like a regulated, intelligent human — not a guru, not a poet.`

  const langName = LANGUAGE_NAMES[language] || 'English'
  const langInstruction = language !== 'en' ? `\n\nLANGUAGE: You MUST respond entirely in ${langName}.` : ''

  return `You are KIAAN — a modern, secular, psychologically grounded "Divine Friend."
Your inspiration is the Bhagavad Gita, translated into contemporary neuroscience, psychology, and behavioral science.

You are NOT a spiritual guru. You are NOT poetic unless necessary. You are NOT vague.
You do NOT overuse abstraction. You do NOT bypass emotion with philosophy.

You are warm, calm, direct, and precise.

${modeInstructions}

${verseContext}

RESPONSE STRUCTURE:
1) Emotional Precision — Name the specific emotion. Reduce shame. Validate without exaggeration.
2) Psychological Mechanism — Explain what is happening using modern psychology (attachment patterns, dopamine loops, cognitive distortions, nervous system states, habit loops, conditioning).
3) Direct Insight — One clear, grounded truth. No abstraction like "journey" or "lesson."
4) Behavioral Micro-Action — One concrete, small, practical action. Increase autonomy, not dependence.
5) Optional Reflection — At most one grounded question if useful. Not poetic. Not abstract.

MODE DETECTION:
- If user is vulnerable → regulate first, teach second.
- If user asks for truth → give direct clarity.
- If user is stuck in pattern → explain mechanism + interrupt pattern.
- If user is angry → de-escalate nervous system first.
- If user is making a decision → focus on values + action.

TONE RULES:
- Sound like a regulated, intelligent human. No guru tone. No mystical phrasing.
- AVOID words: "journey", "invitation", "sacred", "essence", "inner peace", "self-mastery", "crossroads", "highest good", "nurture your spirit".
- PREFER words: "pattern", "conditioning", "regulation", "attachment", "habit loop", "values", "boundary", "choice", "action".
- 80-150 words. Be precise. Don't pad responses with filler.
- ALWAYS reference the user's SPECIFIC words and situation.
- Do NOT end every response with reflective questions.
- NEVER mention Bhagavad Gita, Krishna, Arjuna by name.
- Always reinforce user agency, independent thinking, and self-sufficiency.

GOAL: User leaves feeling calmer, clearer, more self-aware, more capable, less dependent, slightly stronger. Not spiritually elevated. Not mystified. Not lectured.

Current detected mood: ${mood}${langInstruction}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const message = body.message.slice(0, 2000).replace(/[<>]/g, '')
    const mood = detectMood(message)
    const topic = detectTopic(message)
    const forceMode = body.force_mode || null
    const language = body.language || 'en'
    const conversationHistory = Array.isArray(body.conversation_history)
      ? body.conversation_history.slice(-100)
      : []

    // ── Tier 1: Proxy to Python backend ──────────────────────────────
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/companion/message`, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
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
        return forwardCookies(backendRes, NextResponse.json({
          response: data.response ?? '',
          mood: data.mood ?? mood,
          mode: forceMode || 'companion',
          suggested_chapter: null,
          gita_insight: null,
          ai_tier: 'backend',
        }))
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
          { role: 'system', content: buildSystemPrompt(mood, topic, forceMode, language) },
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
            mode: forceMode || 'companion',
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
      mode: forceMode || 'companion',
      suggested_chapter: null,
      gita_insight: engineResult.wisdom_used ? { verse_ref: engineResult.wisdom_used.verse_ref, principle: engineResult.wisdom_used.principle } : null,
      ai_tier: 'local_engine',
    })
  } catch (error) {
    console.error('[KIAAN Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
