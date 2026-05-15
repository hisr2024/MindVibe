/**
 * Sacred Reflections — BROWSE tab (पठन).
 *
 * 1:1 Kiaanverse.com mobile parity:
 *   • Title "Your Reflections" + Devanagari subtitle (आत्म-चिंतन).
 *   • Dot-stripe weekly calendar (S M T W T F S) with today highlighted.
 *   • 3 stat cards: TOTAL / THIS MONTH / STREAK.
 *   • Full-width search input.
 *   • Horizontally-scrollable mood filter chips (All / Peaceful / Grateful /
 *     Seeking / Wounded).
 *   • Either the lotus empty state ("Your sacred library awaits your first
 *     offering") or a list of JournalEntry cards filtered by search + mood.
 *
 * All data comes from the existing encrypted journal API
 * (`useJournalEntries`) — reflections stay encrypted; only plaintext
 * mood / tag metadata is used for filtering.
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text, colors, spacing } from '@kiaanverse/ui';
import { useJournalEntries } from '@kiaanverse/api';
import type { JournalEntry } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

import {
  BROWSE_FILTER_IDS,
  COPY_KEYS,
  MOOD_BY_ID,
  MOOD_LABEL_KEYS,
  type MoodId,
} from './constants';
import { ShankhaVoiceInput } from '../../voice/components/ShankhaVoiceInput';
import { LotusGlyph } from './LotusGlyph';

interface BrowseTabProps {
  readonly onOpenEditor: () => void;
}

// ---------------------------------------------------------------------------
// Stats derivation — pure functions over the entry list
// ---------------------------------------------------------------------------

function isSameDayUtc(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function computeStreak(entries: readonly JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set<string>();
  for (const entry of entries) {
    const d = new Date(entry.created_at);
    days.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
  }
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i += 1) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (days.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (i === 0) {
      // today missing — streak is 0
      return 0;
    } else {
      break;
    }
  }
  return streak;
}

function countThisMonth(entries: readonly JournalEntry[]): number {
  const now = new Date();
  return entries.filter((entry) => {
    const d = new Date(entry.created_at);
    return (
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth()
    );
  }).length;
}

// ---------------------------------------------------------------------------
// Weekly dot strip (locale-aware narrow weekday glyphs, current week, today
// highlighted). Single-letter weekday glyphs come from
// `toLocaleDateString(locale, { weekday: 'narrow' })` so they render as the
// natural script for each locale (e.g. "स" for Hindi Sunday).
// ---------------------------------------------------------------------------

function WeeklyStrip({
  entries,
  locale,
}: {
  readonly entries: readonly JournalEntry[];
  readonly locale: string;
}): React.JSX.Element {
  const today = new Date();
  const dow = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);

  const daysJournaled = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) {
      const d = new Date(e.created_at);
      s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return s;
  }, [entries]);

  const narrowWeekday = (d: Date): string => {
    try {
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    } catch {
      return d.toLocaleDateString('en-US', { weekday: 'narrow' });
    }
  };

  return (
    <View style={styles.weekRow}>
      {Array.from({ length: 7 }, (_, idx) => idx).map((idx) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + idx);
        const isToday = isSameDayUtc(day, today);
        const hasEntry = daysJournaled.has(
          `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
        );
        return (
          <View key={idx} style={styles.weekCell}>
            <Text
              variant="caption"
              color={colors.text.muted}
              style={styles.weekLabel}
            >
              {narrowWeekday(day)}
            </Text>
            <View
              style={[
                styles.weekDot,
                isToday && styles.weekDotToday,
                hasEntry && !isToday && styles.weekDotHasEntry,
              ]}
            >
              <Text
                variant="caption"
                color={isToday ? colors.primary[500] : colors.text.secondary}
                style={styles.weekDate}
              >
                {day.getDate()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main BrowseTab
// ---------------------------------------------------------------------------

export function BrowseTab({ onOpenEditor }: BrowseTabProps): React.JSX.Element {
  const router = useRouter();
  const { t, locale } = useTranslation('sacred-reflections');
  const { data, isLoading, refetch } = useJournalEntries();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<MoodId | 'all'>('all');
  const [refreshing, setRefreshing] = React.useState(false);

  const handleEntryPress = useCallback(
    (entryId: string) => {
      void Haptics.selectionAsync();
      router.push(`/journal/${entryId}`);
    },
    [router]
  );

  const entries = useMemo(() => data?.entries ?? [], [data]);

  const total = entries.length;
  const monthCount = useMemo(() => countThisMonth(entries), [entries]);
  const streak = useMemo(() => computeStreak(entries), [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (activeFilter !== 'all') {
      // Prefer the structured moods[] column so the filter keeps working even
      // if we stop mirroring the mood id into tags[] in a future release.
      // Fall back to tags so journals written before the moods[]/tags[]
      // split (shipped alongside this patch) still group correctly.
      result = result.filter(
        (e) => e.moods?.includes(activeFilter) || e.tags.includes(activeFilter)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.content_preview?.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, searchQuery, activeFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFilterPress = useCallback((id: MoodId | 'all') => {
    void Haptics.selectionAsync();
    setActiveFilter(id);
  }, []);

  const renderEntry = useCallback(
    ({ item }: { item: JournalEntry }) => {
      // Mood resolution order:
      //   1. Structured moods[] column (authoritative since Sacred Reflections
      //      writes moods & tags separately to match the backend contract).
      //   2. Tags fallback for entries written before the split.
      //   3. null → no mood pill rendered.
      const moodFromColumn = (item.moods ?? []).find((m) => m in MOOD_BY_ID) as
        | MoodId
        | undefined;
      const moodFromTags = item.tags.find((t) => t in MOOD_BY_ID) as
        | MoodId
        | undefined;
      const moodId = moodFromColumn ?? moodFromTags;
      const mood = moodId ? MOOD_BY_ID[moodId] : null;
      const date = new Date(item.created_at).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      });
      return (
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable
            onPress={() => handleEntryPress(item.id)}
            style={styles.entryCard}
            accessibilityRole="button"
            accessibilityLabel={t('browseEntryA11yFmt', { name: item.title ?? date })}
          >
            <View style={styles.entryHeader}>
              {mood ? (
                <View style={styles.entryMood}>
                  <Text style={styles.entryMoodEmoji}>{mood.emoji}</Text>
                  <Text variant="caption" color={mood.color}>
                    {mood.sanskrit}
                  </Text>
                </View>
              ) : null}
              <Text variant="caption" color={colors.text.muted}>
                {date}
              </Text>
            </View>
            {item.title ? (
              <Text
                variant="h3"
                color={colors.text.primary}
                style={styles.entryTitle}
              >
                {item.title}
              </Text>
            ) : null}
            <Text
              variant="caption"
              color={colors.text.muted}
              style={styles.entryPreview}
              numberOfLines={2}
            >
              {item.content_preview || t('browseEntryEncryptedFallback')}
            </Text>
          </Pressable>
        </Animated.View>
      );
    },
    [handleEntryPress]
  );

  const renderEmpty = !isLoading ? (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyWrap}>
      <LotusGlyph size={72} />
      <Text variant="h3" color={colors.text.primary} style={styles.emptyTitle}>
        {searchQuery || activeFilter !== 'all'
          ? t('browseEmptyFiltered')
          : t('browseEmptyUnfiltered')}
      </Text>
      <Pressable onPress={onOpenEditor}>
        <Text
          variant="caption"
          color={colors.text.muted}
          style={styles.emptySub}
        >
          {t(COPY_KEYS.emptyLibrarySub)}
        </Text>
      </Pressable>
    </Animated.View>
  ) : null;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary[500]}
          colors={[colors.primary[500]]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text variant="h2" color={colors.text.primary} style={styles.heading}>
        {t(COPY_KEYS.browseHeading)}
      </Text>
      <Text
        variant="caption"
        color={colors.primary[500]}
        style={styles.headingSanskrit}
      >
        {t(COPY_KEYS.browseSanskrit)}
      </Text>

      <WeeklyStrip entries={entries} locale={locale} />

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <StatCard value={total} label={t('browseStatTotalLabel')} title={t('browseStatTotalTitle')} />
        <StatCard value={monthCount} label={t('browseStatMonthLabel')} title={t('browseStatMonthTitle')} />
        <StatCard value={streak} label={t('browseStatStreakLabel')} title={t('browseStatStreakTitle')} />
      </View>

      {/* Search */}
      <ShankhaVoiceInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t(COPY_KEYS.browseSearch)}
        style={styles.searchInput}
        returnKeyType="search"
        dictationMode="append"
        />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {BROWSE_FILTER_IDS.map((id) => {
          const isActive = activeFilter === id;
          const mood = id === 'all' ? null : MOOD_BY_ID[id];
          // Mood labels are upper-case in storage ("PEACEFUL"); for chip
          // display we title-case the localized version so the chip reads
          // naturally ("Peaceful"). The "All" fallback comes from i18n.
          const rawLabel = mood ? t(MOOD_LABEL_KEYS[mood.id]) : t('browseFilterAll');
          const chipLabel = mood
            ? `${rawLabel.charAt(0)}${rawLabel.slice(1).toLowerCase()}`
            : rawLabel;
          return (
            <Pressable
              key={id}
              onPress={() => handleFilterPress(id)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t('browseFilterA11yFmt', { label: chipLabel })}
            >
              <Text style={styles.filterEmoji}>
                {mood ? mood.emoji : '\u{2728}'}
              </Text>
              <Text
                variant="caption"
                color={
                  isActive ? colors.background.dark : colors.text.secondary
                }
              >
                {chipLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        renderEmpty
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderEntry}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  value,
  label,
  title,
}: {
  readonly value: number;
  readonly label: string;
  readonly title: string;
}): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text variant="h1" color={colors.primary[500]} style={styles.statValue}>
        {value}
      </Text>
      <Text
        variant="caption"
        color={colors.text.muted}
        style={styles.statTitle}
      >
        {title}
      </Text>
      <Text variant="caption" color={colors.text.secondary}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  heading: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  headingSanskrit: {
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },

  // Weekly strip
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  weekCell: {
    alignItems: 'center',
    gap: 4,
  },
  weekLabel: { letterSpacing: 1 },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  weekDotToday: {
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
  weekDotHasEntry: {
    borderColor: colors.alpha.goldMedium,
    borderStyle: 'solid',
  },
  weekDate: {
    fontSize: 14,
  },

  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 36,
    fontStyle: 'italic',
  },
  statTitle: {
    letterSpacing: 1.4,
  },

  // Search
  searchInput: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    color: colors.text.primary,
    fontSize: 15,
  },

  // Filter chips
  filterRow: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterEmoji: { fontSize: 14 },

  // Entry list
  listContent: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  entryCard: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryMoodEmoji: { fontSize: 16 },
  entryTitle: { marginTop: 4, fontStyle: 'italic' },
  entryPreview: {
    fontStyle: 'italic',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  lotus: {
    fontSize: 56,
  },
  emptyTitle: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptySub: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
