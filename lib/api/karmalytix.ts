/**
 * KarmaLytix API Client
 * Handles all API calls for the Sacred Reflections Analysis engine.
 */

import { apiFetch } from '@/lib/api'
import type { KarmaDashboard, KarmaScore, KarmaReport, KarmaPattern } from '@/types/karmalytix.types'

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`KarmaLytix API error: ${res.status}`)
  return (await res.json()) as T
}

export const karmalytixApi = {
  async fetchDashboard(): Promise<KarmaDashboard> {
    const res = await apiFetch('/api/karmalytix/dashboard')
    return parseJson<KarmaDashboard>(res)
  },

  async fetchKarmaScore(): Promise<KarmaScore> {
    const res = await apiFetch('/api/karmalytix/karma-score')
    return parseJson<KarmaScore>(res)
  },

  async fetchWeeklyReport(): Promise<KarmaReport> {
    const res = await apiFetch('/api/karmalytix/weekly-report')
    return parseJson<KarmaReport>(res)
  },

  async fetchHistory(limit = 8): Promise<KarmaReport[]> {
    const res = await apiFetch(`/api/karmalytix/history?limit=${limit}`)
    return parseJson<KarmaReport[]>(res)
  },

  async generateInsight(force = false): Promise<{ insight: string; report_id: number }> {
    const res = await apiFetch('/api/karmalytix/generate-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force_regenerate: force }),
    })
    return parseJson<{ insight: string; report_id: number }>(res)
  },

  async fetchPatterns(): Promise<KarmaPattern[]> {
    const res = await apiFetch('/api/karmalytix/patterns')
    return parseJson<KarmaPattern[]>(res)
  },
}
