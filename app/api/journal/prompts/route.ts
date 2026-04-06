/**
 * Daily Sacred Reflection prompts — metadata-only.
 *
 * Returns three rotating prompts seeded by the current date so the list is
 * stable within a day but changes day-to-day. A future iteration can feed
 * recent mood frequencies into a KIAAN model; the response shape is stable.
 */

import { NextResponse } from 'next/server'

const PROMPT_POOL: Array<{ text: string; suggestedMood?: string }> = [
  { text: 'What am I still not saying, even to myself?', suggestedMood: 'seeking' },
  { text: 'Where is there a boundary I have been too afraid to draw?', suggestedMood: 'heavy' },
  { text: 'What would I do if I were not afraid of disappointing someone?', suggestedMood: 'seeking' },
  { text: 'What am I grateful for that I have never spoken aloud?', suggestedMood: 'grateful' },
  { text: 'Where have I confused surrender with giving up?', suggestedMood: 'heavy' },
  { text: 'What in me is ready to soften?', suggestedMood: 'wounded' },
  { text: 'Which part of my day today felt most like worship?', suggestedMood: 'peaceful' },
  { text: 'If today had a single word, what would it be — and why?', suggestedMood: 'reflection' as unknown as string },
  { text: 'Where am I practicing patience? Where am I pretending to?', suggestedMood: 'seeking' },
  { text: 'What would compassion toward myself look like right now?', suggestedMood: 'wounded' },
  { text: 'What have I outgrown but am still carrying?', suggestedMood: 'heavy' },
  { text: 'What light in me wants to be visible this week?', suggestedMood: 'radiant' },
]

function dayOfYear(d: Date): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0))
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export async function GET() {
  const seed = dayOfYear(new Date())
  const picks: Array<{ id: string; text: string; suggestedMood?: string }> = []
  for (let i = 0; i < 3; i++) {
    const p = PROMPT_POOL[(seed + i * 4) % PROMPT_POOL.length]
    picks.push({ id: `prompt-${seed}-${i}`, text: p.text, suggestedMood: p.suggestedMood })
  }
  return NextResponse.json({ prompts: picks })
}
