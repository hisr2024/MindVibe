import { NextResponse } from 'next/server'
import { codex } from '@/lib/codex'
import { PRECISION_ARROW_SYSTEM_PROMPT } from '@/lib/models/precisionArrow'

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

  try {
    const payload = {
      goal,
      time_frame: time_frame ?? null,
      context: context ?? null,
      emotional_state: emotional_state ?? null
    }

    const messages = [
      { role: 'system' as const, content: PRECISION_ARROW_SYSTEM_PROMPT },
      { role: 'user' as const, content: JSON.stringify(payload) }
    ]

    const completion = await codex({
      model: getPrecisionArrowModel(),
      messages,
      temperature: 0.3
    })

    const text = completion.content.trim()
    if (!text) {
      throw new Error('Precision Arrow Engine returned an empty response')
    }

    const parsed = JSON.parse(text) as ArrowAlignment
    const arrow = validateArrowPayload(parsed)

    return NextResponse.json(arrow)
  } catch (error) {
    console.error('Precision Arrow error:', error)
    return NextResponse.json({ error: 'Precision Arrow Engine failed' }, { status: 500 })
  }
}
