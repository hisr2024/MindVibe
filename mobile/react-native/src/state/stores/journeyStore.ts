/**
 * Journey State Store (Zustand)
 *
 * Manages local state for the journey engine:
 * - Active journeys list (cached from API)
 * - Journey templates (cached from API)
 * - Current step data
 * - Dashboard summary
 *
 * Server is the source of truth — this store caches for offline access
 * and drives the UI between TanStack Query fetches.
 */

import { create } from 'zustand';
import type { Journey, JourneyStatus } from '@app-types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JourneyTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  enemy: string;
  thumbnailUrl?: string;
  tags: string[];
}

export interface JourneyDashboard {
  activeJourneys: number;
  completedJourneys: number;
  currentStreak: number;
  totalDaysCompleted: number;
}

interface JourneyState {
  templates: JourneyTemplate[];
  activeJourneys: Journey[];
  dashboard: JourneyDashboard | null;
  selectedJourneyId: string | null;
  filterStatus: JourneyStatus | 'all';
}

interface JourneyActions {
  setTemplates: (templates: JourneyTemplate[]) => void;
  setActiveJourneys: (journeys: Journey[]) => void;
  setDashboard: (dashboard: JourneyDashboard) => void;
  selectJourney: (journeyId: string | null) => void;
  setFilterStatus: (status: JourneyStatus | 'all') => void;
  updateJourneyProgress: (journeyId: string, completedSteps: number, currentDay: number) => void;
  updateJourneyStatus: (journeyId: string, status: JourneyStatus) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: JourneyState = {
  templates: [],
  activeJourneys: [],
  dashboard: null,
  selectedJourneyId: null,
  filterStatus: 'all',
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJourneyStore = create<JourneyState & JourneyActions>(
  (set) => ({
    ...initialState,

    setTemplates: (templates) => set({ templates }),

    setActiveJourneys: (journeys) => set({ activeJourneys: journeys }),

    setDashboard: (dashboard) => set({ dashboard }),

    selectJourney: (journeyId) => set({ selectedJourneyId: journeyId }),

    setFilterStatus: (status) => set({ filterStatus: status }),

    updateJourneyProgress: (journeyId, completedSteps, currentDay) =>
      set((state) => ({
        activeJourneys: state.activeJourneys.map((j) =>
          j.id === journeyId
            ? { ...j, completedSteps, currentDay }
            : j,
        ),
      })),

    updateJourneyStatus: (journeyId, status) =>
      set((state) => ({
        activeJourneys: state.activeJourneys.map((j) =>
          j.id === journeyId ? { ...j, status } : j,
        ),
      })),

    reset: () => set(initialState),
  }),
);
