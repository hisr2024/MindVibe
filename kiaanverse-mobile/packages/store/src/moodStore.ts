/**
 * Mood Store — Zustand state for mood tracking UI.
 *
 * Tracks the current day's mood selection and daily log state.
 * Actual mood data persistence is handled by the backend via React Query.
 */

import { create } from 'zustand';
import type { SpiritualMood } from '@kiaanverse/api';

/** 8 spiritual mood states with metadata. */
export const MOOD_STATES: ReadonlyArray<{
  readonly id: SpiritualMood;
  readonly emoji: string;
  readonly sanskrit: string;
  readonly label: string;
  readonly score: number;
  readonly suggestedPractice: string;
  readonly linkedVerses: readonly string[];
}> = [
  {
    id: 'peaceful',
    emoji: '🕊️',
    sanskrit: 'Shānti',
    label: 'Peaceful',
    score: 2,
    suggestedPractice: 'Dhyana (Meditation) — Deepen your inner stillness',
    linkedVerses: ['6.7', '2.66'],
  },
  {
    id: 'joyful',
    emoji: '😊',
    sanskrit: 'Ānanda',
    label: 'Joyful',
    score: 2,
    suggestedPractice: 'Kīrtana (Devotional singing) — Share your joy',
    linkedVerses: ['5.21', '6.28'],
  },
  {
    id: 'grateful',
    emoji: '🙏',
    sanskrit: 'Kṛtajña',
    label: 'Grateful',
    score: 1,
    suggestedPractice: 'Sevā (Selfless service) — Express gratitude through action',
    linkedVerses: ['9.26', '17.20'],
  },
  {
    id: 'hopeful',
    emoji: '🌅',
    sanskrit: 'Āshā',
    label: 'Hopeful',
    score: 1,
    suggestedPractice: 'Sankalpa (Intention setting) — Channel hope into resolve',
    linkedVerses: ['4.39', '6.24'],
  },
  {
    id: 'confused',
    emoji: '🌀',
    sanskrit: 'Moha',
    label: 'Confused',
    score: -1,
    suggestedPractice: 'Svādhyāya (Self-study) — Read and reflect on wisdom',
    linkedVerses: ['2.7', '18.61'],
  },
  {
    id: 'anxious',
    emoji: '😰',
    sanskrit: 'Chintā',
    label: 'Anxious',
    score: -1,
    suggestedPractice: 'Prānāyāma (Breathwork) — Calm the restless mind',
    linkedVerses: ['6.35', '2.56'],
  },
  {
    id: 'sad',
    emoji: '🌧️',
    sanskrit: 'Dukha',
    label: 'Sad',
    score: -2,
    suggestedPractice: 'Bhakti (Devotion) — Surrender your sorrow to the divine',
    linkedVerses: ['2.14', '18.66'],
  },
  {
    id: 'angry',
    emoji: '🔥',
    sanskrit: 'Krodha',
    label: 'Angry',
    score: -2,
    suggestedPractice: 'Kṣamā (Forgiveness) — Transform anger into understanding',
    linkedVerses: ['2.63', '16.21'],
  },
] as const;

interface MoodStoreState {
  /** Today's selected mood (before submitting) */
  selectedMood: SpiritualMood | null;
  /** Optional note for today's entry */
  note: string;
  /** Whether mood was already logged today */
  loggedToday: boolean;
  /** Date string of last log (YYYY-MM-DD) */
  lastLogDate: string | null;
}

interface MoodStoreActions {
  selectMood: (mood: SpiritualMood) => void;
  setNote: (note: string) => void;
  markLogged: () => void;
  reset: () => void;
}

const initialState: MoodStoreState = {
  selectedMood: null,
  note: '',
  loggedToday: false,
  lastLogDate: null,
};

export const useMoodStore = create<MoodStoreState & MoodStoreActions>((set, _get) => ({
  ...initialState,

  selectMood: (mood) => set({ selectedMood: mood }),

  setNote: (note) => set({ note }),

  markLogged: () => {
    const today = new Date().toISOString().slice(0, 10);
    set({ loggedToday: true, lastLogDate: today, selectedMood: null, note: '' });
  },

  reset: () => set(initialState),
}));
