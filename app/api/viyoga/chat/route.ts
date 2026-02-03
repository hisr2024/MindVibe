import { NextRequest, NextResponse } from 'next/server'
import { VIYOGA_SYSTEM_PROMPT, VIYOGA_SECULAR_PROMPT, VIYOGA_HEADINGS_SECULAR, VIYOGA_HEADINGS_GITA } from '@/lib/viyoga/systemPrompt'
import { retrieveGitaChunks, getExpandedQuery } from '@/lib/viyoga/retrieval'
import { appendMessage, ensureSession, getRecentMessages } from '@/lib/viyoga/storage'

type ChatMode = 'brief' | 'full' | 'verse'

const OPENAI_MODEL = process.env.VIYOGA_CHAT_MODEL || 'gpt-4o-mini'

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

function buildModeInstruction(mode: ChatMode | undefined) {
  if (mode === 'brief') {
    return 'Keep each section concise (2-3 sentences).'
  }
  if (mode === 'verse') {
    return 'Emphasize direct verse language from context, quote exactly and keep commentary minimal.'
  }
  return 'Give grounded, actionable guidance with balanced depth.'
}

function parseTransmissionSections(text: string, secularMode = true) {
  // Use appropriate headings based on mode
  const headings = secularMode ? VIYOGA_HEADINGS_SECULAR : VIYOGA_HEADINGS_GITA

  // Map headings to snake_case keys
  const sectionKeyMap: Record<string, string> = {}
  headings.forEach(h => {
    // Remove apostrophes first, then replace other non-alphanumeric with underscore
    const key = h.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    sectionKeyMap[h.toLowerCase()] = key
  })

  const sections: Record<string, string> = {}
  let currentHeading: string | null = null
  const buffer: string[] = []

  const flush = () => {
    if (!currentHeading) return
    // Use mapped key or generate one (removing apostrophes first)
    const key = sectionKeyMap[currentHeading.toLowerCase()] || currentHeading.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    sections[key] = buffer.join('\n').trim()
    buffer.length = 0
  }

  // Normalize heading for flexible matching
  const normalizeHeading = (line: string): string | null => {
    let cleaned = line.trim()
    cleaned = cleaned.replace(/^#+\s*/, '') // Remove # markdown
    cleaned = cleaned.replace(/^\*\*|\*\*$/g, '') // Remove **bold**
    cleaned = cleaned.replace(/:$/, '') // Remove trailing colon
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

function buildFallbackTransmission(message: string, chunks: { text: string }[], secularMode = true) {
  if (secularMode) {
    // Modern, friendly fallback - no spiritual references
    return `**I Get It**
I can hear the worry in what you're sharing. It makes total sense that you're feeling anxious about this - when something matters to us, of course we want it to work out. That's completely human.

**What's Really Going On**
Here's what I'm noticing: you're spending energy trying to control an outcome that isn't fully in your hands. The result depends on many factors - some you can influence, others you simply can't. And that uncertainty feels uncomfortable.

**A Different Way to See This**
What if you shifted focus from "will this work out?" to "what's the best I can do right now?" You can't guarantee outcomes, but you CAN show up with intention and effort. That's actually where your power lives - not in the result, but in the doing.

**Try This Right Now**
Take 3 slow breaths. Then ask yourself: "What's ONE small thing I can do in the next 10 minutes that's completely within my control?" Don't think about whether it will "work" - just identify one action you can take.

**One Thing You Can Do**
Pick that one small action and do it today. Not because it guarantees success, but because it's what you can offer right now. Focus on doing it well, not on what happens after.

**Something to Consider**
What would change if you measured success by the quality of your effort, rather than the outcome?`
  }

  // Original Gita-based fallback
  const contextSnippet = chunks[0]?.text || "I don't have that in my Gita repository context yet - let me fetch it."

  return `Sacred Recognition
I hear the weight in "${message}". Your concern is valid, and you are not alone in carrying it.

Anatomy of Attachment
Notice where the mind is clinging to an outcome as proof of safety or worth. That grip is what tightens the anxiety.

Gita Core Transmission
${contextSnippet}

Sakshi Practice (60s)
Close your eyes, breathe slowly, and name the worry as a passing wave. Repeat: "I am the witness, not the wave."

Karma Yoga Step (Today)
Choose one action you can complete today that is fully in your control. Do it with care, then release the result.

One Question
What is the smallest action you can offer today without asking it to guarantee the outcome?`
}

const OPENAI_TIMEOUT_MS = 30000 // 30 second timeout

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

export async function POST(request: NextRequest) {
  // Parse request body with explicit error handling
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch (parseError) {
    console.error('[Viyoga Chat] JSON parse error:', parseError)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  const mode = body.mode as ChatMode | undefined
  // Secular mode is ON by default - modern, friendly responses without spiritual terms
  const secularMode = body.secularMode !== false

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
  }

  try {
    // Initialize session and history with error handling
    try {
      await ensureSession(sessionId)
    } catch (storageError) {
      console.warn('[Viyoga Chat] Storage initialization failed, continuing without history:', storageError)
    }

    let history: { role: string; content: string }[] = []
    try {
      const recentMessages = await getRecentMessages(sessionId, 20)
      history = recentMessages.map(entry => ({
        role: entry.role,
        content: entry.content,
      }))
    } catch (historyError) {
      console.warn('[Viyoga Chat] Failed to load history:', historyError)
    }

    try {
      await appendMessage({
        sessionId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      })
    } catch (appendError) {
      console.warn('[Viyoga Chat] Failed to save user message:', appendError)
    }

    // Retrieve Gita context with fallback
    type RetrievalType = { chunks: { sourceFile: string; reference?: string; text: string; id: string }[]; confidence: number; strategy: string }
    let retrieval: RetrievalType = { chunks: [], confidence: 0, strategy: 'fallback' }
    try {
      const result = await retrieveGitaChunks(message, 6)
      retrieval = result
      if (result.confidence < 0.15 || result.chunks.length < 2) {
        retrieval = await retrieveGitaChunks(getExpandedQuery(message), 12)
      }
    } catch (retrievalError) {
      console.error('[Viyoga Chat] Retrieval failed:', retrievalError)
      // Continue with empty chunks - fallback response will be used
    }

    const contextBlock = buildContextBlock(retrieval.chunks)

    // Use secular or Gita prompt based on mode
    const systemPrompt = secularMode ? VIYOGA_SECULAR_PROMPT : VIYOGA_SYSTEM_PROMPT

    // Generate response with fallback
    const responseText =
      (await callOpenAI([
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
        { role: 'user', content: `${buildModeInstruction(mode)}\n\n${contextBlock}` },
      ])) || buildFallbackTransmission(message, retrieval.chunks, secularMode)

    const sections = parseTransmissionSections(responseText, secularMode)
    if (!Object.keys(sections).length) {
      sections.gita_core_transmission = responseText
    }
    const citations = retrieval.chunks.map(chunk => ({
      source_file: chunk.sourceFile,
      reference_if_any: chunk.reference,
      chunk_id: chunk.id,
    }))

    // Save assistant response (non-blocking)
    try {
      await appendMessage({
        sessionId,
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
        citations,
      })
    } catch (saveError) {
      console.warn('[Viyoga Chat] Failed to save assistant message:', saveError)
    }

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
    console.error('[Viyoga Chat] Unexpected error:', error)
    // Return a graceful fallback response instead of 500 - secular mode by default
    const fallbackResponse = buildFallbackTransmission('your concern', [], true)
    const fallbackSections = parseTransmissionSections(fallbackResponse, true)
    return NextResponse.json({
      assistant: fallbackResponse,
      sections: fallbackSections,
      citations: [],
      secularMode: true,
      retrieval: {
        strategy: 'error-fallback',
        confidence: 0,
      },
    })
  }
}
