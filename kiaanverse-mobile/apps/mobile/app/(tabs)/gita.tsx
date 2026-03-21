/**
 * Gita Tab
 *
 * Browse Bhagavad Gita chapters and search verses.
 */

import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Search } from 'lucide-react-native';
import { Screen, Text, Card, Input, Divider, colors, spacing, radii } from '@kiaanverse/ui';
import { useGitaChapters, useGitaSearch, type GitaChapter, type GitaVerse } from '@kiaanverse/api';
import { useTheme } from '@kiaanverse/ui';

export default function GitaScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const { data: chapters, isLoading: chaptersLoading } = useGitaChapters();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults } = useGitaSearch(searchQuery);

  const isSearching = searchQuery.length >= 2;

  const renderChapter = ({ item }: { item: GitaChapter }) => (
    <Card style={styles.chapterCard}>
      <View style={styles.chapterHeader}>
        <View style={styles.chapterNumber}>
          <Text variant="label" color={colors.primary[300]}>
            {item.id}
          </Text>
        </View>
        <View style={styles.chapterInfo}>
          <Text variant="label">{item.title}</Text>
          {item.titleSanskrit ? (
            <Text variant="sacredSmall" color={colors.text.muted}>
              {item.titleSanskrit}
            </Text>
          ) : null}
          <Text variant="caption" color={colors.text.muted}>
            {item.versesCount} verses
          </Text>
        </View>
      </View>
      {item.summary ? (
        <Text variant="bodySmall" color={colors.text.muted} numberOfLines={2}>
          {item.summary}
        </Text>
      ) : null}
    </Card>
  );

  const renderVerse = ({ item }: { item: GitaVerse }) => (
    <Card style={styles.verseCard}>
      <Text variant="caption" color={colors.primary[300]}>
        Chapter {item.chapter}, Verse {item.verse}
      </Text>
      <Text variant="sacred" color={colors.primary[100]}>
        {item.sanskrit}
      </Text>
      <Text variant="bodySmall" color={colors.text.muted}>
        {item.transliteration}
      </Text>
      <Divider />
      <Text variant="body">{item.translation}</Text>
    </Card>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h2">Bhagavad Gita</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search verses, topics, or keywords..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isSearching ? (
        <FlatList
          data={searchResults ?? []}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text variant="body" color={colors.text.muted} align="center">
              No verses found
            </Text>
          }
        />
      ) : (
        <FlatList
          data={chapters ?? []}
          renderItem={renderChapter}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            chaptersLoading ? (
              <Text variant="body" color={colors.text.muted} align="center">
                Loading chapters...
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  chapterCard: {
    gap: spacing.sm,
  },
  chapterHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  verseCard: {
    gap: spacing.sm,
  },
});
