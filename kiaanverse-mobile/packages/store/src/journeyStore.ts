/**
 * Journey Store
 *
 * Local state for journey interactions.
 * Server data is managed by TanStack Query hooks in @kiaanverse/api.
 * This store holds optimistic UI state and active journey tracking.
 */

import { create } from 'zustand';

interface JourneyState {
  /** Currently viewed journey ID (for detail screen) */
  activeJourneyId: string | null;
  /** Optimistic step completion tracking */
  completingStepKey: string | null;
}

interface JourneyActions {
  setActiveJourney: (journeyId: string | null) => void;
  setCompletingStep: (journeyId: string, dayIndex: number) => void;
  clearCompletingStep: () => void;
}

export const useJourneyStore = create<JourneyState & JourneyActions>((set) => ({
  activeJourneyId: null,
  completingStepKey: null,

  setActiveJourney: (journeyId) => set({ activeJourneyId: journeyId }),

  setCompletingStep: (journeyId, dayIndex) =>
    set({ completingStepKey: `${journeyId}:${dayIndex}` }),

  clearCompletingStep: () => set({ completingStepKey: null }),
}));
