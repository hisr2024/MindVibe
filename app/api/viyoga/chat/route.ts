/**
 * Viyoga Chat API Route - Enhanced v4.0
 *
 * Now proxies to FastAPI backend for AI-powered concern analysis pipeline
 * (same architecture as Ardha and Relationship Compass).
 *
 * v4.0 BACKEND PIPELINE:
 * 1. AI-powered deep concern analysis (understands your SPECIFIC situation)
 * 2. Enhanced Gita verse retrieval (AI-informed search queries)
 * 3. Analysis-aware prompt construction (situational context in prompts)
 * 4. Direct OpenAI call with custom prompts (not generic WellnessModel)
 * 5. Gita wisdom filter on all responses
 *
 * FALLBACK: If backend is unavailable, falls back to frontend-based
 * OpenAI call with original prompts (graceful degradation).
 */

import { NextRequest, NextResponse } from 'next/server'
import { VIYOGA_SECULAR_PROMPT, VIYOGA_SYSTEM_PROMPT, VIYOGA_HEADINGS_SECULAR, VIYOGA_HEADINGS_GITA } from '@/lib/viyoga/systemPrompt'
import { retrieveGitaChunks, getExpandedQuery } from '@/lib/viyoga/retrieval'
import { appendMessage, ensureSession, getRecentMessages } from '@/lib/viyoga/storage'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000'
const BACKEND_TIMEOUT = 60000 // 60 seconds for AI analysis + response generation
const OPENAI_TIMEOUT_MS = 30000
const OPENAI_MODEL = process.env.VIYOGA_CHAT_MODEL || 'gpt-4o-mini'

// Secular fallback response - deep identity-level insight, modern and grounded
const FALLBACK_RESPONSE = {
  assistant: `**I Get It**
You are anxious about an outcome you cannot fully control. That anxiety is real — and it makes sense because some part of you feels that YOU are at stake here, not just the result. That is worth looking at.

**What's Really Going On**
You are spending energy trying to control something that is not entirely in your hands. But the deeper pattern: the worry is not really about the outcome itself. It is about what you think the outcome says about YOU — your worth, your competence, your identity. The outcome and the person watching the outcome are two different things.

**A Different Way to See This**
Consider this: the person who did the work, who showed up, who gave their best — that person does not change regardless of the result. The outcome belongs to circumstances, timing, and factors you do not control. But the person observing all of this? That person remains the same whether it goes perfectly or falls apart. You are not at stake here.

**Try This Right Now**
Pause for 30 seconds. Notice the worry as something you are WATCHING — not something you ARE. You are the one aware of the anxiety; you are not the anxiety itself. Now imagine both outcomes: success and failure. Can you sit with both equally? The person who remains steady in either case — that is who you actually are.

**One Thing You Can Do**
Pick one small action within your control and do it today. Not as a strategy for winning — but as a contribution. The action is complete in itself, regardless of what follows. You have done your part. Now let the situation unfold.

**Something to Consider**
If this goes exactly the way you fear — who are you then? The same person? Then what exactly are you afraid of losing?`,
  sections: {
    i_get_it: 'You are anxious about an outcome you cannot fully control. Some part of you feels YOU are at stake.',
    whats_really_going_on: 'The worry is not about the outcome — it is about what you think the outcome says about YOU.',
    a_different_way_to_see_this: 'The person observing all of this does not change regardless of the result. You are not at stake.',
    try_this_right_now: 'Notice the worry as something you are WATCHING, not something you ARE. Sit with both outcomes equally.',
    one_thing_you_can_do: 'Pick one action as a contribution, not a strategy for winning. The action is complete in itself.',
    something_to_consider: 'If this goes exactly the way you fear — who are you then? The same person?',
  },
  citations: [],
  secularMode: true,
  fallback: true,
  attachment_analysis: {
    type: 'outcome_anxiety',
    description: 'Outcome anxiety',
    primary_emotion: 'anxiety',
    confidence: 0,
    ai_powered: false,
  },
  concern_analysis: {
    specific_worry: '',
    primary_emotion: 'anxiety',
    attachment_type: 'outcome_anxiety',
    confidence: 0,
    analysis_depth: 'fallback',
  },
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    console.error('[Viyoga Chat] JSON parse error')
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  const mode = typeof body.mode === 'string' ? body.mode : 'full'
  const secularMode = body.secularMode !== false

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
  }

  // Sanitize input
  const sanitizedMessage = message.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)

  // Initialize session storage (non-blocking)
  try { await ensureSession(sessionId) } catch { /* continue */ }
  try {
    await appendMessage({
      sessionId,
      role: 'user',
      content: sanitizedMessage,
      createdAt: new Date().toISOString(),
    })
  } catch { /* continue */ }

  // =========================================================================
  // PRIMARY PATH: Proxy to enhanced FastAPI backend (v4.0 pipeline)
  // =========================================================================
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)

    const backendResponse = await fetch(`${BACKEND_URL}/api/viyoga/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        message: sanitizedMessage,
        sessionId,
        mode,
        secularMode,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await backendResponse.json().catch(() => ({}))

    if (backendResponse.ok && data.assistant) {
      // Save assistant response to session storage
      try {
        await appendMessage({
          sessionId,
          role: 'assistant',
          content: data.assistant,
          createdAt: new Date().toISOString(),
          citations: data.citations || [],
        })
      } catch { /* continue */ }

      return NextResponse.json({
        assistant: data.assistant,
        sections: data.sections || {},
        citations: data.citations || [],
        secularMode: data.secularMode ?? secularMode,
        // Enhanced v4.0 fields
        concern_analysis: data.concern_analysis || null,
        attachment_analysis: data.attachment_analysis || null,
        karma_yoga_insight: data.karma_yoga_insight || null,
        // v5.0 Five Pillar compliance scoring
        five_pillar_compliance: data.five_pillar_compliance || null,
        retrieval: {
          strategy: data.provider || 'backend_v4',
          confidence: data.concern_analysis?.confidence || 0,
        },
      })
    }

    // Handle specific error codes
    if (backendResponse.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    console.warn(
      `[Viyoga Chat] Backend returned ${backendResponse.status}, falling back to frontend`
    )
  } catch (backendError) {
    if (backendError instanceof Error && backendError.name === 'AbortError') {
      console.warn('[Viyoga Chat] Backend request timed out, falling back to frontend')
    } else {
      console.warn('[Viyoga Chat] Backend unavailable, falling back to frontend:', backendError)
    }
  }

  // =========================================================================
  // FALLBACK PATH: Frontend-based OpenAI call (original v3 behavior)
  // =========================================================================
  try {
    let history: { role: string; content: string }[] = []
    try {
      const recentMessages = await getRecentMessages(sessionId, 20)
      history = recentMessages.map(entry => ({ role: entry.role, content: entry.content }))
    } catch { /* continue */ }

    // Retrieve Gita context
    let retrieval = { chunks: [] as { sourceFile: string; reference?: string; text: string; id: string }[], confidence: 0, strategy: 'fallback' }
    try {
      const result = await retrieveGitaChunks(sanitizedMessage, 6)
      retrieval = result
      if (result.confidence < 0.15 || result.chunks.length < 2) {
        retrieval = await retrieveGitaChunks(getExpandedQuery(sanitizedMessage), 12)
      }
    } catch { /* continue with empty */ }

    const contextBlock = buildContextBlock(retrieval.chunks)
    const systemPrompt = secularMode ? VIYOGA_SECULAR_PROMPT : VIYOGA_SYSTEM_PROMPT

    const messagesForAI: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: sanitizedMessage },
    ]

    if (secularMode) {
      const guidanceContext = retrieval.chunks.length > 0
        ? `\n\nInternal guidance framework (use these principles to inform your reasoning, but present insights in your own modern language):\n${retrieval.chunks.map(c => c.text).join('\n')}`
        : ''
      messagesForAI.push({ role: 'system', content: `Give grounded, actionable guidance with balanced depth.${guidanceContext}` })
    } else {
      messagesForAI.push({ role: 'user', content: `Give grounded, actionable guidance with balanced depth.\n\n${contextBlock}` })
    }

    const responseText = (await callOpenAI(messagesForAI)) || FALLBACK_RESPONSE.assistant

    const headings = secularMode ? VIYOGA_HEADINGS_SECULAR : VIYOGA_HEADINGS_GITA
    const sections = parseTransmissionSections(responseText, headings)
    const citations = retrieval.chunks.map(chunk => ({
      source_file: chunk.sourceFile,
      reference_if_any: chunk.reference,
      chunk_id: chunk.id,
    }))

    // Save assistant response
    try {
      await appendMessage({
        sessionId,
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
        citations,
      })
    } catch { /* continue */ }

    return NextResponse.json({
      assistant: responseText,
      sections,
      citations,
      secularMode,
      retrieval: {
        strategy: retrieval.strategy,
        confidence: retrieval.confidence,
      },
    })
  } catch (error) {
    console.error('[Viyoga Chat] Frontend fallback also failed:', error)
    return NextResponse.json({
      ...FALLBACK_RESPONSE,
      retrieval: { strategy: 'error-fallback', confidence: 0 },
    })
  }
}

// =============================================================================
// HELPER FUNCTIONS (retained for frontend fallback)
// =============================================================================

function buildContextBlock(chunks: { sourceFile: string; reference?: string; text: string }[]) {
  if (!chunks.length) return '[GITA_CORE_WISDOM_CONTEXT]\n(No relevant context retrieved.)\n[/GITA_CORE_WISDOM_CONTEXT]'

  const lines = chunks.map(chunk => {
    const sourceLine = `- Source: ${chunk.sourceFile}`
    const referenceLine = chunk.reference ? `  Reference: ${chunk.reference}` : '  Reference: (none)'
    const textLine = `  Text: ${chunk.text}`
    return `${sourceLine}\n${referenceLine}\n${textLine}`
  })

  return `[GITA_CORE_WISDOM_CONTEXT]\n${lines.join('\n')}\n[/GITA_CORE_WISDOM_CONTEXT]`
}

function parseTransmissionSections(text: string, headings: string[]) {
  const sectionKeyMap: Record<string, string> = {}
  headings.forEach(h => {
    const key = h.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    sectionKeyMap[h.toLowerCase()] = key
  })

  const sections: Record<string, string> = {}
  let currentHeading: string | null = null
  const buffer: string[] = []

  const flush = () => {
    if (!currentHeading) return
    const key = sectionKeyMap[currentHeading.toLowerCase()] || currentHeading.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    sections[key] = buffer.join('\n').trim()
    buffer.length = 0
  }

  const normalizeHeading = (line: string): string | null => {
    let cleaned = line.trim()
    cleaned = cleaned.replace(/^#+\s*/, '')
    cleaned = cleaned.replace(/^\*\*|\*\*$/g, '')
    cleaned = cleaned.replace(/:$/, '')
    cleaned = cleaned.trim()

    const cleanedLower = cleaned.toLowerCase()
    const matched = headings.find(h => h.toLowerCase() === cleanedLower)
    return matched || null
  }

  text.split('\n').forEach(line => {
    const matchedHeading = normalizeHeading(line)
    if (matchedHeading) {
      flush()
      currentHeading = matchedHeading
      return
    }
    if (currentHeading) buffer.push(line)
  })

  flush()
  return sections
}

async function callOpenAI(messages: { role: string; content: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[Viyoga Chat] OPENAI_API_KEY not set, using fallback')
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Viyoga Chat] OpenAI error:', errorText)
      return null
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : null
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Viyoga Chat] OpenAI request timed out')
    } else {
      console.error('[Viyoga Chat] OpenAI request failed:', error)
    }
    return null
  }
}
