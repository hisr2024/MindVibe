import { decryptJournalContent } from './crypto'
import { requireVaultUnlocked } from './middleware'
import { inMemoryVaultStore, VaultDataStore } from './store'
import { ApiResponse, AuthenticatedRequest, jsonResponse } from './types'

export type WeeklyJournalEntry = {
  datetime: string
  text: string
  mood_tag: string | null
}

export type WeeklyEvaluationPayload = {
  week_start: string
  week_end: string
  entries: WeeklyJournalEntry[]
}

export type WeeklyGuidancePayload = {
  profile: unknown
  evaluation: unknown
}

export async function sendToJournalWeeklyEvaluationEngine(payload: WeeklyEvaluationPayload): Promise<unknown> {
  return {
    summary: 'Weekly evaluation placeholder',
    week_start: payload.week_start,
    week_end: payload.week_end,
    entry_count: payload.entries.length
  }
}

export async function sendToKiaanWeeklyGuidanceEngine(payload: WeeklyGuidancePayload): Promise<string> {
  return `Guidance generated for week ${payload?.['evaluation']?.['week_start'] ?? ''}`
}

export async function getKiaanWeeklyGuidanceHandler(
  req: AuthenticatedRequest,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const lockCheck = requireVaultUnlocked(req, store)
  if (lockCheck) return lockCheck

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const entries = store
    .listJournalsByUser(req.user.id)
    .filter((entry) => entry.createdAt >= weekStart)
    .map((entry) => ({
      datetime: entry.createdAt.toISOString(),
      text: decryptJournalContent(
        { ciphertext: entry.contentEncrypted, iv: entry.iv, authTag: entry.authTag },
        req.user!.id
      ),
      mood_tag: entry.moodTag
    }))

  const evaluationPayload: WeeklyEvaluationPayload = {
    week_start: weekStart.toISOString(),
    week_end: now.toISOString(),
    entries
  }

  try {
    const evaluation = await sendToJournalWeeklyEvaluationEngine(evaluationPayload)
    const profile = store.getProfile(req.user.id)
    const guidanceText = await sendToKiaanWeeklyGuidanceEngine({ profile, evaluation })

    return jsonResponse(200, { guidance: guidanceText, evaluation })
  } catch (error) {
    return jsonResponse(500, { error: 'evaluation_unavailable' })
  }
}
