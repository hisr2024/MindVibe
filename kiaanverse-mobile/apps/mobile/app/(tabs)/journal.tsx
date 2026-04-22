/**
 * Sacred Reflections — encrypted daily diary.
 *
 * Single-purpose surface: search, tag-filter, swipe-to-delete,
 * long-press-to-edit, pull-to-refresh, FAB for new entries. Each entry's
 * body is AES-256-GCM encrypted client-side (see
 * apps/mobile/app/journal/new.tsx for key management).
 *
 * Journeys used to share this tab as a secondary sub-tab; they now live in
 * their own top-level Journeys tab so the diary stays writing-first.
 *
 * The diary fuels KarmaLytix: mood tags, category tags, and encrypted
 * reflections feed the analytics engine (server-side reflection text is
 * never decrypted — only tags and metadata). A "KarmaLytix" header action
 * links straight into the analytics surface so users aren't forced to dig
 * through Profile to find their weekly mirror.
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
import { LinearGradient } from 'expo-linear-gradient';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Category filters for the Sacred Journal. These operate on the entry's
 * `tags` array since the backend schema does not yet include a dedicated
 * `category` field — the diary remains the single source of truth.
 */
const TAG_FILTERS = ['All', 'Gratitude', 'Reflection', 'Prayer', 'Dream', 'Insight'] as const;

// ---------------------------------------------------------------------------
// KarmaLytixBanner — promoted shortcut into the Sacred Mirror surface
// ---------------------------------------------------------------------------

/**
 * KarmaLytix banner pinned above the entry list.
 *
 * The Sacred Mirror reads exclusively from journal metadata (mood tags,
 * category tags, the weekly self-assessment) — the encrypted body is never
 * decrypted server-side. Surfacing that guarantee inline makes the privacy
 * contract visible at the point of trust, not buried in a settings screen.
 */
function KarmaLytixBanner({
  onPress,
}: {
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open KarmaLytix Sacred Mirror"
      style={styles.karmaLytixWrap}
    >
      <LinearGradient
        colors={['rgba(212,160,23,0.08)', 'rgba(212,160,23,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.karmaLytixGradient}
      >
        <View style={styles.karmaLytixLeft}>
          {/* The mirror glyph mirrors the "Sacred Mirror" product name —
              a small visual cue that costs us zero extra assets. */}
          <Text style={styles.karmaLytixIcon} accessibilityElementsHidden>
            {'\u{1FA9E}'}
          </Text>
          <View style={styles.karmaLytixTextWrap}>
            <Text variant="label" color={colors.primary[500]}>
              KarmaLytix
            </Text>
            <Text variant="caption" color={colors.text.secondary} style={styles.karmaLytixSub}>
              KIAAN analyses your reflections
            </Text>
            <Text variant="caption" color={colors.text.muted} style={styles.karmaLytixPrivacy}>
              {'\u{1F512}'} Metadata only · Content never read
            </Text>
          </View>
        </View>
        <Text variant="h3" color={colors.primary[500]} style={styles.karmaLytixArrow}>
          {'›'}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

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

  const handleOpenKarmaLytix = useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/analytics');
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
          // The KarmaLytix banner sits above the entry list and scrolls
          // with it so it stays out of the way on long diaries but is
          // immediately visible when the user opens the tab.
          ListHeaderComponent={<KarmaLytixBanner onPress={handleOpenKarmaLytix} />}
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
// Main Screen — Sacred Reflections with a KarmaLytix shortcut
// ---------------------------------------------------------------------------

export default function JournalScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('journal');

  // KarmaLytix is surfaced inline in the entry list header — see
  // KarmaLytixBanner above — so this outer screen stays minimal and the
  // Sacred Mirror CTA appears in the same scroll context as the user's
  // reflections.
  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GoldenHeader title={t('hubTitle', 'Sacred Reflections')} />
        <JournalView />
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

  // -- KarmaLytix banner (sits atop the entry list) --
  karmaLytixWrap: {
    marginBottom: spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  karmaLytixGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  karmaLytixLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  karmaLytixIcon: {
    fontSize: 28,
    lineHeight: 32,
  },
  karmaLytixTextWrap: {
    flex: 1,
    gap: 2,
  },
  karmaLytixSub: {
    marginTop: 2,
  },
  karmaLytixPrivacy: {
    marginTop: 2,
    fontStyle: 'italic',
  },
  karmaLytixArrow: {
    paddingLeft: spacing.xs,
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
