/**
 * Sacred Journal — Entry List Screen
 *
 * Displays all journal entries with search, tag filtering, and pull-to-refresh.
 * FAB navigates to the new entry composer. Empty state guides user to begin.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, Input, GoldenHeader, colors, spacing } from '@kiaanverse/ui';
import { useJournalEntries } from '@kiaanverse/api';
import type { JournalEntry } from '@kiaanverse/api';
import { JournalEntryCard } from '../../components/journal/JournalEntryCard';

const TAG_FILTERS = ['All', 'Gratitude', 'Reflection', 'Prayer', 'Dream', 'Insight'] as const;

export default function JournalListScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isLoading, refetch } = useJournalEntries();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  const entries = useMemo(() => data?.entries ?? [], [data]);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          (entry.title?.toLowerCase().includes(query)) ||
          (entry.content_preview?.toLowerCase().includes(query)) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (activeTag !== 'All') {
      result = result.filter((entry) =>
        entry.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase()),
      );
    }

    return result;
  }, [entries, searchQuery, activeTag]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEntryPress = useCallback(
    (entry: JournalEntry) => {
      router.push(`/journal/${entry.id}`);
    },
    [router],
  );

  const handleFabPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/journal/new');
  }, [router]);

  const handleTagPress = useCallback((tag: string) => {
    void Haptics.selectionAsync();
    setActiveTag(tag);
  }, []);

  const renderEntry = useCallback(
    ({ item }: { item: JournalEntry }) => (
      <JournalEntryCard entry={item} onPress={handleEntryPress} />
    ),
    [handleEntryPress],
  );

  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

  const renderEmpty = useCallback(
    () =>
      !isLoading ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
          <Text variant="h2" align="center" style={styles.lotusIcon}>
            {'🪷'}
          </Text>
          <Text variant="body" color={colors.text.muted} align="center">
            Your sacred reflections await.{'\n'}Begin your first entry.
          </Text>
        </Animated.View>
      ) : null,
    [isLoading],
  );

  return (
    <Screen>
      <GoldenHeader title="Sacred Reflections" />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search reflections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* Tag Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagRow}
        style={styles.tagScroll}
      >
        {TAG_FILTERS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => handleTagPress(tag)}
            style={[
              styles.tagChip,
              activeTag === tag && styles.tagChipActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTag === tag }}
          >
            <Text
              variant="caption"
              color={activeTag === tag ? colors.background.dark : colors.text.secondary}
            >
              {tag}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Entry List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      />

      {/* Floating Action Button */}
      <Pressable
        onPress={handleFabPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Create new journal entry"
      >
        <Text variant="h2" color={colors.background.dark} align="center">
          +
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  tagScroll: {
    maxHeight: 44,
    paddingBottom: spacing.xs,
  },
  tagRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  tagChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  lotusIcon: {
    fontSize: 48,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
