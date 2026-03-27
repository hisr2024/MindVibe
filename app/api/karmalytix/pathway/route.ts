/**
 * Karmalytix Pathway API Route
 *
 * Generates a personalized 5-step spiritual practice pathway using KIAAN + WisdomCore.
 * Three-tier fallback ensures a pathway is always returned:
 *   1. OpenAI (gpt-4o-mini) with WisdomCore verse context
 *   2. Local WisdomCore fallback (psychology-framed Gita wisdom, no AI)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  selectWisdomBatch,
  buildVerseContext,
  getGroundedWisdom,
} from '@/lib/wisdom-core'

// ─── Types ──────────────────────────────────────────────────────────────

interface MoodSummary {
  dominant_mood: string
  mood_counts: Record<string, number>
  entry_count: number
  days_analyzed: number
}

interface PathwayStep {
  title: string
  description: string
  practice: string
  gita_principle: string
}

interface PathwayResponse {
  pathway_name: string
  pathway_subtitle: string
  pathway_description: string
  steps: PathwayStep[]
}

// ─── Journal Mood → WisdomCore Mood Key ─────────────────────────────────

const MOOD_KEY_MAP: Record<string, string> = {
  peaceful: 'peaceful',
  happy: 'happy',
  neutral: 'neutral',
  charged: 'excited',
  open: 'hopeful',
  grateful: 'grateful',
  reflective: 'neutral',
  determined: 'excited',
  tender: 'sad',
  tired: 'stressed',
  anxious: 'anxious',
  heavy: 'overwhelmed',
}

function toWisdomCoreMood(journalMood: string): string {
  return MOOD_KEY_MAP[journalMood.toLowerCase()] ?? 'neutral'
}

// ─── Input Validation ───────────────────────────────────────────────────

function validateMoodSummary(data: unknown): MoodSummary | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>
  const dominant = obj.dominant_mood
  const counts = obj.mood_counts
  const entryCount = obj.entry_count
  const days = obj.days_analyzed

  if (typeof dominant !== 'string' || dominant.length === 0 || dominant.length > 50) return null
  if (typeof entryCount !== 'number' || entryCount < 0 || entryCount > 10000) return null
  if (typeof days !== 'number' || days < 1 || days > 365) return null
  if (!counts || typeof counts !== 'object') return null

  // Sanitize mood_counts — only allow known mood keys with numeric values
  const sanitizedCounts: Record<string, number> = {}
  for (const [key, val] of Object.entries(counts as Record<string, unknown>)) {
    const cleanKey = key.replace(/[<>\\]/g, '').slice(0, 50)
    if (typeof val === 'number' && val >= 0 && val <= 10000) {
      sanitizedCounts[cleanKey] = val
    }
  }

  return {
    dominant_mood: dominant.replace(/[<>\\]/g, '').slice(0, 50),
    mood_counts: sanitizedCounts,
    entry_count: entryCount,
    days_analyzed: days,
  }
}

// ─── OpenAI Pathway Generation (Tier 1) ─────────────────────────────────

function buildKarmalytixPrompt(
  verseContext: string,
  moodSummary: MoodSummary,
): string {
  const moodDistribution = Object.entries(moodSummary.mood_counts)
    .map(([mood, count]) => `${mood}: ${count}`)
    .join(', ')

  return `You are KIAAN's Karmalytix engine — a pathway architect rooted in the Bhagavad Gita's authenticated wisdom corpus.

INTERNAL WISDOM CONTEXT (absorb deeply, weave naturally, NEVER cite as scripture):
${verseContext}

MOOD ANALYSIS:
The seeker's dominant mood over the past ${moodSummary.days_analyzed} days is "${moodSummary.dominant_mood}" based on ${moodSummary.entry_count} journal reflections.
Mood distribution: ${moodDistribution}

TASK:
Generate a personalized 5-step spiritual practice pathway. Each step must:
1. Be grounded in an authentic principle from the wisdom context above
2. Frame the wisdom through modern psychology and behavioral science (secular)
3. Provide a concrete, actionable daily practice (not abstract philosophy)
4. Build progressively — step 1 is accessible, step 5 is deepest

RESPONSE FORMAT (strict JSON, no markdown fences):
{
  "pathway_name": "short evocative name (3-5 words)",
  "pathway_subtitle": "Sanskrit concept name (e.g., Shanti Marga)",
  "pathway_description": "1-2 sentences explaining why this pathway was chosen for this mood pattern",
  "steps": [
    {
      "title": "step name (2-4 words)",
      "description": "2-3 sentences of grounded wisdom. Use Sanskrit naturally. Frame through psychology.",
      "practice": "1-2 sentences: specific, daily, actionable practice the seeker can begin today",
      "gita_principle": "the underlying principle in plain language (e.g., 'action without attachment')"
    }
  ]
}

ABSOLUTE REQUIREMENTS:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", verse numbers
- Present wisdom as lived truth, not religious teaching
- Use Sanskrit terms naturally (dharma, karma, sattva, vairagya, tapas) where they add depth
- Each step must connect to a REAL principle from the context — no invention
- The pathway must be honest — acknowledge difficulty, don't offer false comfort
- Tone: warm, precise, grounded. Not saccharine or motivational-poster language
- Exactly 5 steps`
}

async function generateWithOpenAI(
  moodSummary: MoodSummary,
  wisdomMood: string,
): Promise<{ pathway: PathwayResponse; verse_refs: string[] } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-api-key-here') return null

  const verses = selectWisdomBatch(wisdomMood, 'spiritual', 5)
  const verseContext = buildVerseContext(wisdomMood, 'growth', 5)
  if (!verseContext) return null

  const verseRefs = verses.map(v => v.verse_ref)
  const systemPrompt = buildKarmalytixPrompt(verseContext, moodSummary)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my personalized Karmalytix pathway based on the mood analysis.' },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.warn(`[Karmalytix] OpenAI returned ${res.status}`)
      return null
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || content.length < 50) return null

    // Strip markdown fences if present
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned) as PathwayResponse

    // Validate structure
    if (
      !parsed.pathway_name ||
      !parsed.pathway_subtitle ||
      !parsed.pathway_description ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0
    ) {
      console.warn('[Karmalytix] Invalid pathway structure from OpenAI')
      return null
    }

    // Ensure each step has required fields
    const validSteps = parsed.steps
      .filter(
        (s): s is PathwayStep =>
          typeof s.title === 'string' &&
          typeof s.description === 'string' &&
          typeof s.practice === 'string' &&
          typeof s.gita_principle === 'string',
      )
      .slice(0, 5)

    if (validSteps.length < 3) {
      console.warn('[Karmalytix] Too few valid steps from OpenAI')
      return null
    }

    return {
      pathway: {
        pathway_name: parsed.pathway_name,
        pathway_subtitle: parsed.pathway_subtitle,
        pathway_description: parsed.pathway_description,
        steps: validSteps,
      },
      verse_refs: verseRefs,
    }
  } catch (err) {
    console.warn('[Karmalytix] OpenAI call failed:', err instanceof Error ? err.message : 'Unknown error')
    return null
  }
}

// ─── Local WisdomCore Fallback (Tier 2) ─────────────────────────────────

const STEP_THEMES: Array<{ title: string; topic: string; principle: string }> = [
  { title: 'Ground Yourself', topic: 'health', principle: 'present-moment awareness' },
  { title: 'Observe the Pattern', topic: 'growth', principle: 'self-awareness without judgment' },
  { title: 'Release What You Cannot Control', topic: 'spiritual', principle: 'action without attachment to outcome' },
  { title: 'Cultivate Inner Steadiness', topic: 'general', principle: 'equanimity through all conditions' },
  { title: 'Act from Your Center', topic: 'work', principle: 'dharma-aligned action' },
]

function buildLocalFallback(
  wisdomMood: string,
): { pathway: PathwayResponse; verse_refs: string[] } {
  const steps: PathwayStep[] = []
  const verseRefs: string[] = []
  const usedRefs: string[] = []

  for (const theme of STEP_THEMES) {
    const wisdom = getGroundedWisdom(wisdomMood, theme.topic, usedRefs)
    if (wisdom) {
      usedRefs.push(wisdom.verse_ref)
      verseRefs.push(wisdom.verse_ref)
      steps.push({
        title: theme.title,
        description: wisdom.wisdom,
        practice: `Spend 5 minutes each day sitting with this principle: ${theme.principle}. Notice when it applies to your lived experience.`,
        gita_principle: theme.principle,
      })
    } else {
      steps.push({
        title: theme.title,
        description: `The practice of ${theme.principle} invites you to meet each moment with clarity rather than reactivity.`,
        practice: `Spend 5 minutes each day sitting with this principle: ${theme.principle}. Notice when it applies to your lived experience.`,
        gita_principle: theme.principle,
      })
    }
  }

  return {
    pathway: {
      pathway_name: 'The Steady Path',
      pathway_subtitle: 'Sthira Marga',
      pathway_description:
        'Based on your recent reflections, this pathway guides you through grounding, self-observation, and purposeful action — building steadiness from the inside out.',
      steps,
    },
    verse_refs: verseRefs,
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const moodSummary = validateMoodSummary(body?.mood_summary)

    if (!moodSummary) {
      return NextResponse.json(
        { success: false, error: 'Invalid mood summary provided.' },
        { status: 400 },
      )
    }

    if (moodSummary.entry_count < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 journal entries are needed to generate a pathway.' },
        { status: 400 },
      )
    }

    const wisdomMood = toWisdomCoreMood(moodSummary.dominant_mood)

    // Tier 1: OpenAI with WisdomCore context
    const aiResult = await generateWithOpenAI(moodSummary, wisdomMood)
    if (aiResult) {
      return NextResponse.json({
        success: true,
        source: 'kiaan_ai',
        pathway: aiResult.pathway,
        verse_refs: aiResult.verse_refs,
      })
    }

    // Tier 2: Local WisdomCore fallback
    const localResult = buildLocalFallback(wisdomMood)
    return NextResponse.json({
      success: true,
      source: 'wisdom_core_local',
      pathway: localResult.pathway,
      verse_refs: localResult.verse_refs,
    })
  } catch (err) {
    console.warn('[Karmalytix] Unexpected error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Could not generate your pathway. Please try again in a moment.' },
      { status: 500 },
    )
  }
}
