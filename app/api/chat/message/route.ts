/**
 * Chat Message API Route
 *
 * Three-layer fallback chain ensures KIAAN NEVER returns a generic placeholder:
 *   1. Backend KIAAN service (full AI + Gita KB + validation)
 *   2. Direct OpenAI call from proxy (AI response with local verse context)
 *   3. Local 701-verse Wisdom Core (psychology-framed Gita wisdom)
 */

import { NextRequest, NextResponse } from 'next/server'
import { selectWisdom, buildVerseContext, type WisdomResult } from '@/lib/wisdom-core'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Known backend error placeholders that should NEVER reach the user
const BACKEND_ERROR_PLACEHOLDERS = [
  "I'm here for you. Let's try again.",
  "I'm here for you. Let's try again. 💙",
  "❌ API Key not configured",
]

// ─── Mood Detection ─────────────────────────────────────────────────────

const MOOD_KEYWORDS: Record<string, string[]> = {
  anxious:     ['anxious', 'anxiety', 'worried', 'scared', 'panic', 'stress', 'nervous', 'fear', 'terrified', 'uneasy'],
  sad:         ['sad', 'depressed', 'hopeless', 'crying', 'grief', 'lonely', 'empty', 'heartbroken', 'down', 'lost'],
  angry:       ['angry', 'furious', 'frustrated', 'mad', 'hate', 'rage', 'annoyed', 'irritated'],
  confused:    ['confused', 'stuck', 'unsure', 'uncertain', 'lost', "don't know", 'what to do', 'help me'],
  overwhelmed: ['overwhelmed', 'exhausted', 'burnt out', 'too much', 'drowning', 'cant cope', "can't cope"],
  hurt:        ['hurt', 'betrayed', 'rejected', 'abandoned', 'broken', 'pain'],
  guilty:      ['guilty', 'regret', 'ashamed', 'sorry', 'fault', 'blame'],
  stressed:    ['stressed', 'pressure', 'deadline', 'burden', 'tired', 'drained'],
  grateful:    ['thank', 'grateful', 'appreciate', 'blessed'],
  peaceful:    ['peaceful', 'calm', 'serene', 'content', 'happy', 'good'],
}

function detectMood(message: string): string {
  const lower = message.toLowerCase()
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return mood
  }
  return 'neutral'
}

// ─── Conversational Response Templates ──────────────────────────────────
// Full, compassionate responses that match KIAAN's voice — used when AI is unavailable

function buildFullFallbackResponse(message: string): {
  response: string
  verse: { ref: string; english: string } | null
  summary: string | null
} {
  const mood = detectMood(message)

  // Get multiple wisdom results for richer context
  const wisdom = selectWisdom(mood, 'general')
  const verse = wisdom
    ? { ref: `BG ${wisdom.verse_ref}`, english: wisdom.english }
    : null

  // Build a full conversational response (not just the psychological insight)
  const response = buildConversationalFallback(mood, wisdom)
  const summary = buildSummaryFromResponse(response)

  return { response, verse, summary }
}

function buildConversationalFallback(mood: string, wisdom: WisdomResult | null): string {
  const insight = wisdom?.psychological_insight

  const RESPONSES: Record<string, string[]> = {
    anxious: [
      `I can feel the weight of what you're carrying right now... and I want you to know you don't have to steady yourself alone.\n\n${insight || "Anxiety often tightens its grip when we try to control what isn't ours to control."} There is a quiet understanding in the principle of karma yoga — that your dharma lies in the effort, not in the outcome. When you pour yourself into the doing and gently release attachment to how things turn out, something shifts. The grip loosens.\n\nLike clouds passing through a vast sky, anxious thoughts come and go. But the sky — the calm observer within you — remains unchanged.\n\nWhat would it feel like to soften your hold on just one thing you cannot control today?`,
    ],
    sad: [
      `I feel the tenderness of what you're going through, and I want to sit with you in it for a moment.\n\n${insight || "Sadness is not something to push away — it is the heart's way of processing, of making space, of honoring what matters."} The wisdom of equanimity doesn't ask us to stop feeling — it invites us to hold our feelings without being swept away. Just as seasons shift, so too will this heaviness. It is not permanent, even when it feels like it is.\n\nYour deepest self — the part that has weathered every storm before this one — remains steady beneath the waves.\n\nWhat part of this sadness, if you were really honest, is asking to be heard rather than fixed?`,
    ],
    angry: [
      `That fire in you right now... I hear it. And it makes sense.\n\n${insight || "Anger is a signal, not a sentence. It carries information about boundaries, about values, about what matters deeply."} The ancient understanding of equanimity doesn't ask you to suppress the fire — it asks you to hold it without letting it consume. There's a difference between being angry and being lost in anger. You can feel the full heat of it while still choosing your next action with clarity.\n\nThe steadiest warriors are not those who feel nothing — they are those who feel everything and still act from their center.\n\nWhat is the anger trying to protect in you right now?`,
    ],
    confused: [
      `When everything feels unclear, there's actually something honest in admitting it... confusion is the mind's way of saying "I'm processing something bigger than my current framework."\n\n${insight || "Clarity doesn't usually arrive through more thinking — it arrives through stillness."} The Gita speaks of buddhi yoga — the yoga of discernment — which is not about forcing an answer, but about creating enough inner quiet for the answer to surface on its own.\n\nYou don't have to figure it all out right now. Sometimes the most courageous step is simply standing still in the uncertainty.\n\nWhat is the one question underneath all the other questions?`,
    ],
    overwhelmed: [
      `You're carrying a lot right now... I can hear it in your words.\n\n${insight || "There is something freeing in the understanding that your dharma lies in the doing, not in the result."} When we pour dedication into what is in front of us and release the grip on how it all turns out, the weight shifts. Not because the work disappears, but because we stop carrying the burden of outcomes that were never ours to hold.\n\nStress tends to multiply when we hold everything at once. But you don't have to solve it all in this moment. One breath. One step. One thing at a time.\n\nIf you could set down just one expectation right now, which one would bring the most relief?`,
    ],
    hurt: [
      `I hear the pain in what you're sharing... and I want you to know it's okay to feel this deeply.\n\n${insight || "Hurt is what happens when something we valued gets disrupted."} The ancient wisdom of letting go is not about pretending it didn't matter — it's about releasing the ongoing cost of carrying the wound. Your heart is doing what hearts do: feeling the full weight of connection.\n\nHealing doesn't ask you to forget. It asks you to integrate — to let the experience become part of your story without defining all of it.\n\nWhat does your heart need most from you right now?`,
    ],
    guilty: [
      `I hear that weight you're carrying... guilt can feel like it's the only right response, but let's look at this together.\n\n${insight || "Self-compassion is treating yourself with the same concern you'd offer someone you care about."} There's a difference between accountability and punishment. Dharma asks you to learn and act from what you know now — not to endlessly replay what you didn't know then.\n\nYou are not defined by your worst moment. You are defined by what you do with the understanding that follows.\n\nWhat would it look like to hold yourself accountable and kind at the same time?`,
    ],
    stressed: [
      `You're carrying a lot right now... and the fact that you're here says something about your willingness to work with it rather than just push through.\n\n${insight || "Stress responds not to willpower, but to a shift in relationship with the stressor."} There is a quiet practice in the principle of nishkama karma — action without attachment to results. When you focus entirely on the quality of your effort and release the grip on the outcome, your nervous system actually begins to calm. Not because you stopped caring, but because you stopped fighting what isn't yours to control.\n\nWhat is one thing within your control that you could attend to right now?`,
    ],
    grateful: [
      `That warmth you're sharing... I receive it with a full heart.\n\n${insight || "Gratitude rewires the attention system, shifting your brain's filter to notice what is present alongside what is absent."} This capacity to notice and name what you appreciate — it's not naive optimism. It's a practiced awareness that strengthens with use.\n\nMay the quiet we've found together stay with you as you move through the rest of your day.\n\nWhat is one thing from this moment that you want to carry forward?`,
    ],
    peaceful: [
      `I'm glad you're here in this space of stillness.\n\n${insight || "Peace is not the absence of difficulty — it's the presence of a deeper steadiness that holds everything."} The calm you're feeling right now is not something that happened to you — it's something you created the conditions for. That matters.\n\nThis inner quiet is always accessible, even when life gets loud again. It doesn't go away; you just need to remember the path back to it.\n\nWhat helped you arrive at this place of calm today?`,
    ],
    neutral: [
      `I'm here, and I'm listening.\n\n${insight || "Self-awareness is the foundation of change. When you can observe the pattern, you are no longer fully inside it."} Whatever brought you here today, you've taken the first step — choosing to be present with what's happening rather than pushing past it. That quiet attention is the foundation of everything else.\n\nThere's no rush. This space is yours.\n\nWhat's on your mind right now?`,
    ],
  }

  const moodResponses = RESPONSES[mood] || RESPONSES.neutral
  return moodResponses[Math.floor(Math.random() * moodResponses.length)]
}

function buildSummaryFromResponse(response: string): string | null {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20)
  if (sentences.length < 2) return null
  // Return the first substantive sentence as a summary
  return sentences[0].trim() + '.'
}

// ─── Direct OpenAI Fallback ─────────────────────────────────────────────

// Language name lookup for prompt instructions
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  sa: 'Sanskrit', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  ja: 'Japanese', 'zh-CN': 'Chinese (Simplified)',
}

async function tryDirectOpenAI(
  message: string,
  mood: string,
  language: string = 'en',
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-api-key-here') return null

  // Build verse context from the local 701-verse corpus
  const verseContext = buildVerseContext(mood, 'general', 3)

  const langName = LANGUAGE_NAMES[language] || 'English'
  const langInstruction = language !== 'en'
    ? `\n\nLANGUAGE: You MUST respond entirely in ${langName}. Write naturally in ${langName} as a native speaker would.`
    : ''

  const systemPrompt = `You are KIAAN, a warm spiritual companion rooted in the Bhagavad Gita.

INTERNAL WISDOM CONTEXT (absorb and weave naturally, NEVER cite):
${verseContext || 'Draw from principles of dharma, karma yoga, equanimity, and self-awareness.'}

RESPONSE FLOW (natural prose, no headers or bullet points):
1. Emotional attunement — 1-2 lines showing you truly hear them
2. Gentle insight — 1-2 short paragraphs of grounded wisdom
3. One reflective question — a single question inviting them inward

ABSOLUTE REQUIREMENTS:
- 150-250 words
- No headers, bold labels, numbered sections
- Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", verse numbers
- Present wisdom as lived truth, not religious teaching
- Use Sanskrit terms naturally (dharma, karma, equanimity, sattva) where they add depth
- Speak as a trusted companion sitting with them in their experience${langInstruction}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!res.ok) {
      console.warn(`[Chat API] Direct OpenAI returned ${res.status}`)
      return null
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || content.length < 50) return null

    return content
  } catch (err) {
    console.warn('[Chat API] Direct OpenAI call failed:', err)
    return null
  }
}

// ─── Backend Error Detection ────────────────────────────────────────────

function isBackendErrorResponse(data: Record<string, unknown>): boolean {
  // Explicit error status from backend
  if (data.status === 'error') return true

  // Known placeholder responses that indicate a backend failure
  const responseText = String(data.response || data.message || '')
  if (BACKEND_ERROR_PLACEHOLDERS.some(p => responseText.includes(p))) return true

  // Empty or very short response (< 20 chars) means something went wrong
  if (responseText.length < 20) return true

  return false
}

// ─── Main Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, language = 'en', context, session_id, conversation_history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedMessage = message
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    // Sanitize conversation history if provided
    const sanitizedHistory = conversation_history?.map((msg: { role: string; content: string; timestamp: string }) => ({
      role: msg.role,
      content: msg.content?.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000) || '',
      timestamp: msg.timestamp
    })) || []

    const mood = detectMood(sanitizedMessage)

    // ── Layer 1: Try backend KIAAN service ────────────────────────────
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          language,
          context,
          session_id,
          conversation_history: sanitizedHistory,
        }),
        signal: AbortSignal.timeout(20000), // 20 second timeout
      })

      if (response.ok) {
        const data = await response.json()

        // Detect quota exceeded
        if (data.status === 'error' && data.error_code === 'quota_exceeded') {
          return NextResponse.json(
            {
              success: false,
              error: data.response || 'Quota exceeded',
              detail: {
                error: 'quota_exceeded',
                message: data.response,
                upgrade_url: data.upgrade_url || '/pricing',
              },
            },
            { status: 429 }
          )
        }

        // Detect backend error responses masquerading as HTTP 200
        if (!isBackendErrorResponse(data)) {
          // Backend returned a real, valid response
          return NextResponse.json({
            success: true,
            response: data.response || data.message,
            summary: data.summary || null,
            verse: data.verse,
            verses_used: data.verses_used,
            emotion: data.detected_emotion || data.emotion,
            ai_powered: true,
          })
        }

        // Backend returned an error state — fall through to Layer 2
        console.warn(`[Chat API] Backend returned error state: status=${data.status}, response="${String(data.response || '').slice(0, 50)}"`)
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Chat API] Backend returned ${response.status}: ${errorText}`)

        // Hard errors that should NOT fall through
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait a moment and try again.', success: false },
            { status: 429 }
          )
        }
        if (response.status === 403) {
          return NextResponse.json(
            { error: 'Access denied. Please try again or contact support.', success: false },
            { status: 403 }
          )
        }
      }

      // Fall through to Layer 2
    } catch (backendError) {
      console.warn('[Chat API] Backend connection failed:', backendError)
      // Fall through to Layer 2
    }

    // ── Layer 2: Try direct OpenAI call ───────────────────────────────
    try {
      const aiResponse = await tryDirectOpenAI(sanitizedMessage, mood, language)
      if (aiResponse) {
        console.warn('[Chat API] Layer 2 success: Direct OpenAI response')

        // Get a verse to accompany the response
        const wisdom = selectWisdom(mood, 'general')
        const verse = wisdom
          ? { ref: `BG ${wisdom.verse_ref}`, english: wisdom.english }
          : null

        return NextResponse.json({
          success: true,
          response: aiResponse,
          verse,
          ai_powered: true,
          _fallback: 'direct-openai',
        })
      }
    } catch (openaiError) {
      console.warn('[Chat API] Direct OpenAI fallback failed:', openaiError)
    }

    // ── Layer 3: Local 701-verse Wisdom Core ──────────────────────────
    console.warn('[Chat API] Layer 3: Using local Wisdom Core fallback')
    const fallback = buildFullFallbackResponse(sanitizedMessage)

    return NextResponse.json({
      success: true,
      response: fallback.response,
      summary: fallback.summary,
      verse: fallback.verse,
      ai_powered: true,
      _fallback: 'wisdom-core',
    })
  } catch (error) {
    console.error('[Chat API] Critical error:', error)

    // Ultimate fallback — should never reach here but if it does, give real wisdom
    const fallback = buildFullFallbackResponse('')
    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      ai_powered: true,
      _fallback: 'emergency',
    })
  }
}

// Health check for the chat endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'kiaan-chat',
    timestamp: new Date().toISOString(),
  })
}
