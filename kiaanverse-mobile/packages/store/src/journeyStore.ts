/**
 * Journey Store — Zustand state for journey tracking and progress.
 *
 * Manages:
 * - Active journey tracking (which journey is being viewed/worked on)
 * - Optimistic step completion (UI feedback before server confirms)
 * - Enrolled journeys cache for offline display
 * - Completed journey IDs
 * - Per-journey progress tracking
 *
 * Server data is managed by TanStack Query hooks in @kiaanverse/api
 * (useJourneys, useWisdomJourneyDetail, useCompleteWisdomStep).
 * This store holds optimistic UI state and offline caches.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Journey } from '@kiaanverse/api';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Local progress tracking for a journey */
export interface JourneyProgress {
  /** Current day in the journey */
  currentDay: number;
  /** Number of completed steps */
  completedSteps: number;
  /** Total steps in the journey */
  totalSteps: number;
  /** ISO timestamp when the journey was started */
  startedAt: string;
  /** ISO timestamp of last activity */
  lastActivityAt: string;
}

interface JourneyState {
  /** Currently viewed journey ID (for detail screen) */
  activeJourneyId: string | null;
  /** Optimistic step completion tracking (format: "journeyId:dayIndex") */
  completingStepKey: string | null;
  /** Offline cache of enrolled (active) journeys */
  enrolledJourneys: Journey[];
  /** IDs of completed journeys */
  completedJourneys: string[];
  /** Per-journey progress tracking */
  journeyProgress: Record<string, JourneyProgress>;
  /** Currently active journey ID (the one being worked on daily) */
  currentJourneyId: string | null;
}

interface JourneyActions {
  /** Set the journey being viewed in the detail screen */
  setActiveJourney: (journeyId: string | null) => void;
  /** Mark a step as being completed (optimistic UI) */
  setCompletingStep: (journeyId: string, dayIndex: number) => void;
  /** Clear the optimistic step completion */
  clearCompletingStep: () => void;
  /** Bulk replace enrolled journeys from server response */
  setEnrolledJourneys: (journeys: Journey[]) => void;
  /** Add a single journey to enrolled list */
  addEnrolledJourney: (journey: Journey) => void;
  /** Remove a journey from enrolled list */
  removeEnrolledJourney: (journeyId: string) => void;
  /** Mark a journey as completed (moves to completedJourneys, removes from enrolled) */
  markJourneyCompleted: (journeyId: string) => void;
  /** Update progress for a specific journey */
  updateJourneyProgress: (journeyId: string, progress: Partial<JourneyProgress>) => void;
  /** Set the currently active journey */
  setCurrentJourney: (journeyId: string | null) => void;
  /** Full reset (e.g. on logout) */
  resetJourneys: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: JourneyState = {
  activeJourneyId: null,
  completingStepKey: null,
  enrolledJourneys: [],
  completedJourneys: [],
  journeyProgress: {},
  currentJourneyId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJourneyStore = create<JourneyState & JourneyActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setActiveJourney: (journeyId: string | null) => {
          set((state) => {
            state.activeJourneyId = journeyId;
          });
        },

        setCompletingStep: (journeyId: string, dayIndex: number) => {
          set((state) => {
            state.completingStepKey = `${journeyId}:${dayIndex}`;
          });
        },

        clearCompletingStep: () => {
          set((state) => {
            state.completingStepKey = null;
          });
        },

        setEnrolledJourneys: (journeys: Journey[]) => {
          set((state) => {
            state.enrolledJourneys = journeys;
          });
        },

        addEnrolledJourney: (journey: Journey) => {
          set((state) => {
            // Avoid duplicates
            const exists = state.enrolledJourneys.some((j) => j.id === journey.id);
            if (!exists) {
              state.enrolledJourneys.push(journey);
            }
          });
        },

        removeEnrolledJourney: (journeyId: string) => {
          set((state) => {
            state.enrolledJourneys = state.enrolledJourneys.filter(
              (j) => j.id !== journeyId,
            );
          });
        },

        markJourneyCompleted: (journeyId: string) => {
          set((state) => {
            // Add to completed list (avoid duplicates)
            if (!state.completedJourneys.includes(journeyId)) {
              state.completedJourneys.push(journeyId);
            }
            // Remove from enrolled
            state.enrolledJourneys = state.enrolledJourneys.filter(
              (j) => j.id !== journeyId,
            );
            // Clear current journey if it was the completed one
            if (state.currentJourneyId === journeyId) {
              state.currentJourneyId = null;
            }
          });
        },

        updateJourneyProgress: (journeyId: string, progress: Partial<JourneyProgress>) => {
          set((state) => {
            const existing = state.journeyProgress[journeyId];
            if (existing) {
              // Merge partial update into existing progress
              Object.assign(existing, progress);
            } else {
              // Create new progress entry with defaults
              state.journeyProgress[journeyId] = {
                currentDay: 0,
                completedSteps: 0,
                totalSteps: 0,
                startedAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString(),
                ...progress,
              };
            }
          });
        },

        setCurrentJourney: (journeyId: string | null) => {
          set((state) => {
            state.currentJourneyId = journeyId;
          });
        },

        resetJourneys: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'kiaanverse-journeys',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist offline caches — NOT transient optimistic state
        partialize: (state) => ({
          enrolledJourneys: state.enrolledJourneys,
          completedJourneys: state.completedJourneys,
          journeyProgress: state.journeyProgress,
          currentJourneyId: state.currentJourneyId,
        }),
      },
    ),
    {
      name: 'JourneyStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
