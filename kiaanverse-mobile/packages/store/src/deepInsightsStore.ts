/**
 * Deep Insights Store — manages analytics and emotional intelligence data.
 *
 * Handles:
 * - Mood trend data for charting
 * - Weekly insight summaries with Gita verse recommendations
 * - Guna balance (sattva/rajas/tamas) tracking
 * - Date range filtering for analytics views
 *
 * Persists: moodTrends, weeklyInsights, gunaBalance, lastFetched
 * for offline display. Transient: dateRange selection.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateRange = '7d' | '30d' | '90d';

interface MoodTrendPoint {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Mood score for the day */
  score: number;
}

interface WeeklyInsight {
  /** Human-readable summary of the week */
  summary: string;
  /** Dominant mood of the week */
  dominantMood: string;
  /** Personalized recommendation */
  recommendation: string;
  /** Bhagavad Gita verse reference (e.g. "2.47") */
  verseRef: string;
}

interface GunaBalance {
  /** Sattva (purity/goodness) percentage 0-100 */
  sattva: number;
  /** Rajas (passion/activity) percentage 0-100 */
  rajas: number;
  /** Tamas (inertia/darkness) percentage 0-100 */
  tamas: number;
}

interface DeepInsightsState {
  /** Mood trend data points for charting */
  moodTrends: MoodTrendPoint[];
  /** Latest weekly insight summary */
  weeklyInsights: WeeklyInsight | null;
  /** Current guna balance distribution */
  gunaBalance: GunaBalance | null;
  /** Active date range filter */
  dateRange: DateRange;
  /** ISO timestamp of last successful data fetch */
  lastFetched: string | null;
}

interface DeepInsightsActions {
  /** Replace mood trends data (e.g. after fetch) */
  setMoodTrends: (trends: MoodTrendPoint[]) => void;
  /** Set the weekly insight summary */
  setWeeklyInsights: (insights: WeeklyInsight | null) => void;
  /** Set the guna balance values */
  setGunaBalance: (balance: GunaBalance | null) => void;
  /** Change the active date range filter */
  setDateRange: (range: DateRange) => void;
  /** Clear all insights data (e.g. on logout) */
  clearInsights: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: DeepInsightsState = {
  moodTrends: [],
  weeklyInsights: null,
  gunaBalance: null,
  dateRange: '7d',
  lastFetched: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDeepInsightsStore = create<DeepInsightsState & DeepInsightsActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setMoodTrends: (trends: MoodTrendPoint[]) => {
          set((state) => {
            state.moodTrends = trends;
            state.lastFetched = new Date().toISOString();
          });
        },

        setWeeklyInsights: (insights: WeeklyInsight | null) => {
          set((state) => {
            state.weeklyInsights = insights;
            state.lastFetched = new Date().toISOString();
          });
        },

        setGunaBalance: (balance: GunaBalance | null) => {
          set((state) => {
            state.gunaBalance = balance;
            state.lastFetched = new Date().toISOString();
          });
        },

        setDateRange: (range: DateRange) => {
          set((state) => {
            state.dateRange = range;
          });
        },

        clearInsights: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'kiaanverse-deep-insights',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist analytics cache for offline display — NOT date range selection
        partialize: (state) => ({
          moodTrends: state.moodTrends,
          weeklyInsights: state.weeklyInsights,
          gunaBalance: state.gunaBalance,
          lastFetched: state.lastFetched,
        }),
      },
    ),
    {
      name: 'DeepInsightsStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
