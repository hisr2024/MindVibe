/**
 * Gita Store — Zustand state for bookmarks, verse-of-the-day, reading progress,
 * and recently viewed verses.
 *
 * Bookmarks and reading progress are local-only (AsyncStorage via zustand/persist).
 * Verse-of-the-day is selected client-side and cached for 24 hours.
 * Verse content is fetched via React Query hooks (useGitaVerse, useGitaChapter).
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

/** A reference to a specific Gita verse by chapter and verse number. */
export interface VerseRef {
  chapter: number;
  verse: number;
}

// Chapter verse counts (1-indexed) for random verse generation
const CHAPTER_VERSE_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

/** Maximum number of recently viewed verses to keep */
const MAX_RECENTLY_VIEWED = 20;

interface GitaState {
  /** Set of bookmarked verse IDs (e.g. "2.47") */
  bookmarkedVerseIds: string[];
  /** Cached verse-of-the-day chapter number */
  vodChapter: number | null;
  /** Cached verse-of-the-day verse number */
  vodVerse: number | null;
  /** Date string (YYYY-MM-DD) when verse-of-the-day was last set */
  vodDate: string | null;
  /** Recently viewed verses (newest first, max 20) */
  recentlyViewed: VerseRef[];
  /** Reading progress per chapter: chapterId → last verse read */
  readingProgress: Record<string, number>;
}

interface GitaActions {
  /** Toggle a verse bookmark on/off */
  toggleBookmark: (verseId: string) => void;
  /** Initialize verse-of-the-day if stale. Call from useEffect, not during render. */
  refreshVerseOfTheDay: () => void;
  /** Clear all bookmarks */
  clearBookmarks: () => void;
  /** Record a verse as recently viewed (dedupes, caps at 20) */
  addRecentlyViewed: (ref: VerseRef) => void;
  /** Update reading progress for a chapter */
  updateReadingProgress: (chapterId: string, lastVerse: number) => void;
  /** Clear all reading progress */
  clearReadingProgress: () => void;
  /** Clear recently viewed list */
  clearRecentlyViewed: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Pick a deterministic-ish random verse based on today's date. */
function pickRandomVerse(): { chapter: number; verse: number } {
  const today = todayString();
  // Simple hash from date string for deterministic daily selection
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  // Pick chapter (1-18)
  const chapter = (hash % 18) + 1;
  const maxVerse = CHAPTER_VERSE_COUNTS[chapter] ?? 20;
  const verse = (hash % maxVerse) + 1;

  return { chapter, verse };
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: GitaState = {
  bookmarkedVerseIds: [],
  vodChapter: null,
  vodVerse: null,
  vodDate: null,
  recentlyViewed: [],
  readingProgress: {},
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGitaStore = create<GitaState & GitaActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        toggleBookmark: (verseId: string) => {
          set((state) => {
            const index = state.bookmarkedVerseIds.indexOf(verseId);
            if (index !== -1) {
              state.bookmarkedVerseIds.splice(index, 1);
            } else {
              state.bookmarkedVerseIds.push(verseId);
            }
          });
        },

        refreshVerseOfTheDay: () => {
          const { vodDate } = get();
          const today = todayString();
          if (vodDate === today) return; // Already fresh

          const { chapter, verse } = pickRandomVerse();
          set((state) => {
            state.vodChapter = chapter;
            state.vodVerse = verse;
            state.vodDate = today;
          });
        },

        clearBookmarks: () => {
          set((state) => {
            state.bookmarkedVerseIds = [];
          });
        },

        addRecentlyViewed: (ref: VerseRef) => {
          set((state) => {
            // Remove existing entry for same verse (dedupe)
            state.recentlyViewed = state.recentlyViewed.filter(
              (v) => !(v.chapter === ref.chapter && v.verse === ref.verse),
            );
            // Prepend (newest first)
            state.recentlyViewed.unshift(ref);
            // Cap at max
            if (state.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
              state.recentlyViewed = state.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
            }
          });
        },

        updateReadingProgress: (chapterId: string, lastVerse: number) => {
          set((state) => {
            state.readingProgress[chapterId] = lastVerse;
          });
        },

        clearReadingProgress: () => {
          set((state) => {
            state.readingProgress = {};
          });
        },

        clearRecentlyViewed: () => {
          set((state) => {
            state.recentlyViewed = [];
          });
        },
      })),
      {
        name: 'kiaanverse-gita-store',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
    {
      name: 'GitaStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
