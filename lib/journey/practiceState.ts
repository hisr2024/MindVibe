/**
 * Persistence adapter for micro-practice "Mark practiced" state.
 *
 * Stores a simple boolean per journey+day in IndexedDB (PRACTICE_STATE store).
 * Falls back gracefully when IDB is unavailable (SSR, private browsing).
 * No backend dependency — fully offline-first.
 */

import { indexedDBManager, STORES } from '@/lib/offline/indexedDB'

/** Shape stored in IDB. */
export interface PracticeStateRecord {
  /** Composite key: `{journeyId}:day-{day}` */
  id: string
  journeyId: string
  day: number
  practiced: boolean
  /** ISO timestamp of when the toggle was last changed */
  updatedAt: string
}

/** Build the composite IDB key for a journey + day. */
export function practiceKey(journeyId: string, day: number): string {
  return `${journeyId}:day-${day}`
}

/**
 * Read the practiced state for a single day.
 * Returns `false` when no record exists or IDB is unavailable.
 */
export async function getPracticeState(journeyId: string, day: number): Promise<boolean> {
  try {
    const record = await indexedDBManager.get<PracticeStateRecord>(
      STORES.PRACTICE_STATE,
      practiceKey(journeyId, day),
    )
    return record?.practiced ?? false
  } catch {
    return false
  }
}

/**
 * Write the practiced state for a single day.
 * Creates or updates the record in IDB.
 */
export async function setPracticeState(
  journeyId: string,
  day: number,
  practiced: boolean,
): Promise<void> {
  const record: PracticeStateRecord = {
    id: practiceKey(journeyId, day),
    journeyId,
    day,
    practiced,
    updatedAt: new Date().toISOString(),
  }

  try {
    await indexedDBManager.put(STORES.PRACTICE_STATE, record)
  } catch (err) {
    console.warn('[journey/practiceState] Failed to persist practice state:', err)
  }
}
