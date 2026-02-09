/**
 * KIAAN Mood Check-in - Next.js API Route
 *
 * Returns a mood check-in question. Uses KIAAN's personality to make
 * the check-in feel like a friend asking, not a clinical assessment.
 */

import { NextResponse } from 'next/server'

const MOOD_QUESTIONS = [
  "Quick check — how are you REALLY doing? Not the polite answer, the real one.",
  "On a scale from 'crushing it' to 'being crushed by it' — where are you today?",
  "What's the first emotion that comes to mind right now? Don't filter it.",
  "If your current mood was weather, what would it be? Sunny? Stormy? That weird cloudy-but-warm thing?",
  "Real talk: what's one thing that's weighing on you today that you haven't told anyone?",
  "How's your energy right now? Like phone battery percentage — what percent are you at?",
  "What's one word that describes how today has been so far?",
  "If I could fix ONE thing for you right now, what would it be?",
]

export async function POST() {
  const question = MOOD_QUESTIONS[Math.floor(Math.random() * MOOD_QUESTIONS.length)]
  return NextResponse.json({ question })
}
