/**
 * Gita Tab — Bhagavad Gita Home
 *
 * Features:
 * - Verse of the Day (golden card, animated, cached 24h)
 * - Chapter list (animated cards with chapter #, name, verse count)
 * - Search bar (debounced 300ms, min 3 chars)
 * - Loading, error, and empty states
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Search, BookOpen, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Input,
  GoldenHeader,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import {
  useGitaChapters,
  useGitaSearchFull,
  useGitaVerseDetail,
  type GitaChapter,
  type GitaSearchResult,
} from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 3;

// ---------------------------------------------------------------------------
// Verse of the Day Section
// ---------------------------------------------------------------------------

function VerseOfTheDay(): React.JSX.Element | null {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  // Refresh verse-of-the-day in useEffect (not during render) to avoid set() side effects
  const refreshVerseOfTheDay = useGitaStore((s) => s.refreshVerseOfTheDay);
  useEffect(() => { refreshVerseOfTheDay(); }, [refreshVerseOfTheDay]);

  // Read the cached verse-of-the-day from state (pure selector, no side effects)
  const vodChapter = useGitaStore((s) => s.vodChapter);
  const vodVerse = useGitaStore((s) => s.vodVerse);

  // Fallback to chapter 2, verse 47 (iconic verse) before first refresh
  const chapter = vodChapter ?? 2;
  const verse = vodVerse ?? 47;

  const { data, isLoading } = useGitaVerseDetail(chapter, verse);

  if (isLoading) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.vodContainer}>
        <View style={[styles.vodCard, { backgroundColor: c.card, borderColor: colors.alpha.goldMedium }]}>
          <View style={styles.vodLoadingRow}>
            <Sparkles size={16} color={colors.primary[300]} />
            <Text variant="caption" color={colors.primary[300]}>
              Verse of the Day
            </Text>
          </View>
          <View style={styles.vodLoadingCenter}>
            <LoadingMandala size={48} />
          </View>
        </View>
      </Animated.View>
    );
  }

  if (!data?.verse) return null;

  const v = data.verse;

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.vodContainer}>
      <Pressable
        onPress={() => router.push(`/(tabs)/verse/${v.chapter}/${v.verse}`)}
        accessibilityRole="button"
        accessibilityLabel={`Verse of the day: Chapter ${v.chapter}, Verse ${v.verse}`}
      >
        <View style={[styles.vodCard, { backgroundColor: c.card, borderColor: colors.primary[500] }]}>
          {/* Golden top accent */}
          <View style={[styles.vodTopBar, { backgroundColor: colors.primary[500] }]} />

          <View style={styles.vodLabelRow}>
            <Sparkles size={14} color={colors.primary[300]} />
            <Text variant="caption" color={colors.primary[300]}>
              Verse of the Day
            </Text>
          </View>

          {/* Sanskrit text */}
          <Text
            style={[styles.vodSanskrit, { color: colors.primary[300] }]}
            numberOfLines={2}
          >
            {v.sanskrit}
          </Text>

          {/* Translation preview */}
          <Text variant="body" color={c.textPrimary} numberOfLines={3}>
            {v.english}
          </Text>

          {/* Reference */}
          <Text variant="caption" color={c.textTertiary} style={styles.vodRef}>
            — Bhagavad Gita {v.chapter}.{v.verse}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Chapter Card
// ---------------------------------------------------------------------------

function ChapterCard({
  item,
  index,
  onPress,
}: {
  item: GitaChapter;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400).springify()}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <View style={[styles.chapterCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.chapterRow}>
            {/* Chapter number circle */}
            <View style={[styles.chapterCircle, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="label" color={colors.primary[300]}>
                {item.id}
              </Text>
            </View>

            {/* Chapter info */}
            <View style={styles.chapterInfo}>
              <Text variant="label" color={c.textPrimary} numberOfLines={1}>
                {item.title}
              </Text>
              {item.titleSanskrit ? (
                <Text variant="caption" color={c.textSecondary} numberOfLines={1}>
                  {item.titleSanskrit}
                </Text>
              ) : null}
              <Text variant="caption" color={c.textTertiary}>
                {item.versesCount} verses
              </Text>
            </View>

            {/* Arrow indicator */}
            <BookOpen size={18} color={c.textTertiary} />
          </View>

          {item.summary ? (
            <Text variant="bodySmall" color={c.textSecondary} numberOfLines={2} style={styles.chapterSummary}>
              {item.summary}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Search Result Card
// ---------------------------------------------------------------------------

function SearchResultCard({
  item,
  index,
  onPress,
}: {
  item: GitaSearchResult;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const v = item.verse;

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(300)}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <View style={[styles.searchCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text variant="caption" color={colors.primary[300]}>
            Chapter {v.chapter} · Verse {v.verse}
          </Text>
          <Text
            style={[styles.searchSanskrit, { color: colors.primary[100] }]}
            numberOfLines={1}
          >
            {v.sanskrit}
          </Text>
          <Text variant="bodySmall" color={c.textPrimary} numberOfLines={2}>
            {v.english}
          </Text>
          {v.theme ? (
            <View style={[styles.themeBadge, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="caption" color={colors.primary[300]}>
                {v.theme.replace(/_/g, ' ')}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function GitaScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  // Search state with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedKeyword(text.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const isSearchActive = debouncedKeyword.length >= SEARCH_MIN_CHARS;

  // Data hooks
  const { data: chapters, isLoading: chaptersLoading, error: chaptersError } = useGitaChapters();
  const { data: searchData, isLoading: searchLoading } = useGitaSearchFull(debouncedKeyword);

  // Handlers
  const navigateToChapter = useCallback(
    (chapterId: number) => {
      router.push(`/gita/chapter/${chapterId}`);
    },
    [router],
  );

  const navigateToVerse = useCallback(
    (chapter: number, verse: number) => {
      router.push(`/(tabs)/verse/${chapter}/${verse}`);
    },
    [router],
  );

  // Search hint
  const searchHint = useMemo(() => {
    if (searchInput.length === 0) return null;
    if (searchInput.length < SEARCH_MIN_CHARS) {
      return `Type ${SEARCH_MIN_CHARS - searchInput.length} more character${SEARCH_MIN_CHARS - searchInput.length > 1 ? 's' : ''} to search`;
    }
    return null;
  }, [searchInput.length]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Screen>
      <GoldenHeader title="Bhagavad Gita" testID="gita-header" />

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search verses, topics, or keywords..."
          value={searchInput}
          onChangeText={handleSearchChange}
        />
        {searchHint ? (
          <Text variant="caption" color={c.textTertiary} style={styles.searchHint}>
            {searchHint}
          </Text>
        ) : null}
      </View>

      {/* Search results mode */}
      {isSearchActive ? (
        <View style={styles.listContainer}>
          {searchLoading ? (
            <View style={styles.centerState}>
              <LoadingMandala size={64} />
              <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
                Searching sacred verses...
              </Text>
            </View>
          ) : searchData && searchData.results.length > 0 ? (
            <FlatList
              data={searchData.results}
              renderItem={({ item, index }) => (
                <SearchResultCard
                  item={item}
                  index={index}
                  onPress={() => navigateToVerse(item.verse.chapter, item.verse.verse)}
                />
              )}
              keyExtractor={(item) => item.verse.verse_id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text variant="caption" color={c.textTertiary} style={styles.resultCount}>
                  {searchData.total_results} verse{searchData.total_results !== 1 ? 's' : ''} found
                </Text>
              }
            />
          ) : (
            <View style={styles.centerState}>
              <Search size={40} color={c.textTertiary} />
              <Text variant="body" color={c.textSecondary} style={styles.stateText}>
                No verses found for &ldquo;{debouncedKeyword}&rdquo;
              </Text>
              <Text variant="bodySmall" color={c.textTertiary}>
                Try different keywords or browse chapters below
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Chapter list mode */
        <FlatList
          data={chapters ?? []}
          renderItem={({ item, index }) => (
            <ChapterCard
              item={item}
              index={index}
              onPress={() => navigateToChapter(item.id)}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<VerseOfTheDay />}
          ListEmptyComponent={
            chaptersLoading ? (
              <View style={styles.centerState}>
                <LoadingMandala size={80} />
                <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
                  Loading chapters...
                </Text>
              </View>
            ) : chaptersError ? (
              <View style={styles.centerState}>
                <Text variant="body" color={colors.semantic.error}>
                  Unable to load chapters
                </Text>
                <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
                  Please check your connection and try again
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchHint: {
    marginTop: spacing.xxs,
    marginLeft: spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  centerState: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    marginTop: spacing.xs,
  },
  resultCount: {
    marginBottom: spacing.xs,
  },

  // Verse of the Day
  vodContainer: {
    marginBottom: spacing.lg,
  },
  vodCard: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  vodTopBar: {
    height: 3,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  vodLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  vodSanskrit: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  vodRef: {
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  vodLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.md,
  },
  vodLoadingCenter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // Chapter Card
  chapterCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chapterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterSummary: {
    marginTop: spacing.sm,
    marginLeft: 44 + spacing.md,
  },

  // Search Result Card
  searchCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  searchSanskrit: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginTop: spacing.xxs,
  },
});
