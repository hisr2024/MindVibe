/**
 * Journeys API Route
 *
 * GET /api/journeys → List journeys (proxies to journey-engine with fallback catalog)
 *
 * This route serves the desktop journeys list page. It tries the
 * journey-engine backend first, falls back to a static catalog
 * so the page always renders something useful.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const queryString = status ? `?status=${status}` : ''

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys${queryString}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
        signal: AbortSignal.timeout(5000),
      }
    )

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    // Forward auth errors
    if (backendResponse.status === 401 || backendResponse.status === 403) {
      const data = await backendResponse.json().catch(() => ({}))
      return forwardCookies(
        backendResponse,
        NextResponse.json(
          { ...data, items: [], journeys: [] },
          { status: backendResponse.status }
        )
      )
    }

    // If requesting active journeys and backend errored, return empty
    if (status === 'active') {
      return NextResponse.json({ items: [], journeys: [] })
    }

    // Return static journey catalog as fallback
    return NextResponse.json({
      items: getStaticJourneyCatalog(),
      journeys: getStaticJourneyCatalog(),
    })
  } catch {
    return NextResponse.json({
      items: getStaticJourneyCatalog(),
      journeys: getStaticJourneyCatalog(),
    })
  }
}

function getStaticJourneyCatalog() {
  return [
    {
      id: 'transform-anger-krodha',
      title: 'Transform Anger (Krodha)',
      description: 'A 14-day journey to understand and transform anger through Gita wisdom and modern psychology.',
      category: 'anger',
      duration_days: 14,
      difficulty: 'beginner',
      is_premium: false,
      enrolled_count: 2847,
      rating: 4.8,
    },
    {
      id: 'overcome-anxiety-bhaya',
      title: 'Overcome Anxiety (Bhaya)',
      description: 'Release fear and anxiety with ancient breathing techniques and wisdom from Chapter 2 of the Gita.',
      category: 'anxiety',
      duration_days: 14,
      difficulty: 'beginner',
      is_premium: false,
      enrolled_count: 3102,
      rating: 4.9,
    },
    {
      id: 'find-inner-peace-shanti',
      title: 'Find Inner Peace (Shanti)',
      description: 'Discover lasting inner peace through meditation, self-reflection, and the teachings of Lord Krishna.',
      category: 'peace',
      duration_days: 21,
      difficulty: 'intermediate',
      is_premium: false,
      enrolled_count: 4521,
      rating: 4.9,
    },
    {
      id: 'personal-growth-vikas',
      title: 'Personal Growth (Vikas)',
      description: "Unlock your potential with daily practices rooted in the Gita's teachings on self-mastery.",
      category: 'growth',
      duration_days: 14,
      difficulty: 'intermediate',
      is_premium: false,
      enrolled_count: 1893,
      rating: 4.7,
    },
    {
      id: 'release-attachment-vairagya',
      title: 'Release Attachment (Vairagya)',
      description: 'Learn the art of detachment without indifference. Transform clinging into conscious connection.',
      category: 'peace',
      duration_days: 21,
      difficulty: 'advanced',
      is_premium: true,
      enrolled_count: 1204,
      rating: 4.8,
    },
    {
      id: 'emotional-resilience-dhairya',
      title: 'Emotional Resilience (Dhairya)',
      description: "Build unshakeable inner strength through the warrior wisdom of Arjuna's transformation.",
      category: 'growth',
      duration_days: 14,
      difficulty: 'intermediate',
      is_premium: true,
      enrolled_count: 987,
      rating: 4.7,
    },
  ]
}
