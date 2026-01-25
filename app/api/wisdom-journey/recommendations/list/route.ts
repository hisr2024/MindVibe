/**
 * Wisdom Journey Recommendations - Get personalized journey recommendations
 * This route proxies to the backend with fallback support
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Default recommendations for fallback
const DEFAULT_RECOMMENDATIONS = [
  {
    template: 'inner_peace',
    title: 'Journey to Inner Peace',
    description: 'A transformative exploration of tranquility, acceptance, and letting go of anxiety through timeless wisdom.',
    score: 0.85,
    reason: 'Perfect for beginning your wisdom journey with foundational teachings on finding peace within.',
  },
  {
    template: 'self_discovery',
    title: 'Path of Self-Discovery',
    description: 'Explore your true nature, purpose, and potential through reflective wisdom.',
    score: 0.78,
    reason: 'Discover deeper insights about yourself and your life purpose.',
  },
  {
    template: 'balanced_action',
    title: 'Wisdom of Balanced Action',
    description: 'Learn to act without attachment, finding harmony between effort and surrender.',
    score: 0.72,
    reason: 'A versatile path for navigating daily life with greater awareness.',
  },
]

export async function GET(request: NextRequest) {
  const headers = new Headers()

  // Forward auth headers
  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    headers.set('Authorization', authHeader)
  }

  const uidHeader = request.headers.get('X-Auth-UID')
  if (uidHeader) {
    headers.set('X-Auth-UID', uidHeader)
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/recommendations/list`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      // Return default recommendations on backend error
      console.warn(`Backend returned ${response.status}, using default recommendations`)
      return NextResponse.json(DEFAULT_RECOMMENDATIONS, { status: 200 })
    }

    const data = await response.json()

    // If backend returns empty array, use defaults
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json(DEFAULT_RECOMMENDATIONS, { status: 200 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching recommendations:', error)

    // Return default recommendations on error
    return NextResponse.json(DEFAULT_RECOMMENDATIONS, { status: 200 })
  }
}
