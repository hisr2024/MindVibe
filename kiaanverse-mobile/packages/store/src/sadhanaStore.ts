/**
 * Sadhana (Daily Practice) Store
 *
 * Manages the daily sacred practice flow phases.
 * Mirrors the pattern from stores/sadhanaStore.ts in the web app.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

export type SadhanaPhase =
  | 'greeting'
  | 'mood_check'
  | 'verse_contemplation'
  | 'reflection'
  | 'intention'
  | 'complete';

interface SadhanaState {
  phase: SadhanaPhase;
  moodScore: number | null;
  verseId: string | null;
  reflection: string;
  intention: string;
}

interface SadhanaActions {
  nextPhase: () => void;
  setMoodScore: (score: number) => void;
  setVerseId: (verseId: string) => void;
  setReflection: (text: string) => void;
  setIntention: (text: string) => void;
  reset: () => void;
}

const phaseOrder: SadhanaPhase[] = [
  'greeting',
  'mood_check',
  'verse_contemplation',
  'reflection',
  'intention',
  'complete',
];

const initialState: SadhanaState = {
  phase: 'greeting',
  moodScore: null,
  verseId: null,
  reflection: '',
  intention: '',
};

export const useSadhanaStore = create<SadhanaState & SadhanaActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      nextPhase: () => {
        const currentIndex = phaseOrder.indexOf(get().phase);
        const nextIndex = Math.min(currentIndex + 1, phaseOrder.length - 1);
        set((state) => {
          state.phase = phaseOrder[nextIndex] as SadhanaPhase;
        });
      },

      setMoodScore: (score: number) => {
        set((state) => {
          state.moodScore = score;
        });
      },

      setVerseId: (verseId: string) => {
        set((state) => {
          state.verseId = verseId;
        });
      },

      setReflection: (text: string) => {
        set((state) => {
          state.reflection = text;
        });
      },

      setIntention: (text: string) => {
        set((state) => {
          state.intention = text;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },
    })),
    {
      name: 'SadhanaStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
