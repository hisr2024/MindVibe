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
  const contextSnippet = chunks[0]?.text || 'I don’t have that in my Gita repository context yet—let me fetch it.'

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

async function callOpenAI(messages: { role: string; content: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

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
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Viyoga Chat] OpenAI error:', errorText)
      return null
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : null
  } catch (error) {
    console.error('[Viyoga Chat] OpenAI request failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  const mode = body.mode as ChatMode | undefined

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
  }

  await ensureSession(sessionId)
  const history = await getRecentMessages(sessionId, 20)
  await appendMessage({
    sessionId,
    role: 'user',
    content: message,
    createdAt: new Date().toISOString(),
  })

  let retrieval = await retrieveGitaChunks(message, 6)
  if (retrieval.confidence < 0.15 || retrieval.chunks.length < 2) {
    retrieval = await retrieveGitaChunks(getExpandedQuery(message), 12)
  }

  const contextBlock = buildContextBlock(retrieval.chunks)
  const historyMessages = history.map(entry => ({
    role: entry.role,
    content: entry.content,
  }))

  const responseText =
    (await callOpenAI([
      { role: 'system', content: VIYOGA_SYSTEM_PROMPT },
      ...historyMessages,
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

  await appendMessage({
    sessionId,
    role: 'assistant',
    content: responseText,
    createdAt: new Date().toISOString(),
    citations,
  })

  return NextResponse.json({
    assistant: responseText,
    sections,
    citations,
    retrieval: {
      strategy: retrieval.strategy,
      confidence: retrieval.confidence,
    },
  })
}
