/**
 * Gita Store — Unit Test Stubs
 *
 * Tests for bookmarks, verse-of-the-day, reading progress,
 * and recently viewed verses.
 */

import { useGitaStore, type VerseRef } from '../gitaStore';

function resetStore() {
  useGitaStore.setState({
    bookmarkedVerseIds: [],
    vodChapter: null,
    vodVerse: null,
    vodDate: null,
    recentlyViewed: [],
    readingProgress: {},
  });
}

describe('useGitaStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should initialize with empty bookmarks and no verse-of-the-day', () => {
      const state = useGitaStore.getState();
      expect(state.bookmarkedVerseIds).toEqual([]);
      expect(state.vodChapter).toBeNull();
      expect(state.vodVerse).toBeNull();
      expect(state.vodDate).toBeNull();
      expect(state.recentlyViewed).toEqual([]);
      expect(state.readingProgress).toEqual({});
    });
  });

  describe('toggleBookmark', () => {
    it('should add a bookmark', () => {
      useGitaStore.getState().toggleBookmark('2.47');
      expect(useGitaStore.getState().bookmarkedVerseIds).toContain('2.47');
    });

    it('should remove an existing bookmark', () => {
      useGitaStore.getState().toggleBookmark('2.47');
      useGitaStore.getState().toggleBookmark('2.47');
      expect(useGitaStore.getState().bookmarkedVerseIds).not.toContain('2.47');
    });

    it('should handle multiple bookmarks', () => {
      useGitaStore.getState().toggleBookmark('2.47');
      useGitaStore.getState().toggleBookmark('18.66');
      useGitaStore.getState().toggleBookmark('6.35');

      const state = useGitaStore.getState();
      expect(state.bookmarkedVerseIds).toHaveLength(3);
      expect(state.bookmarkedVerseIds).toContain('2.47');
      expect(state.bookmarkedVerseIds).toContain('18.66');
      expect(state.bookmarkedVerseIds).toContain('6.35');
    });
  });

  describe('clearBookmarks', () => {
    it('should clear all bookmarks', () => {
      useGitaStore.getState().toggleBookmark('2.47');
      useGitaStore.getState().toggleBookmark('18.66');
      useGitaStore.getState().clearBookmarks();

      expect(useGitaStore.getState().bookmarkedVerseIds).toEqual([]);
    });
  });

  describe('refreshVerseOfTheDay', () => {
    it('should set verse-of-the-day on first call', () => {
      useGitaStore.getState().refreshVerseOfTheDay();

      const state = useGitaStore.getState();
      expect(state.vodChapter).toBeGreaterThanOrEqual(1);
      expect(state.vodChapter).toBeLessThanOrEqual(18);
      expect(state.vodVerse).toBeGreaterThanOrEqual(1);
      expect(state.vodDate).toBe(new Date().toISOString().slice(0, 10));
    });

    it('should not change verse if already set today', () => {
      useGitaStore.getState().refreshVerseOfTheDay();
      const first = useGitaStore.getState().vodChapter;

      useGitaStore.getState().refreshVerseOfTheDay();
      expect(useGitaStore.getState().vodChapter).toBe(first);
    });
  });

  describe('addRecentlyViewed', () => {
    it('should add a verse to recently viewed', () => {
      const ref: VerseRef = { chapter: 2, verse: 47 };
      useGitaStore.getState().addRecentlyViewed(ref);

      expect(useGitaStore.getState().recentlyViewed).toHaveLength(1);
      expect(useGitaStore.getState().recentlyViewed[0]).toEqual(ref);
    });

    it('should deduplicate and move to front', () => {
      useGitaStore.getState().addRecentlyViewed({ chapter: 2, verse: 47 });
      useGitaStore.getState().addRecentlyViewed({ chapter: 18, verse: 66 });
      useGitaStore.getState().addRecentlyViewed({ chapter: 2, verse: 47 });

      const state = useGitaStore.getState();
      expect(state.recentlyViewed).toHaveLength(2);
      expect(state.recentlyViewed[0]).toEqual({ chapter: 2, verse: 47 });
    });

    it('should cap at 20 entries', () => {
      for (let i = 1; i <= 25; i++) {
        useGitaStore.getState().addRecentlyViewed({ chapter: 1, verse: i });
      }

      expect(useGitaStore.getState().recentlyViewed).toHaveLength(20);
    });
  });

  describe('readingProgress', () => {
    it('should update reading progress for a chapter', () => {
      useGitaStore.getState().updateReadingProgress('2', 47);
      expect(useGitaStore.getState().readingProgress['2']).toBe(47);
    });

    it('should overwrite previous progress', () => {
      useGitaStore.getState().updateReadingProgress('2', 10);
      useGitaStore.getState().updateReadingProgress('2', 47);
      expect(useGitaStore.getState().readingProgress['2']).toBe(47);
    });

    it('should clear all reading progress', () => {
      useGitaStore.getState().updateReadingProgress('2', 47);
      useGitaStore.getState().updateReadingProgress('18', 66);
      useGitaStore.getState().clearReadingProgress();

      expect(useGitaStore.getState().readingProgress).toEqual({});
    });
  });

  describe('clearRecentlyViewed', () => {
    it('should clear all recently viewed', () => {
      useGitaStore.getState().addRecentlyViewed({ chapter: 2, verse: 47 });
      useGitaStore.getState().clearRecentlyViewed();

      expect(useGitaStore.getState().recentlyViewed).toEqual([]);
    });
  });
});
