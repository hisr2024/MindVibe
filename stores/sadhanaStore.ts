/**
 * Nityam Sadhana Store
 * Zustand state management for the daily sacred practice flow.
 */

import { create } from 'zustand'
import type {
  SadhanaPhase,
  SadhanaState,
  SadhanaActions,
} from '@/types/sadhana.types'

const PHASE_ORDER: SadhanaPhase[] = [
  'loading',
  'arrival',
  'breathwork',
  'verse',
  'reflection',
  'intention',
  'complete',
]

const initialState: SadhanaState = {
  phase: 'arrival',
  mood: null,
  composition: null,
  reflectionText: '',
  intentionText: '',
  startedAt: null,
  isComposing: false,
  error: null,
}

export const useSadhanaStore = create<SadhanaState & SadhanaActions>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setMood: (mood) => set({ mood }),

  setComposition: (composition) => set({ composition, isComposing: false, error: null }),

  setReflectionText: (reflectionText) => set({ reflectionText }),

  setIntentionText: (intentionText) => set({ intentionText }),

  setIsComposing: (isComposing) => set({ isComposing }),

  setError: (error) => set({ error, isComposing: false }),

  nextPhase: () => {
    const { phase } = get()
    const currentIndex = PHASE_ORDER.indexOf(phase)
    if (currentIndex < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[currentIndex + 1]
      set({
        phase: nextPhase,
        startedAt: nextPhase === 'breathwork' && !get().startedAt ? Date.now() : get().startedAt,
      })
    }
  },

  reset: () => set(initialState),
}))
