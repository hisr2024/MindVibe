/**
 * Kiaanverse API Client — Frontend service for the Kiaanverse backend.
 *
 * All requests go through Next.js API routes at /api/kiaanverse/*
 * which proxy to the FastAPI backend.
 */

import type {
  AskKrishnaRequest,
  AskKrishnaResponse,
  VerseTeaching,
  ChapterIntro,
} from '@/types/kiaanverse.types'

const BASE = '/api/kiaanverse'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Kiaanverse API error ${res.status}: ${errorText}`)
  }
  return res.json()
}

export const kiaanverseService = {
  /**
   * Ask Krishna a question (Sakha Mode) or request recitation (Recital Mode).
   * Routes to KIAAN AI with Krishna persona overlay.
   */
  askKrishna(req: AskKrishnaRequest): Promise<AskKrishnaResponse> {
    return request<AskKrishnaResponse>(`${BASE}/ask-krishna`, {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  /**
   * Get verse teaching with Sanskrit, transliteration, translation.
   * Retrieves from STATIC CORE WISDOM database.
   */
  getVerseTeaching(chapter: number, verse: number): Promise<VerseTeaching> {
    return request<VerseTeaching>(`${BASE}/verse-teaching?chapter=${chapter}&verse=${verse}`)
  },

  /**
   * Get chapter introduction for scene narration.
   * Retrieves from STATIC CORE WISDOM database.
   */
  getChapterIntro(chapter: number): Promise<ChapterIntro> {
    return request<ChapterIntro>(`${BASE}/chapter-intro?chapter=${chapter}`)
  },
}
