export type PrecisionArrowInput = {
  goal: string
  time_frame?: string
  context?: string
  emotional_state?: string
  kiaan_context?: string
}

export async function createPrecisionArrow(input: PrecisionArrowInput) {
  const response = await fetch('/api/precision-arrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message = errorPayload?.error ?? 'Failed to generate precision arrow'
    throw new Error(message)
  }

  return response.json()
}
