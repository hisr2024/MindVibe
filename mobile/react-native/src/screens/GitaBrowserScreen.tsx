/**
 * Gita Browser Screen
 *
 * Browse all 18 chapters and 700 verses of the Bhagavad Gita.
 * Features:
 * - Chapter list with verse counts
 * - Expandable chapter → verse list
 * - Verse detail with Sanskrit, transliteration, translation
 * - Search across verses
 * - Play verse audio via Vibe Player
 * - Offline access via WatermelonDB cache
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { api } from '@services/apiClient';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Chapter {
  id: number;
  chapter_number?: number;
  name: string;
  name_sanskrit?: string;
  verse_count?: number;
  summary?: string;
}

interface Verse {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  translation: string;
  commentary?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GitaBrowserScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // Fetch chapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: ['gita-chapters'],
    queryFn: async () => {
      const { data } = await api.gita.chapters();
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  // Fetch verses for expanded chapter
  const { data: versesData, isLoading: versesLoading } = useQuery({
    queryKey: ['gita-chapter', expandedChapter],
    queryFn: async () => {
      if (expandedChapter === null) return null;
      const { data } = await api.gita.chapter(expandedChapter);
      return data;
    },
    enabled: expandedChapter !== null,
  });

  // Search
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['gita-search', searchQuery],
    queryFn: async () => {
      const { data } = await api.gita.search(searchQuery);
      return data;
    },
    enabled: searchQuery.length >= 3,
  });

  const chapters: Chapter[] = useMemo(() => {
    if (!chaptersData) return [];
    return Array.isArray(chaptersData) ? chaptersData : chaptersData.chapters ?? [];
  }, [chaptersData]);

  const verses: Verse[] = useMemo(() => {
    if (!versesData) return [];
    return versesData.verses ?? [];
  }, [versesData]);

  const handleChapterPress = useCallback((chapterNum: number) => {
    setExpandedChapter((prev) => (prev === chapterNum ? null : chapterNum));
    setSearchQuery('');
  }, []);

  const renderChapter = ({ item }: { item: Chapter }) => {
    const chapterNum = item.chapter_number ?? item.id;
    const isExpanded = expandedChapter === chapterNum;

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.chapterCard,
            {
              backgroundColor: isExpanded ? theme.surfaceElevated : theme.card,
              borderColor: isExpanded ? theme.accent + '33' : theme.cardBorder,
            },
          ]}
          onPress={() => handleChapterPress(chapterNum)}
          accessibilityRole="button"
          accessibilityLabel={`Chapter ${chapterNum}: ${item.name}`}
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={[styles.chapterNumber, { backgroundColor: colors.alpha.goldLight }]}>
            <Text style={[styles.chapterNumText, { color: theme.accent }]}>
              {chapterNum}
            </Text>
          </View>
          <View style={styles.chapterMeta}>
            <Text style={[styles.chapterName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.name_sanskrit && (
              <Text style={[styles.chapterSanskrit, { color: theme.textTertiary }]} numberOfLines={1}>
                {item.name_sanskrit}
              </Text>
            )}
          </View>
          <Text style={[styles.verseCount, { color: theme.textTertiary }]}>
            {item.verse_count ?? '—'} verses
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Expanded verse list */}
        {isExpanded && (
          <View style={styles.verseList}>
            {versesLoading ? (
              <ActivityIndicator style={styles.versesLoader} color={theme.accent} />
            ) : (
              verses.map((verse) => (
                <TouchableOpacity
                  key={`${verse.chapter}-${verse.verse}`}
                  style={[styles.verseRow, { borderColor: theme.divider }]}
                  onPress={() => setSelectedVerse(verse)}
                  accessibilityRole="button"
                  accessibilityLabel={`Verse ${verse.chapter}.${verse.verse}`}
                >
                  <Text style={[styles.verseNum, { color: theme.accent }]}>
                    {verse.chapter}.{verse.verse}
                  </Text>
                  <Text
                    style={[styles.versePreview, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {verse.translation}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Search */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.lg, backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Bhagavad Gita
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.textPrimary,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search verses..."
          placeholderTextColor={theme.textTertiary}
          autoCorrect={false}
          accessibilityLabel="Search Gita verses"
        />
      </View>

      {/* Search Results */}
      {searchQuery.length >= 3 ? (
        <FlatList
          data={searchResults?.results ?? searchResults ?? []}
          keyExtractor={(item: Verse, i) => `search-${item.chapter}-${item.verse}-${i}`}
          renderItem={({ item }: { item: Verse }) => (
            <TouchableOpacity
              style={[styles.searchResultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setSelectedVerse(item)}
            >
              <Text style={[styles.verseNum, { color: theme.accent }]}>
                {item.chapter}.{item.verse}
              </Text>
              <Text style={[styles.searchResultText, { color: theme.textPrimary }]} numberOfLines={2}>
                {item.translation}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.bottomInset }}
          ListEmptyComponent={
            searchLoading ? (
              <ActivityIndicator style={{ marginTop: spacing['4xl'] }} color={theme.accent} />
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No verses found for "{searchQuery}"
              </Text>
            )
          }
        />
      ) : (
        /* Chapter List */
        <FlatList
          data={chapters}
          keyExtractor={(item) => String(item.chapter_number ?? item.id)}
          renderItem={renderChapter}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.bottomInset,
          }}
          ListEmptyComponent={
            chaptersLoading ? (
              <ActivityIndicator style={{ marginTop: spacing['4xl'] }} color={theme.accent} />
            ) : null
          }
        />
      )}

      {/* Verse Detail Modal */}
      <Modal
        visible={selectedVerse !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedVerse(null)}
      >
        {selectedVerse && (
          <ScrollView
            style={[styles.modalContainer, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing['3xl'] }}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedVerse(null)}
              accessibilityRole="button"
              accessibilityLabel="Close verse detail"
            >
              <Text style={{ color: theme.accent, fontSize: 18 }}>✕ Close</Text>
            </TouchableOpacity>

            <Text style={[styles.verseRef, { color: theme.accent }]}>
              Chapter {selectedVerse.chapter}, Verse {selectedVerse.verse}
            </Text>

            {/* Sanskrit */}
            <View style={[styles.sanskritBox, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.sanskritText, { color: theme.accent }]}>
                {selectedVerse.sanskrit}
              </Text>
            </View>

            {/* Transliteration */}
            {selectedVerse.transliteration && (
              <Text style={[styles.transliteration, { color: theme.textTertiary }]}>
                {selectedVerse.transliteration}
              </Text>
            )}

            {/* Translation */}
            <Text style={[styles.translationLabel, { color: theme.textPrimary }]}>
              Translation
            </Text>
            <Text style={[styles.translationText, { color: theme.textSecondary }]}>
              {selectedVerse.translation}
            </Text>

            {/* Commentary */}
            {selectedVerse.commentary && (
              <>
                <Text style={[styles.translationLabel, { color: theme.textPrimary }]}>
                  Commentary
                </Text>
                <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                  {selectedVerse.commentary}
                </Text>
              </>
            )}
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  searchInput: {
    ...typography.body,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  // Chapter card
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: {
    ...typography.label,
    fontWeight: '700',
  },
  chapterMeta: {
    flex: 1,
  },
  chapterName: {
    ...typography.label,
    fontSize: 15,
  },
  chapterSanskrit: {
    ...typography.caption,
    fontSize: 12,
  },
  verseCount: {
    ...typography.caption,
  },
  // Verse list (expanded)
  verseList: {
    paddingLeft: spacing['3xl'],
    marginBottom: spacing.md,
  },
  versesLoader: {
    paddingVertical: spacing.lg,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  verseNum: {
    ...typography.label,
    fontWeight: '700',
    width: 48,
  },
  versePreview: {
    ...typography.bodySmall,
    flex: 1,
  },
  // Search results
  searchResultCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchResultText: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing['4xl'],
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  verseRef: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  sanskritBox: {
    borderRadius: radii.md,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  sanskritText: {
    ...typography.sacred,
    textAlign: 'center',
    lineHeight: 36,
  },
  transliteration: {
    ...typography.body,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  translationLabel: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  translationText: {
    ...typography.body,
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
});
