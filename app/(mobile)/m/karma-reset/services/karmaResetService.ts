/**
 * Karma Reset Service — API client for the mobile Karma Reset experience.
 * All calls go through Next.js API routes which proxy to the backend.
 */

import type {
  KarmaResetContext,
  KarmaReflectionQuestion,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
} from '../types'

async function karmaFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `API error: ${response.status}`)
  }

  return response.json()
}

export async function getReflectionQuestion(
  context: KarmaResetContext,
  questionIndex: 0 | 1 | 2
): Promise<KarmaReflectionQuestion> {
  return karmaFetch('/api/karma-reset/reflect', { context, questionIndex })
}

export async function getWisdom(
  context: KarmaResetContext,
  reflections: KarmaReflectionAnswer[]
): Promise<KarmaWisdomResponse> {
  return karmaFetch('/api/karma-reset/wisdom', { context, reflections })
}

export async function completeSession(
  sessionId: string,
  sankalpaSigned: boolean,
  actionDharmaCommitted: string[]
): Promise<{
  success: boolean
  xpAwarded: number
  streakCount: number
  message: string
}> {
  return karmaFetch('/api/karma-reset/complete', {
    sessionId,
    sankalpaSigned,
    actionDharmaCommitted,
  })
}
