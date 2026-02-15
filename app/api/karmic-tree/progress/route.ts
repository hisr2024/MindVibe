/**
 * Karmic Tree Progress API Proxy
 * Proxies to backend karmic-tree service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_PROGRESS = {
  total_karma_points: 42,
  level: 2,
  level_name: 'Seeker',
  next_level_points: 100,
  tree_stage: 'sapling',
  branches: [
    { category: 'meditation', points: 15, label: 'Meditation' },
    { category: 'journaling', points: 12, label: 'Journaling' },
    { category: 'wisdom', points: 10, label: 'Wisdom' },
    { category: 'compassion', points: 5, label: 'Compassion' },
  ],
  recent_actions: [],
  streak_days: 0,
  _fallback: true,
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/karmic-tree/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    // Return fallback for auth failures or other errors
    return NextResponse.json(FALLBACK_PROGRESS)
  } catch {
    // Backend unavailable - return fallback
    return NextResponse.json(FALLBACK_PROGRESS)
  }
}
