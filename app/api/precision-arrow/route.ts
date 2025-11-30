import { NextResponse } from 'next/server'
import { codex } from '@/lib/codex'
import { PRECISION_ARROW_SYSTEM_PROMPT } from '@/lib/models/precisionArrow'
import { buildPrecisionArrow } from '@/lib/services/precisionArrowEngine'

export type PrecisionArrowInput = {
  goal: string
  time_frame?: string | null
  context?: string | null
  emotional_state?: string | null
}

type ArrowAlignment = {
  goal_clarity: unknown
  purpose: unknown
  effort: unknown
  detachment: unknown
  consistency: unknown
  arrow_alignment: unknown
}

function getPrecisionArrowModel() {
  return process.env.PRECISION_ARROW_MODEL || process.env.CODEX_MODEL || 'gpt-4o-mini'
}

function shouldUseLLM() {
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY)
  return Boolean(process.env.PRECISION_ARROW_USE_LLM === 'true' && hasApiKey)
}

function normalizeJsonText(text: string) {
  const trimmed = text.trim()

  if (trimmed.startsWith('```')) {
    const content = trimmed.replace(/^```(json)?/i, '').replace(/```$/, '').trim()
    return content
  }

  return trimmed
}

function validateArrowPayload(payload: ArrowAlignment) {
  const requiredKeys: (keyof ArrowAlignment)[] = [
    'goal_clarity',
    'purpose',
    'effort',
    'detachment',
    'consistency',
    'arrow_alignment'
  ]

  for (const key of requiredKeys) {
    if (!(key in payload)) {
      throw new Error(`Precision Arrow response missing '${key}'`)
    }
  }

  return payload
}

export async function POST(request: Request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = (await request.json()) as PrecisionArrowInput
  const { goal, time_frame, context, emotional_state } = body

  if (!goal || typeof goal !== 'string') {
    return NextResponse.json({ error: "Missing or invalid 'goal'" }, { status: 400 })
  }

  const payload = {
    goal,
    time_frame: time_frame ?? null,
    context: context ?? null,
    emotional_state: emotional_state ?? null
  }

  try {
    
    if (!shouldUseLLM()) {
      const arrow = buildPrecisionArrow(payload)
      return NextResponse.json(arrow)
    }

    const messages = [
      { role: 'system' as const, content: PRECISION_ARROW_SYSTEM_PROMPT },
      { role: 'user' as const, content: JSON.stringify(payload) }
    ]

    const completion = await codex({
      model: getPrecisionArrowModel(),
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const text = normalizeJsonText(completion.content)
    if (!text) {
      throw new Error('Precision Arrow Engine returned an empty response')
    }

    let parsed: ArrowAlignment

    try {
      parsed = JSON.parse(text) as ArrowAlignment
    } catch (parseError) {
      throw new Error('Precision Arrow Engine returned invalid JSON')
    }

    const arrow = validateArrowPayload(parsed)

    return NextResponse.json(arrow)
  } catch (error) {
    console.error('Precision Arrow error:', error)

    try {
      const fallbackArrow = buildPrecisionArrow(payload)
      return NextResponse.json(fallbackArrow)
    } catch (fallbackError) {
      console.error('Precision Arrow fallback failed:', fallbackError)
      const message = error instanceof Error ? error.message : 'Precision Arrow Engine failed'
      return NextResponse.json(
        { error: message, kiaan_hint: 'KIAAN chat remains available while we steady the Precision Arrow Engine.' },
        { status: 500 }
      )
    }
  }
}
