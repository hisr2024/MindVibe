/**
 * Wellness Store — Zustand state for mood, karma, and streak tracking.
 *
 * Manages:
 * - Today's mood selection (transient, before server submission)
 * - Offline cache of recent mood entries (source of truth: useMoodHistory hook)
 * - Last-known karma state for offline display (source of truth: useKarmaTree hook)
 * - Daily active streak tracking
 *
 * Data flow:
 * - Server data fetched via React Query hooks (useMoodHistory, useKarmaTree)
 * - This store caches last-known values for offline access
 * - Mood submission goes through useCreateMood mutation → then syncs here
 * - Karma awards go through useAwardKarma mutation → then syncs here
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SpiritualMood, MoodEntry, KarmaNodeData, KarmaTreeLevel } from '@kiaanverse/api';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WellnessState {
  /** Today's selected mood (before submitting to server) */
  todayMood: SpiritualMood | null;
  /** Offline cache of recent mood entries */
  moodHistory: MoodEntry[];
  /** Last-known total karma points (from useKarmaTree) */
  karmaPoints: number;
  /** Last-known karma tree level */
  karmaTreeLevel: KarmaTreeLevel;
  /** Last-known karma nodes for offline display */
  karmaNodes: KarmaNodeData[];
  /** Number of consecutive active days */
  streak: number;
  /** Date of last activity (YYYY-MM-DD) */
  lastActiveDate: string | null;
}

interface WellnessActions {
  /** Set today's mood selection (before submission) */
  setTodayMood: (mood: SpiritualMood | null) => void;
  /** Add a single mood entry to the local cache (prepend, newest first) */
  addMoodEntry: (entry: MoodEntry) => void;
  /** Bulk replace mood history from server response */
  setMoodHistory: (entries: MoodEntry[]) => void;
  /** Update last-known karma points */
  setKarmaPoints: (points: number) => void;
  /** Update last-known karma tree level */
  setKarmaTreeLevel: (level: KarmaTreeLevel) => void;
  /** Bulk replace karma nodes from server response */
  setKarmaNodes: (nodes: KarmaNodeData[]) => void;
  /** Add a single karma node */
  addKarmaNode: (node: KarmaNodeData) => void;
  /** Mark a karma node as completed */
  completeKarmaNode: (nodeId: string) => void;
  /** Check and update the daily streak (call on app launch / foreground) */
  updateStreak: () => void;
  /** Full reset (e.g. on logout) */
  resetWellness: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: WellnessState = {
  todayMood: null,
  moodHistory: [],
  karmaPoints: 0,
  karmaTreeLevel: 'seed',
  karmaNodes: [],
  streak: 0,
  lastActiveDate: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWellnessStore = create<WellnessState & WellnessActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setTodayMood: (mood: SpiritualMood | null) => {
          set((state) => {
            state.todayMood = mood;
          });
        },

        addMoodEntry: (entry: MoodEntry) => {
          set((state) => {
            state.moodHistory.unshift(entry);
            // Cap at 100 entries for local cache
            if (state.moodHistory.length > 100) {
              state.moodHistory = state.moodHistory.slice(0, 100);
            }
          });
        },

        setMoodHistory: (entries: MoodEntry[]) => {
          set((state) => {
            state.moodHistory = entries;
          });
        },

        setKarmaPoints: (points: number) => {
          set((state) => {
            state.karmaPoints = points;
          });
        },

        setKarmaTreeLevel: (level: KarmaTreeLevel) => {
          set((state) => {
            state.karmaTreeLevel = level;
          });
        },

        setKarmaNodes: (nodes: KarmaNodeData[]) => {
          set((state) => {
            state.karmaNodes = nodes;
          });
        },

        addKarmaNode: (node: KarmaNodeData) => {
          set((state) => {
            state.karmaNodes.push(node);
          });
        },

        completeKarmaNode: (nodeId: string) => {
          set((state) => {
            const node = state.karmaNodes.find((n) => n.id === nodeId);
            if (node) {
              node.completed = true;
              node.completedAt = new Date().toISOString();
            }
          });
        },

        updateStreak: () => {
          set((state) => {
            const today = todayString();

            // Already active today — no change needed
            if (state.lastActiveDate === today) return;

            if (state.lastActiveDate === yesterdayString()) {
              // Consecutive day — increment streak
              state.streak += 1;
            } else {
              // Streak broken — reset to 1 (today counts)
              state.streak = 1;
            }
            state.lastActiveDate = today;
          });
        },

        resetWellness: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'kiaanverse-wellness',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist offline caches and streak — NOT transient mood selection
        partialize: (state) => ({
          moodHistory: state.moodHistory,
          karmaPoints: state.karmaPoints,
          karmaTreeLevel: state.karmaTreeLevel,
          karmaNodes: state.karmaNodes,
          streak: state.streak,
          lastActiveDate: state.lastActiveDate,
        }),
      },
    ),
    {
      name: 'WellnessStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
