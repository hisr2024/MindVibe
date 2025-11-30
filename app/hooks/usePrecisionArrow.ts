export type PrecisionArrowInput = {
  goal: string
  time_frame?: string
  context?: string
  emotional_state?: string
}

export async function createPrecisionArrow(input: PrecisionArrowInput) {
  const response = await fetch('/api/precision-arrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    throw new Error('Failed to generate precision arrow')
  }

  return response.json()
}
