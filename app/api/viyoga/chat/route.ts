import { NextRequest, NextResponse } from 'next/server'
import { VIYOGA_SYSTEM_PROMPT } from '@/lib/viyoga/systemPrompt'
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

function parseTransmissionSections(text: string) {
  const headings = [
    'Sacred Recognition',
    'Anatomy of Attachment',
    'Gita Core Transmission',
    'Sakshi Practice (60s)',
    'Karma Yoga Step (Today)',
    'One Question',
  ]

  const sectionKeyMap: Record<string, string> = {
    'Sacred Recognition': 'sacred_recognition',
    'Anatomy of Attachment': 'anatomy_of_attachment',
    'Gita Core Transmission': 'gita_core_transmission',
    'Sakshi Practice (60s)': 'sakshi_practice_60s',
    'Karma Yoga Step (Today)': 'karma_yoga_step_today',
    'One Question': 'one_question',
  }

  const sections: Record<string, string> = {}
  let currentHeading: string | null = null
  const buffer: string[] = []

  const flush = () => {
    if (!currentHeading) return
    const key = sectionKeyMap[currentHeading]
    sections[key] = buffer.join('\n').trim()
    buffer.length = 0
  }

  text.split('\n').forEach(line => {
    const normalized = line.replace(/^#+\s*/, '').replace(/:$/, '').trim()
    const matchedHeading = headings.find(heading => heading.toLowerCase() === normalized.toLowerCase())
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

function buildFallbackTransmission(message: string, chunks: { text: string }[]) {
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

    // Generate response with fallback
    const responseText =
      (await callOpenAI([
        { role: 'system', content: VIYOGA_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message },
        { role: 'user', content: `${buildModeInstruction(mode)}\n\n${contextBlock}` },
      ])) || buildFallbackTransmission(message, retrieval.chunks)

    const sections = parseTransmissionSections(responseText)
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
      retrieval: {
        strategy: retrieval.strategy,
        confidence: retrieval.confidence,
      },
    })
  } catch (error) {
    console.error('[Viyoga Chat] Unexpected error:', error)
    // Return a graceful fallback response instead of 500
    const fallbackResponse = buildFallbackTransmission('your concern', [])
    const fallbackSections = parseTransmissionSections(fallbackResponse)
    return NextResponse.json({
      assistant: fallbackResponse,
      sections: fallbackSections,
      citations: [],
      retrieval: {
        strategy: 'error-fallback',
        confidence: 0,
      },
    })
  }
}
