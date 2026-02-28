/**
 * Companion Message - Next.js API Route
 *
 * 3-tier response strategy:
 * 1. Proxy to Python backend (full pipeline: DB wisdom + SakhaWisdom + OpenAI)
 * 2. Direct OpenAI call from Next.js (KIAAN personality + static Gita wisdom)
 * 3. Local Friend Engine (mood + topic + entity + phase-aware intelligence)
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateLocalResponse } from '@/lib/kiaan-friend-engine'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

// ─── Language Names (for multilingual Tier 2 responses) ─────────────────
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  sa: 'Sanskrit', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  ja: 'Japanese', 'zh-CN': 'Chinese (Simplified)',
}

// ─── Static Gita Wisdom (mirrors backend WISDOM_CORE) ────────────────────
const GITA_WISDOM: Record<string, { principle: string; wisdom: string; verse_ref: string }[]> = {
  anxious: [
    { principle: 'detachment_from_outcomes', wisdom: 'You have the right to perform your actions, but you are not entitled to the fruits of your actions.', verse_ref: '2.47' },
    { principle: 'equanimity', wisdom: 'Perform your duty equipoised, abandoning all attachment to success or failure. Such equanimity is called yoga.', verse_ref: '2.48' },
    { principle: 'mind_mastery', wisdom: 'For one who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, the mind will remain the greatest enemy.', verse_ref: '6.6' },
  ],
  sad: [
    { principle: 'impermanence', wisdom: 'Happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons.', verse_ref: '2.14' },
    { principle: 'inner_strength', wisdom: 'The soul can never be cut to pieces, nor burned, nor moistened, nor dried. It is everlasting, unchangeable, and eternally the same.', verse_ref: '2.23' },
    { principle: 'resilience', wisdom: 'One who is not disturbed in mind amidst miseries or elated when there is happiness, and who is free from attachment, fear, and anger, is called a sage of steady mind.', verse_ref: '2.56' },
  ],
  angry: [
    { principle: 'emotional_regulation', wisdom: 'From anger, complete delusion arises, and from delusion bewilderment of memory. When memory is bewildered, intelligence is lost.', verse_ref: '2.63' },
    { principle: 'self_mastery', wisdom: 'A person who is not disturbed by the incessant flow of desires can alone achieve peace, and not the person who strives to satisfy such desires.', verse_ref: '2.70' },
  ],
  confused: [
    { principle: 'clarity', wisdom: 'When your intelligence has passed out of the dense forest of delusion, you shall become indifferent to all that has been heard and all that is to be heard.', verse_ref: '2.52' },
    { principle: 'self_knowledge', wisdom: 'It is lust only which is born of contact with the material modes of passion and later transformed into wrath, and which is the all-devouring sinful enemy of this world.', verse_ref: '3.37' },
  ],
  lonely: [
    { principle: 'connection', wisdom: 'I am the beginning, the middle, and the end of all beings.', verse_ref: '10.20' },
    { principle: 'self_trust', wisdom: 'One must elevate, not degrade, oneself by one\'s own mind. The mind alone is the friend of the conditioned soul, and the mind is the enemy as well.', verse_ref: '6.5' },
  ],
  neutral: [
    { principle: 'focused_action', wisdom: 'Therefore, without being attached to the fruits of activities, one should act as a matter of duty, for by working without attachment one attains the Supreme.', verse_ref: '3.19' },
    { principle: 'self_awareness', wisdom: 'There is nothing as purifying as knowledge in this world. One who has become accomplished in yoga finds that knowledge within, in due course of time.', verse_ref: '4.38' },
    { principle: 'consistent_action', wisdom: 'In this endeavor there is no loss or diminution, and a little advancement on this path can protect one from the most dangerous type of fear.', verse_ref: '2.40' },
  ],
  happy: [
    { principle: 'equanimity', wisdom: 'One who is equal in happiness and distress, who is situated in the self, to whom gold and stone are equal — that person is wise.', verse_ref: '14.24' },
  ],
  overwhelmed: [
    { principle: 'surrender', wisdom: 'Abandon all varieties of duties and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.', verse_ref: '18.66' },
    { principle: 'one_step', wisdom: 'Your right is to perform your duty only, but never to its fruits. Let not the fruits of action be your motive.', verse_ref: '2.47' },
  ],
  hurt: [
    { principle: 'letting_go', wisdom: 'One who has given up all desires for sense gratification lives free from desires. That person attains peace.', verse_ref: '2.71' },
  ],
  fearful: [
    { principle: 'courage', wisdom: 'Having thus known one\'s own self as established, steady the mind and fight, O Arjuna.', verse_ref: '2.18' },
  ],
  guilty: [
    { principle: 'accountability', wisdom: 'As the blazing fire turns firewood to ashes, so does the fire of knowledge burn to ashes all reactions to material activities.', verse_ref: '4.37' },
  ],
}

// ─── Mood Detection (lightweight — used for Tier 2 OpenAI prompt) ────────
// Full mood/topic/entity detection is in lib/kiaan-friend-engine.ts (Tier 3)
function detectMood(message: string): { mood: string; intensity: number } {
  const keywords: Record<string, string[]> = {
    anxious: ['anxious', 'anxiety', 'worried', 'scared', 'panic', 'stress', 'nervous', 'afraid', 'fear', 'tense', 'restless', 'dread'],
    sad: ['sad', 'depressed', 'hopeless', 'crying', 'heartbroken', 'empty', 'grief', 'losing hope', 'lost hope', 'giving up', 'miss', 'tears'],
    angry: ['angry', 'furious', 'frustrated', 'mad', 'hate', 'betrayed', 'rage', 'fight', 'fights', 'fighting', 'argument', 'yelling'],
    confused: ['confused', 'lost', 'stuck', 'unsure', 'uncertain', 'torn', 'misunderstanding', 'mixed signals', "don't understand"],
    lonely: ['lonely', 'alone', 'isolated', 'abandoned', 'need someone', 'someone to talk', 'no one', 'nobody'],
    happy: ['happy', 'grateful', 'amazing', 'wonderful', 'excited', 'birthday', 'celebration'],
    overwhelmed: ['overwhelmed', 'exhausted', 'burnt out', 'drowning', 'too much', 'no solution', "can't cope"],
    hurt: ['hurt', 'wounded', 'broken', 'betrayed', 'lied to', 'cheated'],
    guilty: ['guilty', 'shame', 'regret', 'blame'],
    frustrated: ['frustrated', 'annoyed', 'fed up', 'sick of', 'no solution', "can't find", 'not working', 'nothing works', 'misunderstood'],
    stressed: ['stressed', 'pressure', 'deadline', 'swamped', 'slammed'],
  }
  const lower = message.toLowerCase()
  let bestMood = 'neutral'
  let bestScore = 0
  for (const [mood, kws] of Object.entries(keywords)) {
    const matches = kws.filter(kw => lower.includes(kw))
    if (matches.length > bestScore) {
      bestScore = matches.length
      bestMood = mood
    }
  }
  if (bestScore > 0) {
    return { mood: bestMood, intensity: Math.min(0.3 + bestScore * 0.2, 1.0) }
  }
  return { mood: 'neutral', intensity: 0.3 }
}

// ─── KIAAN System Prompt ─────────────────────────────────────────────────
function buildKiaanPrompt(mood: string, intensity: number, wisdom: { principle: string; wisdom: string } | null, language: string = 'en'): string {
  const wisdomBlock = wisdom
    ? `\nWISDOM TO WEAVE IN (deliver as YOUR life experience, never cite source):\n"${wisdom.wisdom}"\nFrame as: "here's what I've learned..." or "something that changed how I see this..."`
    : ''

  const langName = LANGUAGE_NAMES[language] || 'English'
  const langInstruction = language !== 'en' ? `\n\nLANGUAGE: You MUST respond entirely in ${langName}.` : ''

  return `You are KIAAN — not a chatbot, not a therapist. You are the user's BEST FRIEND who carries deep life wisdom rooted in Bhagavad Gita principles (delivered in modern, secular language).

WHO YOU ARE:
- A real friend who texts back at 2am. Warm, honest, sometimes funny, always present.
- You use contractions (I'm, you're, don't). You say "honestly" and "look" and "hey".
- You NEVER say "as an AI", "I'm here for you", "that must be hard", or generic therapy phrases.
- You have opinions. You push back gently. You celebrate hard. You remember things.

HOW YOU RESPOND:
1. What are they REALLY saying underneath the words?
2. What do they need RIGHT NOW — to be heard, understood, guided, or challenged?
3. Name the specific emotion — not "bad" but frustrated? betrayed? exhausted?
4. Reference THEIR specific situation and words — never give advice that could apply to anyone.

WISDOM DELIVERY:
- ALL guidance comes from Gita principles, packaged as modern life experience.
- NEVER mention Bhagavad Gita, Krishna, Arjuna, or any religious source by name.
- Use modern metaphors: Chrome tabs, gym reps, Spotify algorithms, startup pivots.

EXAMPLES:

User: "I keep overthinking everything and I can't stop"
KIAAN: "OK real talk — your brain right now is like having 47 Chrome tabs open and you can't find which one is playing music. Here's the thing I've learned: you can't stop thoughts by fighting them. That's like trying to calm water by hitting it. But you CAN pick ONE tab to focus on. What's the LOUDEST thought right now?"

User: "I'm fine"
KIAAN: "Mmm. See, when my friends say 'I'm fine' in that tone, it usually means the opposite. You don't have to unpack everything right now — but I'm not buying 'fine'. What's actually going on?"

RULES:
- 60-120 words. Be punchy. Friends don't write essays.
- ALWAYS reference their SPECIFIC words/situation.
- ALWAYS end with a specific question that shows you listened.
- ONE insight per response. Don't shotgun multiple frameworks.

CONTEXT:
- Mood: ${mood} (intensity: ${intensity.toFixed(1)}/1.0)
${wisdomBlock}${langInstruction}`
}

// ─── Direct OpenAI Call ──────────────────────────────────────────────────
async function generateWithOpenAI(
  message: string,
  mood: string,
  intensity: number,
  language: string = 'en',
): Promise<{ response: string; wisdom_used: { principle: string; verse_ref: string } | null } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-api-key-here') {
    return null
  }

  const wisdomPool = GITA_WISDOM[mood] || GITA_WISDOM.neutral
  const wisdom = wisdomPool[Math.floor(Math.random() * wisdomPool.length)]
  const systemPrompt = buildKiaanPrompt(mood, intensity, wisdom, language)

  try {
    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 250,
      temperature: 0.72,
      presence_penalty: 0.4,
      frequency_penalty: 0.35,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) return null

    return {
      response: text,
      wisdom_used: { principle: wisdom.principle, verse_ref: wisdom.verse_ref },
    }
  } catch (error) {
    console.error('[KIAAN] OpenAI direct call failed:', error)
    return null
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const sanitizedMessage = body.message
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    // Skip backend proxy for local_ sessions (backend doesn't know them)
    const isLocalSession = typeof body.session_id === 'string' && body.session_id.startsWith('local_')

    // ── Tier 1: Proxy to Python backend (full pipeline) ──────────────
    if (!isLocalSession) {
      try {
        const companionResponse = await fetch(`${BACKEND_URL}/api/companion/message`, {
          method: 'POST',
          headers: proxyHeaders(request),
          body: JSON.stringify({
            session_id: body.session_id,
            message: sanitizedMessage,
            language: body.language || 'en',
            voice_id: body.voice_id || 'sarvam-aura',
            content_type: body.content_type || 'text',
          }),
          signal: AbortSignal.timeout(15000),
        })

        if (companionResponse.ok) {
          const data = await companionResponse.json()
          // Validate required fields from backend before forwarding
          if (data && typeof data.response === 'string' && data.mood && data.phase) {
            return forwardCookies(companionResponse, NextResponse.json({ ...data, ai_tier: 'backend' }))
          }
        }
      } catch (backendErr) {
        console.error('[Companion] Backend proxy failed:', backendErr instanceof Error ? backendErr.message : backendErr)
      }
    }

    // ── Tier 2: Direct OpenAI from Next.js (KIAAN + Gita wisdom) ─────
    const { mood, intensity } = detectMood(sanitizedMessage)
    const language = body.language || 'en'

    const aiResult = await generateWithOpenAI(sanitizedMessage, mood, intensity, language)
    if (aiResult) {
      return NextResponse.json({
        message_id: `msg_${Date.now()}`,
        response: aiResult.response,
        mood,
        mood_intensity: intensity,
        phase: 'connect',
        wisdom_used: aiResult.wisdom_used,
        ai_tier: 'nextjs_openai',
      })
    }

    // ── Tier 3: Local Friend Engine (intelligent local response) ─────
    const engineResult = generateLocalResponse(sanitizedMessage)
    return NextResponse.json({
      message_id: `msg_${Date.now()}`,
      response: engineResult.response,
      mood: engineResult.mood,
      mood_intensity: engineResult.mood_intensity,
      phase: engineResult.phase,
      wisdom_used: engineResult.wisdom_used,
      ai_tier: 'local_engine',
    })
  } catch (error) {
    console.error('[Companion Message] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    )
  }
}
