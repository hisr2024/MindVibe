/**
 * Frontend API client for the Gita VR backend.
 *
 * All requests go through the Next.js API proxy at /api/gita-vr/*
 * which forwards to the FastAPI backend.
 */

import type {
  AskKrishnaRequest,
  AskKrishnaResponse,
  VerseTeaching,
  ChapterIntro,
} from '@/types/gitaVR.types'

const BASE = '/api/gita-vr'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`Gita VR API error: ${res.status}`)
  }
  return res.json()
}

export const gitaVRService = {
  askKrishna(req: AskKrishnaRequest): Promise<AskKrishnaResponse> {
    return request<AskKrishnaResponse>(`${BASE}/ask-krishna`, {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  getVerseTeaching(chapter: number, verse: number): Promise<VerseTeaching> {
    return request<VerseTeaching>(`${BASE}/verse-teaching/${chapter}/${verse}`)
  },

  getChapterIntro(chapter: number): Promise<ChapterIntro> {
    return request<ChapterIntro>(`${BASE}/chapter-intro/${chapter}`)
  },
}
