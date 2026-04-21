/**
 * Sacred Journal Hub — tabbed surface combining the daily diary with the
 * Sacred Journeys engine (षड्रिपु — the six inner enemies).
 *
 * Two tabs:
 *   1. "Sacred Journal" — the encrypted daily diary. Search, tag-filter,
 *      swipe-to-delete, long-press-to-edit, pull-to-refresh, FAB for new
 *      entries. Each entry's body is AES-256-GCM encrypted client-side
 *      (see apps/mobile/app/journal/new.tsx for key management).
 *   2. "Journeys" — lightweight hub for active Sacred Journeys with a CTA
 *      into the full catalog at /journey.
 *
 * The diary fuels KarmaLytix: mood tags, category tags, and encrypted
 * reflections feed the analytics engine (server-side reflection text is
 * never decrypted — only tags and metadata).
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
import { useJournalEntries, useDeleteJournal } from '@kiaanverse/api';
import type { JournalEntry } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';
import { JournalEntryCard } from '../../components/journal/JournalEntryCard';
import { JourneysView } from '../../components/journal/JourneysView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HUB_TABS = ['journal', 'journeys'] as const;
type HubTab = (typeof HUB_TABS)[number];

/**
 * Category filters for the Sacred Journal. These operate on the entry's
 * `tags` array since the backend schema does not yet include a dedicated
 * `category` field — the diary remains the single source of truth.
 */
const TAG_FILTERS = ['All', 'Gratitude', 'Reflection', 'Prayer', 'Dream', 'Insight'] as const;

// ---------------------------------------------------------------------------
// SwipeableEntryCard — pan-to-reveal-delete
// ---------------------------------------------------------------------------

interface SwipeableEntryCardProps {
  readonly entry: JournalEntry;
  readonly onPress: (entry: JournalEntry) => void;
  readonly onDelete: (entry: JournalEntry) => void;
  readonly onLongPress: (entry: JournalEntry) => void;
}

function SwipeableEntryCard({
  entry,
  onPress,
  onDelete,
  onLongPress,
}: SwipeableEntryCardProps): React.JSX.Element {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const resetSwipe = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    deleteOpacity.value = withTiming(0, { duration: 200 });
  }, [translateX, deleteOpacity]);

  const triggerDelete = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDelete(entry);
    // Restore position after confirmation returns so row does not stay open.
    resetSwipe();
  }, [entry, onDelete, resetSwipe]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
        deleteOpacity.value = Math.min(1, Math.abs(event.translationX) / SWIPE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 0.25, { duration: 200 });
        runOnJS(triggerDelete)();
      } else {
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
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <Text variant="body" color={colors.text.primary}>
          Delete
        </Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={400}>
            <GlowCard variant="golden">
              <JournalEntryCard entry={entry} onPress={onPress} />
            </GlowCard>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TabPill — hub-level tab switcher
// ---------------------------------------------------------------------------

function TabPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabPill, isActive && styles.tabPillActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text
        variant="label"
        color={isActive ? colors.background.dark : colors.text.muted}
        align="center"
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// JournalView — search, tag filter, entry list, FAB
// ---------------------------------------------------------------------------

function JournalView(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('journal');
  const { data, isLoading, refetch } = useJournalEntries();
  const deleteJournal = useDeleteJournal();

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
          entry.title?.toLowerCase().includes(query) ||
          entry.content_preview?.toLowerCase().includes(query) ||
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
        t('deleteTitle', 'Delete Reflection'),
        t(
          'deleteMessage',
          'This reflection will be archived. You can recover it later.',
        ),
        [
          { text: t('cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('delete', 'Delete'),
            style: 'destructive',
            onPress: async () => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              try {
                await deleteJournal.mutateAsync(entry.id);
              } catch {
                Alert.alert(
                  t('deleteErrorTitle', 'Could Not Delete'),
                  t('deleteErrorMessage', 'Please try again in a moment.'),
                );
              }
            },
          },
        ],
      );
    },
    [deleteJournal, t],
  );

  const handleEntryLongPress = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(entry.title ?? t('reflection', 'Reflection'), undefined, [
        {
          text: t('edit', 'Edit'),
          onPress: () => {
            void Haptics.selectionAsync();
            router.push(`/journal/${entry.id}?edit=true`);
          },
        },
        { text: t('cancel', 'Cancel'), style: 'cancel' },
      ]);
    },
    [router, t],
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
            {t('emptyTitle', 'Your sacred reflections await.')}
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center">
            {t(
              'emptySub',
              'Begin your first entry. Every reflection is AES-256 encrypted on your device.',
            )}
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center" style={styles.karmaNote}>
            {t(
              'karmalytixNote',
              '🔒 Your reflections power KarmaLytix — private insights, never shared.',
            )}
          </Text>
        </Animated.View>
      ) : null,
    [isLoading, t],
  );

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={t('searchPlaceholder', 'Search reflections...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <SacredDivider />

      {/* Tag filter chips */}
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
            style={[styles.tagChip, activeTag === tag && styles.tagChipActive]}
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

      <SacredTransition isVisible={true}>
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
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

      {/* FAB */}
      <Pressable
        onPress={handleFabPress}
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel={t('newEntry', 'Create new journal entry')}
      >
        <Text variant="h2" color={colors.background.dark} align="center">
          +
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen — tabbed hub
// ---------------------------------------------------------------------------

export default function JournalHubScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('journal');
  const [activeTab, setActiveTab] = useState<HubTab>('journal');

  const handleTabChange = useCallback((tab: HubTab) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GoldenHeader title={t('hubTitle', 'Sacred Reflections')} />

        {/* Hub-level tab switcher */}
        <View style={styles.hubTabRow}>
          <TabPill
            label={t('sacredJournal', 'Sacred Journal')}
            isActive={activeTab === 'journal'}
            onPress={() => handleTabChange('journal')}
          />
          <TabPill
            label={t('journeys', 'Journeys')}
            isActive={activeTab === 'journeys'}
            onPress={() => handleTabChange('journeys')}
          />
        </View>

        {activeTab === 'journal' ? <JournalView /> : <JourneysView />}
      </View>
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // -- Hub tabs --
  hubTabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  tabPillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },

  // -- Journal view --
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

  // -- Swipeable entry --
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

  // -- Empty state --
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  lotusIcon: {
    fontSize: 48,
  },
  karmaNote: {
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

  // -- FAB --
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
