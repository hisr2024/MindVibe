/**
 * Gita Chapters List — Next.js API Route
 *
 * Returns metadata for all 18 chapters of the Bhagavad Gita.
 * Tries the Python backend first, falls back to static data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

interface ChapterInfo {
  number: number
  name: string
  sanskrit: string
  verseCount: number
}

const STATIC_CHAPTERS: ChapterInfo[] = [
  { number: 1, name: 'Arjuna Vishada Yoga', sanskrit: 'अर्जुनविषादयोग', verseCount: 47 },
  { number: 2, name: 'Sankhya Yoga', sanskrit: 'सांख्ययोग', verseCount: 72 },
  { number: 3, name: 'Karma Yoga', sanskrit: 'कर्मयोग', verseCount: 43 },
  { number: 4, name: 'Jnana Karma Sanyasa Yoga', sanskrit: 'ज्ञानकर्मसंन्यासयोग', verseCount: 42 },
  { number: 5, name: 'Karma Sanyasa Yoga', sanskrit: 'कर्मसंन्यासयोग', verseCount: 29 },
  { number: 6, name: 'Dhyana Yoga', sanskrit: 'ध्यानयोग', verseCount: 47 },
  { number: 7, name: 'Jnana Vijnana Yoga', sanskrit: 'ज्ञानविज्ञानयोग', verseCount: 30 },
  { number: 8, name: 'Aksara Brahma Yoga', sanskrit: 'अक्षरब्रह्मयोग', verseCount: 28 },
  { number: 9, name: 'Raja Vidya Raja Guhya Yoga', sanskrit: 'राजविद्याराजगुह्ययोग', verseCount: 34 },
  { number: 10, name: 'Vibhuti Yoga', sanskrit: 'विभूतियोग', verseCount: 42 },
  { number: 11, name: 'Vishwarupa Darshana Yoga', sanskrit: 'विश्वरूपदर्शनयोग', verseCount: 55 },
  { number: 12, name: 'Bhakti Yoga', sanskrit: 'भक्तियोग', verseCount: 20 },
  { number: 13, name: 'Kshetra Kshetragna Vibhaga Yoga', sanskrit: 'क्षेत्रक्षेत्रज्ञविभागयोग', verseCount: 35 },
  { number: 14, name: 'Gunatraya Vibhaga Yoga', sanskrit: 'गुणत्रयविभागयोग', verseCount: 27 },
  { number: 15, name: 'Purushottama Yoga', sanskrit: 'पुरुषोत्तमयोग', verseCount: 20 },
  { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', sanskrit: 'दैवासुरसम्पद्विभागयोग', verseCount: 24 },
  { number: 17, name: 'Sraddhatraya Vibhaga Yoga', sanskrit: 'श्रद्धात्रयविभागयोग', verseCount: 28 },
  { number: 18, name: 'Moksha Sanyasa Yoga', sanskrit: 'मोक्षसंन्यासयोग', verseCount: 78 },
]

export async function GET(request: NextRequest) {
  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/gita/chapters`, {
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.chapters) && data.chapters.length > 0) {
        return forwardCookies(res, NextResponse.json(data))
      }
    }
  } catch {
    // Backend unavailable — use static fallback
  }

  return NextResponse.json({ chapters: STATIC_CHAPTERS })
}
