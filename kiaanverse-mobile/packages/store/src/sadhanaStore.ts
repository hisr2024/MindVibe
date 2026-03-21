/**
 * Sadhana (Daily Practice) Store
 *
 * Manages the daily sacred practice flow phases.
 * Mirrors the pattern from stores/sadhanaStore.ts in the web app.
 */

import { create } from 'zustand';

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

export const useSadhanaStore = create<SadhanaState & SadhanaActions>((set, get) => ({
  ...initialState,

  nextPhase: () => {
    const currentIndex = phaseOrder.indexOf(get().phase);
    const nextIndex = Math.min(currentIndex + 1, phaseOrder.length - 1);
    set({ phase: phaseOrder[nextIndex] as SadhanaPhase });
  },

  setMoodScore: (score) => set({ moodScore: score }),
  setVerseId: (verseId) => set({ verseId }),
  setReflection: (text) => set({ reflection: text }),
  setIntention: (text) => set({ intention: text }),
  reset: () => set(initialState),
}));
