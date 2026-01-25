/**
 * Wisdom Journey Generate - Create a new personalized journey
 * This route proxies to the backend with fallback support
 *
 * IMPORTANT: This route is designed to NEVER return a 500 error.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Safe response helper that never throws
function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    return new NextResponse(JSON.stringify({ _offline: true, id: crypto.randomUUID(), status: 'active' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Embedded wisdom verses for fallback
const EMBEDDED_VERSES = [
  {
    id: 1,
    chapter: 2,
    verse: 47,
    text: 'You have the right to work, but never to the fruit of work.',
    translation: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    theme: 'detachment',
    reflection: 'Focus on your efforts and let go of attachment to outcomes.',
  },
  {
    id: 2,
    chapter: 2,
    verse: 48,
    text: 'Perform work in yoga, abandoning attachment, being steadfast in equanimity.',
    translation: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय',
    theme: 'equanimity',
    reflection: 'Practice balance in success and failure to find true peace.',
  },
  {
    id: 3,
    chapter: 6,
    verse: 5,
    text: 'Elevate yourself through the power of your mind, and not degrade yourself.',
    translation: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्',
    theme: 'self-improvement',
    reflection: 'Your mind can be your greatest friend or enemy - choose wisely.',
  },
  {
    id: 4,
    chapter: 6,
    verse: 35,
    text: 'The mind is restless and difficult to restrain, but it can be controlled through practice.',
    translation: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्',
    theme: 'mind-control',
    reflection: 'With consistent practice and detachment, even the restless mind finds stillness.',
  },
  {
    id: 5,
    chapter: 12,
    verse: 13,
    text: 'One who is without hatred towards all beings, friendly and compassionate, is dear to Me.',
    translation: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
    theme: 'compassion',
    reflection: 'Cultivate compassion for all beings without exception.',
  },
  {
    id: 6,
    chapter: 2,
    verse: 14,
    text: 'The contacts of the senses with objects give rise to feelings of cold, heat, pleasure and pain.',
    translation: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः',
    theme: 'impermanence',
    reflection: 'Sensations are temporary - learn to endure them with equanimity.',
  },
  {
    id: 7,
    chapter: 3,
    verse: 19,
    text: 'Therefore, without being attached to the fruits of activities, one should act as duty.',
    translation: 'तस्मादसक्तः सततं कार्यं कर्म समाचर',
    theme: 'duty',
    reflection: 'Act from a sense of duty rather than desire for personal gain.',
  },
]

function generateFallbackJourney(userId: string, durationDays: number, customTitle?: string) {
  const journeyId = crypto.randomUUID()
  const now = new Date().toISOString()

  const title = customTitle || 'Journey to Inner Peace'
  const description = 'A transformative exploration through timeless wisdom from the Bhagavad Gita.'

  const steps = EMBEDDED_VERSES.slice(0, durationDays).map((verse, index) => ({
    id: crypto.randomUUID(),
    step_number: index + 1,
    verse_id: verse.id,
    verse_text: verse.text,
    verse_translation: verse.translation,
    verse_chapter: verse.chapter,
    verse_number: verse.verse,
    reflection_prompt: verse.reflection,
    ai_insight: `This verse from Chapter ${verse.chapter}, Verse ${verse.verse} offers guidance on ${verse.theme}. Let this wisdom illuminate your path today.`,
    completed: false,
    completed_at: null,
    time_spent_seconds: null,
    user_notes: null,
    user_rating: null,
  }))

  return {
    id: journeyId,
    user_id: userId,
    title,
    description,
    total_steps: steps.length,
    current_step: 0,
    status: 'active',
    progress_percentage: 0,
    recommended_by: 'ai',
    recommendation_score: 0.8,
    recommendation_reason: 'A balanced starting point for your wisdom journey',
    created_at: now,
    updated_at: now,
    completed_at: null,
    steps,
  }
}

export async function POST(request: NextRequest) {
  let body: { duration_days?: number; custom_title?: string } = { duration_days: 7 }
  let uidHeader: string | null = null

  try {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    // Forward auth headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    uidHeader = request.headers.get('X-Auth-UID')
    if (uidHeader) {
      headers.set('X-Auth-UID', uidHeader)
    }

    try {
      body = await request.json()
    } catch {
      body = { duration_days: 7 }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn(`Backend returned ${response.status}: ${errorText}, using fallback`)

        // Generate fallback journey
        const userId = uidHeader || 'demo-user'
        const fallbackJourney = generateFallbackJourney(
          userId,
          body.duration_days || 7,
          body.custom_title
        )

        return safeJsonResponse(fallbackJourney)
      }

      const data = await response.json()
      return safeJsonResponse(data)
    } catch (error) {
      console.error('Error generating journey:', error)

      // Generate fallback journey
      const userId = uidHeader || 'demo-user'
      const fallbackJourney = generateFallbackJourney(
        userId,
        body.duration_days || 7,
        body.custom_title
      )

      return safeJsonResponse(fallbackJourney)
    }
  } catch (outerError) {
    console.error('Critical error in generate POST handler:', outerError)
    // Generate a minimal fallback journey
    const fallbackJourney = generateFallbackJourney(
      uidHeader || 'demo-user',
      body.duration_days || 7,
      body.custom_title
    )
    return safeJsonResponse({ ...fallbackJourney, _offline: true })
  }
}
