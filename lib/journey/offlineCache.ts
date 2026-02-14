/**
 * Offline cache layer for journey day metadata.
 *
 * Hydrates the JOURNEY_META IndexedDB store from the static
 * JOURNEY_DAY_META array on first load, then serves reads from IDB.
 * No backend dependency — the data is fully bundled.
 */

import { indexedDBManager, STORES } from '@/lib/offline/indexedDB'
import { JOURNEY_DAY_META, type JourneyDayMeta } from './dayMeta'

/** Shape stored in IDB — adds a string `id` to satisfy the shared keyPath. */
interface StoredDayMeta extends JourneyDayMeta {
  id: string
}

let hydrated = false

/**
 * Seed IndexedDB with the static day metadata if not already present.
 * Safe to call multiple times — skips after the first successful hydration.
 */
export async function hydrateJourneyMeta(): Promise<void> {
  if (hydrated) return

  try {
    const existing = await indexedDBManager.getAll<StoredDayMeta>(STORES.JOURNEY_META)

    if (existing.length >= JOURNEY_DAY_META.length) {
      hydrated = true
      return
    }

    for (const meta of JOURNEY_DAY_META) {
      const record: StoredDayMeta = { ...meta, id: `day-${meta.day}` }
      await indexedDBManager.put(STORES.JOURNEY_META, record)
    }

    hydrated = true
  } catch (err) {
    // IndexedDB unavailable (SSR, private browsing quota exceeded, etc.)
    // Fall through — callers use the in-memory array as fallback.
    console.warn('[journey/offlineCache] Failed to hydrate IDB:', err)
  }
}

/**
 * Get day metadata from IndexedDB, falling back to the in-memory array.
 */
export async function getOfflineDayMeta(day: number): Promise<JourneyDayMeta | undefined> {
  try {
    const cached = await indexedDBManager.get<StoredDayMeta>(STORES.JOURNEY_META, `day-${day}`)
    if (cached) return cached
  } catch {
    // Fall through to in-memory
  }

  return JOURNEY_DAY_META.find((d) => d.day === day)
}

/**
 * Get all day metadata from IndexedDB, falling back to the in-memory array.
 */
export async function getAllOfflineDayMeta(): Promise<JourneyDayMeta[]> {
  try {
    const cached = await indexedDBManager.getAll<StoredDayMeta>(STORES.JOURNEY_META)
    if (cached.length >= JOURNEY_DAY_META.length) return cached
  } catch {
    // Fall through to in-memory
  }

  return JOURNEY_DAY_META
}
