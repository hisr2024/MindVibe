/**
 * Gita Store — Zustand state for bookmarks and verse-of-the-day.
 *
 * Bookmarks are local-only (AsyncStorage via zustand/persist).
 * Verse-of-the-day is selected client-side and cached for 24 hours.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chapter verse counts (1-indexed) for random verse generation
const CHAPTER_VERSE_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

interface GitaState {
  /** Set of bookmarked verse IDs (e.g. "2.47") */
  bookmarkedVerseIds: string[];
  /** Cached verse-of-the-day chapter number */
  vodChapter: number | null;
  /** Cached verse-of-the-day verse number */
  vodVerse: number | null;
  /** Date string (YYYY-MM-DD) when verse-of-the-day was last set */
  vodDate: string | null;
}

interface GitaActions {
  /** Toggle a verse bookmark on/off */
  toggleBookmark: (verseId: string) => void;
  /** Check if a verse is bookmarked */
  isBookmarked: (verseId: string) => boolean;
  /** Get all bookmarked verse IDs */
  getBookmarks: () => string[];
  /** Get or generate verse-of-the-day. Returns { chapter, verse }. */
  getVerseOfTheDay: () => { chapter: number; verse: number };
  /** Clear all bookmarks */
  clearBookmarks: () => void;
}

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

export const useGitaStore = create<GitaState & GitaActions>()(
  persist(
    (set, get) => ({
      bookmarkedVerseIds: [],
      vodChapter: null,
      vodVerse: null,
      vodDate: null,

      toggleBookmark: (verseId: string) => {
        const current = get().bookmarkedVerseIds;
        const isCurrentlyBookmarked = current.includes(verseId);
        set({
          bookmarkedVerseIds: isCurrentlyBookmarked
            ? current.filter((id) => id !== verseId)
            : [...current, verseId],
        });
      },

      isBookmarked: (verseId: string) => {
        return get().bookmarkedVerseIds.includes(verseId);
      },

      getBookmarks: () => {
        return get().bookmarkedVerseIds;
      },

      getVerseOfTheDay: () => {
        const { vodChapter, vodVerse, vodDate } = get();
        const today = todayString();

        // Return cached if same day
        if (vodDate === today && vodChapter !== null && vodVerse !== null) {
          return { chapter: vodChapter, verse: vodVerse };
        }

        // Generate new verse-of-the-day
        const { chapter, verse } = pickRandomVerse();
        set({ vodChapter: chapter, vodVerse: verse, vodDate: today });
        return { chapter, verse };
      },

      clearBookmarks: () => set({ bookmarkedVerseIds: [] }),
    }),
    {
      name: 'kiaanverse-gita-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
