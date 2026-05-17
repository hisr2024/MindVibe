/**
 * Fetch the user's current spiritual journey context for KIAAN personalisation.
 *
 * All fetches run in parallel and are individually fault-tolerant — a failure
 * in one source (e.g. journey dashboard is down) never blocks the others.
 * Returns an empty-but-typed context if everything fails.
 */

import { apiFetch } from '@/lib/api'
import type { UserPersonalisationContext, ActiveJourneyContext } from './types'

export async function getPersonalisationContext(): Promise<UserPersonalisationContext> {
  const [journeys, moods, bookmarks] = await Promise.allSettled([
    apiFetch('/api/journey-engine/dashboard').then(r =>
      r.ok ? r.json() : null,
    ),
    apiFetch('/api/analytics/mood-trends?days=7').then(r =>
      r.ok ? r.json() : null,
    ),
    apiFetch('/api/gita/favorites?limit=5').then(r =>
      r.ok ? r.json() : null,
    ),
  ])

  const activeJourneys: ActiveJourneyContext[] = []
  if (journeys.status === 'fulfilled' && journeys.value?.active_journeys) {
    for (const j of journeys.value.active_journeys) {
      activeJourneys.push({
        enemyId: j.enemy_id ?? j.primary_enemies?.[0] ?? '',
        enemyName: j.enemy_name ?? j.title ?? '',
        dayNumber: j.current_day ?? 1,
        totalDays: j.total_days ?? j.duration_days ?? 14,
      })
    }
  }

  const recentMoods: string[] = []
  if (moods.status === 'fulfilled' && moods.value) {
    const entries =
      moods.value.mood_entries ?? moods.value.moods ?? moods.value.data ?? []
    for (const entry of entries.slice(0, 7)) {
      if (typeof entry === 'string') recentMoods.push(entry)
      else if (entry?.mood) recentMoods.push(entry.mood)
      else if (entry?.label) recentMoods.push(entry.label)
    }
  }

  const bookmarkedVerses: string[] = []
  if (bookmarks.status === 'fulfilled' && bookmarks.value) {
    const verses =
      bookmarks.value.verses ?? bookmarks.value.favorites ?? bookmarks.value.data ?? []
    for (const v of verses.slice(0, 5)) {
      if (typeof v === 'string') bookmarkedVerses.push(v)
      else if (v?.verse_ref) bookmarkedVerses.push(v.verse_ref)
      else if (v?.chapter && v?.verse)
        bookmarkedVerses.push(`BG ${v.chapter}.${v.verse}`)
    }
  }

  return { activeJourneys, recentMoods, bookmarkedVerses }
}

/**
 * Build a contextual enrichment string from the user's personalisation context.
 * This is appended to KIAAN prompts so responses reference the user's actual
 * spiritual state instead of being generic.
 */
export function buildContextString(ctx: UserPersonalisationContext): string {
  const parts: string[] = []

  if (ctx.activeJourneys.length > 0) {
    const primary = ctx.activeJourneys[0]
    parts.push(
      `Currently on a ${primary.enemyName} journey (Day ${primary.dayNumber} of ${primary.totalDays}).`,
    )
  }

  if (ctx.recentMoods.length > 0) {
    const unique = [...new Set(ctx.recentMoods)]
    parts.push(`Recent emotional landscape: ${unique.slice(0, 3).join(', ')}.`)
  }

  if (ctx.bookmarkedVerses.length > 0) {
    parts.push(
      `Verses they return to: ${ctx.bookmarkedVerses.slice(0, 3).join(', ')}.`,
    )
  }

  return parts.join(' ')
}
