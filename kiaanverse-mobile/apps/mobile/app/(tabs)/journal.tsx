/**
 * Sacred Journal — Entry List Screen
 *
 * Full-screen immersive layout with FlatList, search, tag filtering,
 * pull-to-refresh, and swipe-to-delete on each entry card. FAB positioned
 * with safe area insets. Long-press on entry opens context menu.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Text,
  Input,
  GoldenHeader,
  DivineBackground,
  GlowCard,
  SacredDivider,
  SacredTransition,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useJournalEntries } from '@kiaanverse/api';
import type { JournalEntry } from '@kiaanverse/api';
import { JournalEntryCard } from '../../components/journal/JournalEntryCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const TAG_FILTERS = ['All', 'Gratitude', 'Reflection', 'Prayer', 'Dream', 'Insight'] as const;

/**
 * Swipeable journal entry card.
 * Swipe left to reveal delete action. Swipe > 40% triggers haptic + confirmation.
 * Long-press opens context menu with edit/share options.
 */
function SwipeableEntryCard({
  entry,
  onPress,
  onDelete,
  onLongPress,
}: {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onLongPress: (entry: JournalEntry) => void;
}): React.JSX.Element {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const triggerDeleteConfirmation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDelete(entry);
  }, [entry, onDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Only allow swipe left (negative x)
      if (event.translationX < 0) {
        translateX.value = event.translationX;
        deleteOpacity.value = Math.min(1, Math.abs(event.translationX) / SWIPE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Past threshold — snap to reveal and trigger delete
        translateX.value = withTiming(-SCREEN_WIDTH * 0.25, { duration: 200 });
        runOnJS(triggerDeleteConfirmation)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        deleteOpacity.value = withTiming(0, { duration: 200 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    onPress(entry);
  }, [entry, onPress]);

  const handleLongPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(entry);
  }, [entry, onLongPress]);

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background revealed on swipe */}
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <Text variant="body" color={colors.text.primary}>
          Delete
        </Text>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={400}
          >
            <GlowCard variant="golden">
              <JournalEntryCard entry={entry} onPress={onPress} />
            </GlowCard>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function JournalListScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleEntryDelete = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(
        'Delete Reflection',
        'This reflection will be archived. You can recover it later.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Reset swipe state is handled by re-render
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              // Soft delete — would call deleteJournal mutation in production
            },
          },
        ],
      );
    },
    [],
  );

  const handleEntryLongPress = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(
        entry.title ?? 'Reflection',
        undefined,
        [
          {
            text: 'Edit',
            onPress: () => {
              void Haptics.selectionAsync();
              router.push(`/journal/${entry.id}?edit=true`);
            },
          },
          {
            text: 'Share',
            onPress: () => {
              void Haptics.selectionAsync();
              // Share functionality — would use Share API in production
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
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
      <SwipeableEntryCard
        entry={item}
        onPress={handleEntryPress}
        onDelete={handleEntryDelete}
        onLongPress={handleEntryLongPress}
      />
    ),
    [handleEntryPress, handleEntryDelete, handleEntryLongPress],
  );

  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

  const renderEmpty = useCallback(
    () =>
      !isLoading ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
          <Text variant="h2" align="center" style={styles.lotusIcon}>
            {'\u{1FAB7}'}
          </Text>
          <Text variant="body" color={colors.text.muted} align="center">
            Your sacred reflections await.{'\n'}Begin your first entry.
          </Text>
        </Animated.View>
      ) : null,
    [isLoading],
  );

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
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

        <SacredDivider />

        {/* Tag Filter Chips — horizontal scroll */}
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

        {/* Entry List with swipe-to-delete */}
        <SacredTransition isVisible={true}>
          <FlatList
            data={filteredEntries}
            renderItem={renderEntry}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 80 },
            ]}
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
        </SacredTransition>

        {/* Floating Action Button — positioned with safe area bottom inset */}
        <Pressable
          onPress={handleFabPress}
          style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
          accessibilityRole="button"
          accessibilityLabel="Create new journal entry"
        >
          <Text variant="h2" color={colors.background.dark} align="center">
            +
          </Text>
        </Pressable>
      </View>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
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
    gap: spacing.sm,
  },
  swipeContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.semantic.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing.xl,
    borderRadius: 12,
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
