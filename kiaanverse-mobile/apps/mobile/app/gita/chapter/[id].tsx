/**
 * Chapter Detail Screen
 *
 * Displays chapter summary with sticky header and verse list.
 * Each verse card shows verse number, Sanskrit preview, and English preview.
 * Tapping a verse navigates to the full verse detail screen.
 */

import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  Text,
  GoldenHeader,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useGitaChapterDetail, type GitaVerseSummary } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Verse Preview Card
// ---------------------------------------------------------------------------

function VersePreviewCard({
  item,
  index,
  onPress,
}: {
  item: GitaVerseSummary;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Verse ${item.verse}`}
      >
        <View style={[styles.verseCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          {/* Verse number badge */}
          <View style={styles.verseRow}>
            <View style={[styles.verseBadge, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="label" color={colors.primary[300]}>
                {item.verse}
              </Text>
            </View>

            <View style={styles.verseContent}>
              {/* Sanskrit preview */}
              {item.sanskrit ? (
                <Text
                  style={[styles.sanskrit, { color: colors.primary[100] }]}
                  numberOfLines={1}
                >
                  {item.sanskrit}
                </Text>
              ) : null}

              {/* English preview */}
              <Text variant="bodySmall" color={c.textPrimary} numberOfLines={2}>
                {item.preview}
              </Text>

              {/* Theme tag */}
              {item.theme ? (
                <View style={[styles.themeBadge, { backgroundColor: colors.alpha.goldLight }]}>
                  <Text variant="caption" color={colors.primary[300]}>
                    {item.theme.replace(/_/g, ' ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Chapter Summary Header
// ---------------------------------------------------------------------------

function ChapterSummaryHeader({
  name,
  summary,
  verseCount,
  themes,
}: {
  name: string;
  summary: string;
  verseCount: number;
  themes: string[];
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.summaryContainer}>
      {/* Chapter name */}
      <Text variant="h2" color={c.textPrimary}>
        {name}
      </Text>

      {/* Verse count */}
      <Text variant="caption" color={colors.primary[300]} style={styles.verseCount}>
        {verseCount} verses
      </Text>

      {/* Summary */}
      <Text variant="body" color={c.textSecondary} style={styles.summaryText}>
        {summary}
      </Text>

      {/* Theme tags */}
      {themes.length > 0 ? (
        <View style={styles.themesRow}>
          {themes.slice(0, 5).map((t) => (
            <View
              key={t}
              style={[styles.themeChip, { backgroundColor: colors.alpha.goldLight }]}
            >
              <Text variant="caption" color={colors.primary[300]}>
                {t.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: c.cardBorder }]} />

      <Text variant="label" color={c.textSecondary} style={styles.versesLabel}>
        Verses
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ChapterDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const chapterId = Number(id);
  const { data, isLoading, error } = useGitaChapterDetail(chapterId);

  const navigateToVerse = useCallback(
    (chapter: number, verse: number) => {
      router.push(`/verse/${chapter}/${verse}`);
    },
    [router],
  );

  return (
    <Screen>
      <GoldenHeader
        title={`Chapter ${id}`}
        onBack={() => router.back()}
        testID="chapter-detail-header"
      />

      {isLoading ? (
        <View style={styles.centerState}>
          <LoadingMandala size={80} />
          <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
            Loading chapter...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text variant="body" color={colors.semantic.error}>
            Unable to load chapter
          </Text>
          <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
            Please check your connection and try again
          </Text>
        </View>
      ) : data ? (
        <FlatList
          data={data.verses}
          renderItem={({ item, index }) => (
            <VersePreviewCard
              item={item}
              index={index}
              onPress={() => navigateToVerse(item.chapter, item.verse)}
            />
          )}
          keyExtractor={(item) => item.verse_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <ChapterSummaryHeader
              name={data.name}
              summary={data.summary}
              verseCount={data.verse_count}
              themes={data.themes}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text variant="body" color={c.textSecondary}>
                No verses found for this chapter
              </Text>
            </View>
          }
        />
      ) : null}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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

  // Summary header
  summaryContainer: {
    paddingBottom: spacing.md,
  },
  verseCount: {
    marginTop: spacing.xxs,
  },
  summaryText: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  themeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  versesLabel: {
    marginBottom: spacing.xs,
  },

  // Verse card
  verseCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  verseRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  verseBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  sanskrit: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginTop: spacing.xxs,
  },
});
