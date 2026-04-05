/**
 * KarmaLytix Store
 * Zustand state management for the Sacred Reflections Analysis dashboard.
 */

import { create } from 'zustand'
import { karmalytixApi } from '@/lib/api/karmalytix'
import type { KarmaDashboard } from '@/types/karmalytix.types'

interface KarmaLytixState {
  dashboard: KarmaDashboard | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastLoaded: string | null
}

interface KarmaLytixActions {
  loadDashboard: () => Promise<void>
  refreshInsight: () => Promise<void>
  clearError: () => void
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const useKarmaLytixStore = create<KarmaLytixState & KarmaLytixActions>((set, get) => ({
  dashboard: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastLoaded: null,

  loadDashboard: async () => {
    const last = get().lastLoaded
    if (last && Date.now() - new Date(last).getTime() < CACHE_TTL_MS) return

    set({ isLoading: true, error: null })
    try {
      const data = await karmalytixApi.fetchDashboard()
      set({ dashboard: data, lastLoaded: new Date().toISOString() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load karma data' })
    } finally {
      set({ isLoading: false })
    }
  },

  refreshInsight: async () => {
    set({ isRefreshing: true })
    try {
      await karmalytixApi.generateInsight(true)
      const data = await karmalytixApi.fetchDashboard()
      set({ dashboard: data, lastLoaded: new Date().toISOString() })
    } catch {
      set({ error: 'Failed to refresh insight' })
    } finally {
      set({ isRefreshing: false })
    }
  },

  clearError: () => set({ error: null }),
}))
