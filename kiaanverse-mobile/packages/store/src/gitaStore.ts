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

/**
 * Curated list of verses that ship with real Sanskrit + English in the
 * backend Gita corpus (data/gita/chapters/*.json). Most verses in the seed
 * corpus are placeholders — `"english": "Bhagavad Gita Chapter X, Verse Y
 * teaches wisdom on <theme>."` — so a naive random pick across all 700
 * verses lands on a placeholder ~96 % of the time and the home screen
 * shows "teaches wisdom on devotion" instead of a real shloka.
 *
 * Every entry below was verified against the corpus at the time this list
 * was added. When the backend ships real translations for the remaining
 * verses, expand this list (or delete it and pick across all verses).
 */
const CURATED_VOD_VERSES: ReadonlyArray<VerseRef> = [
  { chapter: 1, verse: 1 },
  { chapter: 1, verse: 47 },
  { chapter: 2, verse: 14 },
  { chapter: 2, verse: 47 },
  { chapter: 2, verse: 48 },
  { chapter: 2, verse: 56 },
  { chapter: 2, verse: 62 },
  { chapter: 2, verse: 63 },
  { chapter: 2, verse: 70 },
  { chapter: 3, verse: 19 },
  { chapter: 3, verse: 35 },
  { chapter: 4, verse: 38 },
  { chapter: 5, verse: 21 },
  { chapter: 6, verse: 5 },
  { chapter: 6, verse: 17 },
  { chapter: 6, verse: 35 },
  { chapter: 12, verse: 13 },
  { chapter: 12, verse: 14 },
  { chapter: 16, verse: 1 },
  { chapter: 16, verse: 2 },
  { chapter: 16, verse: 3 },
  { chapter: 18, verse: 45 },
  { chapter: 18, verse: 46 },
  { chapter: 18, verse: 48 },
  { chapter: 18, verse: 66 },
];

/**
 * O(1) membership check against the curated list. Used to detect stale
 * persisted VOD refs saved before the curated list shipped.
 */
const CURATED_VOD_KEYS = new Set(
  CURATED_VOD_VERSES.map((v) => `${v.chapter}.${v.verse}`),
);

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

/**
 * Pick today's verse deterministically from the curated list of verses with
 * real content. Uses the same date-hash pattern as before so a given calendar
 * day always resolves to the same verse for all users, but selects only from
 * CURATED_VOD_VERSES so the home screen never lands on a "teaches wisdom on
 * devotion" placeholder.
 */
function pickDailyVerse(): VerseRef {
  const today = todayString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  const picked = CURATED_VOD_VERSES[hash % CURATED_VOD_VERSES.length];
  // TypeScript can't prove the modulo index is in-bounds for a readonly
  // tuple, but CURATED_VOD_VERSES is guaranteed non-empty by construction.
  return picked ?? { chapter: 2, verse: 47 };
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
          const { vodDate, vodChapter, vodVerse } = get();
          const today = todayString();

          // Re-pick when either (a) the stored ref is stale (yesterday's
          // verse) or (b) the persisted ref was chosen before the curated
          // list shipped and points at a placeholder verse. Without the
          // second check, existing users would be stuck on a "teaches
          // wisdom on devotion" card until midnight.
          const persistedKey =
            vodChapter != null && vodVerse != null
              ? `${vodChapter}.${vodVerse}`
              : null;
          const isFreshAndCurated =
            vodDate === today &&
            persistedKey !== null &&
            CURATED_VOD_KEYS.has(persistedKey);
          if (isFreshAndCurated) return;

          const { chapter, verse } = pickDailyVerse();
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
