import { NextResponse } from 'next/server'
import { codex } from '@/lib/codex'
import { PRECISION_ARROW_SYSTEM_PROMPT } from '@/lib/models/precisionArrow'

export type PrecisionArrowInput = {
  goal: string
  time_frame?: string | null
  context?: string | null
  emotional_state?: string | null
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
      model: 'precision-arrow',
      messages,
      temperature: 0.3
    })

    const text = completion.content
    const arrow = JSON.parse(text)

    return NextResponse.json(arrow)
  } catch (error) {
    console.error('Precision Arrow error:', error)
    return NextResponse.json({ error: 'Precision Arrow Engine failed' }, { status: 500 })
  }
}
