/**
 * Karma Reset Store — manages the 4-phase sacred healing ritual.
 *
 * Phases:
 * 1. acknowledgment — Recognize the karmic pattern
 * 2. understanding — Receive Gita wisdom for the pattern
 * 3. release — Sacred breathing and release ritual
 * 4. renewal — Set new intention, receive blessing
 *
 * No persistence: session is transient, resets on app restart.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KarmaResetPhase = 1 | 2 | 3 | 4;

export const PHASE_NAMES: Record<KarmaResetPhase, string> = {
  1: 'acknowledgment',
  2: 'understanding',
  3: 'release',
  4: 'renewal',
};

interface WisdomVerse {
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
  application: string;
}

interface KarmaResetState {
  /** Unique session identifier */
  sessionId: string | null;
  /** Current ritual phase (1-4) */
  currentPhase: KarmaResetPhase;
  /** The karmic pattern being processed */
  selectedPattern: string | null;
  /** Description of the selected pattern */
  patternDescription: string | null;
  /** Gita wisdom verses relevant to the pattern */
  wisdomVerses: WisdomVerse[];
  /** User's renewal intention */
  intention: string | null;
  /** Whether the breathing exercise in the release phase is done */
  breathingCompleted: boolean;
  /** Whether a session is currently in progress */
  isActive: boolean;
  /** ISO timestamp when the session was completed */
  completedAt: string | null;
}

interface KarmaResetActions {
  /** Begin a new karma reset session */
  startSession: (sessionId: string) => void;
  /** Set the karmic pattern and optional description */
  setPattern: (pattern: string, description?: string) => void;
  /** Advance to the next phase (max 4) */
  nextPhase: () => void;
  /** Go back to the previous phase (min 1) */
  prevPhase: () => void;
  /** Set the wisdom verses for the understanding phase */
  setWisdomVerses: (verses: WisdomVerse[]) => void;
  /** Set the user's renewal intention */
  setIntention: (intention: string) => void;
  /** Mark the breathing exercise as complete */
  markBreathingComplete: () => void;
  /** Mark the session as complete */
  completeSession: () => void;
  /** Reset all state back to initial values */
  resetSession: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: KarmaResetState = {
  sessionId: null,
  currentPhase: 1,
  selectedPattern: null,
  patternDescription: null,
  wisdomVerses: [],
  intention: null,
  breathingCompleted: false,
  isActive: false,
  completedAt: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useKarmaResetStore = create<KarmaResetState & KarmaResetActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      startSession: (sessionId: string) => {
        set((state) => {
          Object.assign(state, { ...initialState });
          state.sessionId = sessionId;
          state.currentPhase = 1;
          state.isActive = true;
        });
      },

      setPattern: (pattern: string, description?: string) => {
        set((state) => {
          state.selectedPattern = pattern;
          state.patternDescription = description ?? null;
        });
      },

      nextPhase: () => {
        set((state) => {
          if (state.currentPhase < 4) {
            state.currentPhase = (state.currentPhase + 1) as KarmaResetPhase;
          }
        });
      },

      prevPhase: () => {
        set((state) => {
          if (state.currentPhase > 1) {
            state.currentPhase = (state.currentPhase - 1) as KarmaResetPhase;
          }
        });
      },

      setWisdomVerses: (verses: WisdomVerse[]) => {
        set((state) => {
          state.wisdomVerses = verses;
        });
      },

      setIntention: (intention: string) => {
        set((state) => {
          state.intention = intention;
        });
      },

      markBreathingComplete: () => {
        set((state) => {
          state.breathingCompleted = true;
        });
      },

      completeSession: () => {
        set((state) => {
          state.isActive = false;
          state.completedAt = new Date().toISOString();
        });
      },

      resetSession: () => {
        set(() => ({ ...initialState }));
      },
    })),
    {
      name: 'KarmaResetStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
