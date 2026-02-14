/**
 * Zustand store for next-step suggestions.
 *
 * Holds:
 *  - Feature flag `nextStepSuggestionsEnabled`
 *  - Session-scoped theme occurrence counters (in-memory only, no persistence)
 */

import { create } from 'zustand'

interface NextStepState {
  /** Feature flag: whether next-step suggestion links are shown */
  nextStepSuggestionsEnabled: boolean
  setNextStepSuggestionsEnabled: (enabled: boolean) => void

  /** Session-scoped theme keyword → occurrence count */
  themeCounts: Record<string, number>
  /** Increment the counter for a single theme keyword */
  incrementTheme: (theme: string) => void
  /** Reset all theme counters (e.g. on session clear) */
  resetThemeCounts: () => void
}

export const useNextStepStore = create<NextStepState>((set) => ({
  nextStepSuggestionsEnabled: true,
  setNextStepSuggestionsEnabled: (enabled) =>
    set({ nextStepSuggestionsEnabled: enabled }),

  themeCounts: {},
  incrementTheme: (theme) =>
    set((state) => ({
      themeCounts: {
        ...state.themeCounts,
        [theme]: (state.themeCounts[theme] || 0) + 1,
      },
    })),
  resetThemeCounts: () => set({ themeCounts: {} }),
}))
