/**
 * Bhagavad Gita VR Service - Frontend API Client
 *
 * Handles all communication with the Krishna VR API endpoints.
 * Provides typed methods for asking Krishna questions, fetching
 * verse teachings, and chapter introductions.
 */

import type {
  KrishnaRequest,
  KrishnaResponse,
  VerseTeaching,
  ChapterIntro,
} from '@/types/gitaVR.types'

const API_BASE = '/api/gita-vr'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Ask Krishna a question — KIAAN AI responds as Lord Krishna
 * with Gita wisdom, verse references, and animation cues.
 */
export async function askKrishna(
  question: string,
  chapterContext: number = 1,
  language: string = 'en'
): Promise<KrishnaResponse> {
  const body: KrishnaRequest = {
    question,
    chapter_context: chapterContext,
    language,
  }

  return fetchJSON<KrishnaResponse>(`${API_BASE}/ask-krishna`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Get a specific verse teaching with Sanskrit text, translation, and themes.
 */
export async function getVerseTeaching(
  chapter: number,
  verse: number
): Promise<VerseTeaching> {
  return fetchJSON<VerseTeaching>(
    `${API_BASE}/verse-teaching/${chapter}/${verse}`
  )
}

/**
 * Get chapter introduction for scene transition narration.
 */
export async function getChapterIntro(
  chapter: number
): Promise<ChapterIntro> {
  return fetchJSON<ChapterIntro>(`${API_BASE}/chapter-intro/${chapter}`)
}
