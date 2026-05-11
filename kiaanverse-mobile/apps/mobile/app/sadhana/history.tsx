/**
 * Sadhana History Screen
 *
 * Month-based calendar view of completed practice days with golden dots.
 * Lists recent sadhana records with mood, verse reference, and reflection preview.
 * Displays streak and completion statistics.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  Divider,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useSadhanaHistory, useSadhanaStreak } from '@kiaanverse/api';
import type { SadhanaRecord } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';
import { StreakFlame } from '../../components/sadhana/StreakFlame';

/** Mood emoji is universal — no localization needed. */
const MOOD_LABELS: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

/**
 * Resolve an Intl-friendly locale tag from the i18n locale code, falling
 * back to en-US when the active code isn't a valid BCP 47 tag (e.g. 'sa'
 * has no full Intl support on most engines).
 */
function safeIntlLocale(code: string): string {
  try {
    const supported = Intl.DateTimeFormat.supportedLocalesOf([code]);
    return supported.length > 0 ? supported[0]! : 'en-US';
  } catch {
    return 'en-US';
  }
}

/** Localized weekday short names (Sun, Mon, ...) for the calendar header. */
function getWeekdayShortNames(intlLocale: string): readonly string[] {
  // Anchor to a known Sunday (2024-01-07 was a Sunday) so day 0..6 maps to
  // Sun..Sat regardless of the locale's first-day-of-week convention. The
  // caller renders the cells in Sun-first order to match getDay().
  const fmt = new Intl.DateTimeFormat(intlLocale, { weekday: 'short' });
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return fmt.format(d);
  });
}

function getMonthName(month: number, intlLocale: string): string {
  return new Date(2026, month, 1).toLocaleDateString(intlLocale, {
    month: 'long',
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatRecordDate(iso: string, intlLocale: string): string {
  return new Date(iso).toLocaleDateString(intlLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function SadhanaHistoryScreen(): React.JSX.Element {
  const { t, locale } = useTranslation();
  const intlLocale = useMemo(() => safeIntlLocale(locale), [locale]);
  const weekdays = useMemo(() => getWeekdayShortNames(intlLocale), [intlLocale]);
  const router = useRouter();
  const { data: records, isLoading, refetch } = useSadhanaHistory(90);
  const { data: streakData } = useSadhanaStreak();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const streak = streakData?.current ?? 0;
  const longestStreak = streakData?.longest ?? 0;
  const totalDays = streakData?.totalDays ?? 0;

  /** Set of YYYY-MM-DD strings for completed days */
  const completedDays = useMemo(() => {
    const set = new Set<string>();
    (records ?? []).forEach((r) => {
      // Extract date portion from ISO string or date field
      const dateStr =
        r.date ?? (r.completed_at ? r.completed_at.slice(0, 10) : '');
      set.add(dateStr);
    });
    return set;
  }, [records]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const cells: { day: number | null; completed: boolean }[] = [];

    // Empty cells before month start
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, completed: false });
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, completed: completedDays.has(dateStr) });
    }

    return cells;
  }, [viewYear, viewMonth, completedDays]);

  const handlePrevMonth = useCallback(() => {
    void Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    void Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderRecord = useCallback(
    ({ item }: { item: SadhanaRecord }) => (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text variant="caption" color={colors.text.muted}>
            {formatRecordDate(item.date ?? item.completed_at ?? '', intlLocale)}
          </Text>
          {item.mood_score ? (
            <Text variant="body">{MOOD_LABELS[item.mood_score] ?? ''}</Text>
          ) : null}
        </View>
        {item.verse_id ? (
          <Text variant="caption" color={colors.primary[300]}>
            {t('sadhana.verseLabel', { verseId: item.verse_id })}
          </Text>
        ) : null}
        {item.reflection ? (
          <Text
            variant="caption"
            color={colors.text.secondary}
            numberOfLines={2}
          >
            {item.reflection}
          </Text>
        ) : null}
      </View>
    ),
    [intlLocale, t]
  );

  const keyExtractor = useCallback((item: SadhanaRecord) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <Animated.View entering={FadeIn.duration(400)}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <StreakFlame streak={streak} size={28} />
            <Text variant="caption" color={colors.text.muted}>
              {t('sadhana.statCurrent')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.primary[300]}>
              {longestStreak}
            </Text>
            <Text variant="caption" color={colors.text.muted}>
              {t('sadhana.statLongest')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.primary[300]}>
              {totalDays}
            </Text>
            <Text variant="caption" color={colors.text.muted}>
              {t('sadhana.statTotalDays')}
            </Text>
          </View>
        </View>

        <Divider />

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Month Nav */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={handlePrevMonth}
              hitSlop={12}
              accessibilityLabel={t('sadhana.previousMonthA11y')}
            >
              <Text variant="h2" color={colors.text.secondary}>
                {'<'}
              </Text>
            </Pressable>
            <Text variant="body" color={colors.text.primary}>
              {getMonthName(viewMonth, intlLocale)} {viewYear}
            </Text>
            <Pressable
              onPress={handleNextMonth}
              hitSlop={12}
              accessibilityLabel={t('sadhana.nextMonthA11y')}
            >
              <Text variant="h2" color={colors.text.secondary}>
                {'>'}
              </Text>
            </Pressable>
          </View>

          {/* Weekday Headers — sourced from Intl so each locale renders
              its own short-form names (Sun/Mon/... in English,
              Lun/Mar/... in Spanish, सोम/मंगल/... in Hindi). */}
          <View style={styles.weekRow}>
            {weekdays.map((day, idx) => (
              <View key={`${idx}-${day}`} style={styles.dayCell}>
                <Text
                  variant="caption"
                  color={colors.text.muted}
                  align="center"
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((cell, index) => (
              <View key={index} style={styles.dayCell}>
                {cell.day !== null ? (
                  <View
                    style={[
                      styles.dayCircle,
                      cell.completed && styles.dayCompleted,
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={
                        cell.completed
                          ? colors.background.dark
                          : colors.text.secondary
                      }
                      align="center"
                    >
                      {cell.day}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <Divider />

        <Text
          variant="label"
          color={colors.text.secondary}
          style={styles.sectionTitle}
        >
          {t('sadhana.recentPracticesHeader')}
        </Text>
      </Animated.View>
    ),
    [
      streak,
      longestStreak,
      totalDays,
      viewYear,
      viewMonth,
      calendarDays,
      handlePrevMonth,
      handleNextMonth,
      intlLocale,
      weekdays,
      t,
    ]
  );

  return (
    <Screen>
      <GoldenHeader title={t('sadhana.historyTitle')} onBack={() => router.back()} />

      <FlatList
        data={records ?? []}
        renderItem={renderRecord}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  calendarContainer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCompleted: {
    backgroundColor: colors.primary[500],
  },
  sectionTitle: {
    paddingTop: spacing.sm,
  },
  recordCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
