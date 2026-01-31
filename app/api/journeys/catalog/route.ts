/**
 * Journey Catalog API Route
 * Proxies to backend with fallback to default templates when backend is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Default journey templates for when backend is unavailable
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_inner_peace',
    slug: 'inner-peace',
    title: 'Journey to Inner Peace',
    description: 'A transformative 7-day exploration of tranquility, acceptance, and letting go of anxiety through the timeless wisdom of the Bhagavad Gita.',
    primary_enemy_tags: ['krodha', 'moha'],
    duration_days: 7,
    difficulty: 1,
    is_featured: true,
    is_free: false,
    icon_name: 'peace',
    color_theme: 'emerald',
  },
  {
    id: 'tpl_conquering_desire',
    slug: 'conquering-desire',
    title: 'Conquering Desire (Kama)',
    description: 'Learn to master desires and attachments through ancient wisdom. Transform cravings into conscious choices.',
    primary_enemy_tags: ['kama'],
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    is_free: false,
    icon_name: 'heart',
    color_theme: 'rose',
  },
  {
    id: 'tpl_anger_mastery',
    slug: 'anger-mastery',
    title: 'Mastering Anger (Krodha)',
    description: 'Transform reactive anger into mindful responses. Develop emotional regulation through Gita principles.',
    primary_enemy_tags: ['krodha'],
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    is_free: true,  // Free journey for trial users
    icon_name: 'flame',
    color_theme: 'red',
  },
  {
    id: 'tpl_letting_go_greed',
    slug: 'letting-go-greed',
    title: 'Releasing Greed (Lobha)',
    description: 'Cultivate contentment and generosity. Learn to find abundance in simplicity.',
    primary_enemy_tags: ['lobha'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'coins',
    color_theme: 'amber',
  },
  {
    id: 'tpl_clarity_attachment',
    slug: 'clarity-through-detachment',
    title: 'Clarity Through Detachment (Moha)',
    description: 'Pierce through illusion and attachment. Develop clear seeing and wise discernment.',
    primary_enemy_tags: ['moha'],
    duration_days: 14,
    difficulty: 3,
    is_featured: false,
    is_free: false,
    icon_name: 'cloud',
    color_theme: 'purple',
  },
  {
    id: 'tpl_humble_strength',
    slug: 'humble-strength',
    title: 'Humble Strength (Mada)',
    description: 'Transform pride into humble confidence. Discover true strength through surrender.',
    primary_enemy_tags: ['mada'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'crown',
    color_theme: 'orange',
  },
  {
    id: 'tpl_joy_others',
    slug: 'joy-in-others-success',
    title: 'Joy in Others Success (Matsarya)',
    description: 'Release jealousy and comparison. Cultivate mudita - sympathetic joy for others.',
    primary_enemy_tags: ['matsarya'],
    duration_days: 14,
    difficulty: 2,
    is_featured: false,
    is_free: false,
    icon_name: 'eye',
    color_theme: 'teal',
  },
  {
    id: 'tpl_balanced_action',
    slug: 'balanced-action',
    title: 'Wisdom of Balanced Action',
    description: 'Learn Karma Yoga - the art of action without attachment to results. Perfect for navigating daily life.',
    primary_enemy_tags: ['mixed'],
    duration_days: 7,
    difficulty: 1,
    is_featured: true,
    is_free: false,
    icon_name: 'sparkles',
    color_theme: 'blue',
  },
]

function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    return new NextResponse(JSON.stringify(DEFAULT_TEMPLATES), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${BACKEND_URL}/api/journeys/catalog`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Backend catalog returned ${response.status}, using default templates`)
        return safeJsonResponse(DEFAULT_TEMPLATES)
      }

      const data = await response.json()

      // If backend returns empty array, use defaults
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return safeJsonResponse(DEFAULT_TEMPLATES)
      }

      return safeJsonResponse(data)
    } catch (error) {
      console.error('Error fetching catalog from backend:', error)
      return safeJsonResponse(DEFAULT_TEMPLATES)
    }
  } catch (outerError) {
    console.error('Critical error in catalog GET handler:', outerError)
    return safeJsonResponse(DEFAULT_TEMPLATES)
  }
}
