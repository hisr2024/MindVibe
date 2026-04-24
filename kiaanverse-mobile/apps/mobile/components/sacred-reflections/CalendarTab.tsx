/**
 * Sacred Reflections — CALENDAR tab (तिथि).
 *
 * 1:1 Kiaanverse.com mobile parity:
 *   • Two large cards: CURRENT STREAK / LONGEST STREAK (with 🔥 / ✦ glyphs).
 *   • Month header with ← / → navigation.
 *   • 7-column grid (S M T W T F S) with rounded day cells; today is
 *     gold-outlined, days with at least one reflection are subtly tinted.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing } from '@kiaanverse/ui';
import { useJournalEntries } from '@kiaanverse/api';
import type { JournalEntry } from '@kiaanverse/api';

import { COPY } from './constants';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEK_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Compute current + longest streaks measured in consecutive days ending
 * today. Streak counting stops at the first gap.
 */
function computeStreaks(entries: readonly JournalEntry[]): {
  current: number;
  longest: number;
} {
  if (entries.length === 0) return { current: 0, longest: 0 };
  const days = new Set<string>();
  for (const entry of entries) {
    days.add(dayKey(new Date(entry.created_at)));
  }

  // Current streak (backwards from today)
  let current = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i += 1) {
    if (days.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (i === 0) current = 0;
      break;
    }
  }

  // Longest streak (scan all unique days sorted ascending). `dayKey()`
  // always produces `YYYY-MM-DD`, so the parsed tuple is guaranteed to have
  // exactly three numeric segments — the explicit triple destructure keeps
  // the TS compiler from widening each segment to `number | undefined`.
  const sorted: (readonly [number, number, number])[] = [...days].map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    return [y ?? 0, m ?? 0, d ?? 0] as const;
  });
  sorted.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[2] - b[2];
  });

  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const [y, m, d] of sorted) {
    const day = new Date(y, m, d);
    if (prev) {
      const diff = (day.getTime() - prev.getTime()) / 86_400_000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = day;
  }
  if (current > longest) longest = current;
  return { current, longest };
}

export function CalendarTab(): React.JSX.Element {
  const { data } = useJournalEntries();
  const entries = useMemo(() => data?.entries ?? [], [data]);
  const [viewDate, setViewDate] = useState(new Date());

  const streaks = useMemo(() => computeStreaks(entries), [entries]);

  const daysWithEntry = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(dayKey(new Date(e.created_at)));
    return s;
  }, [entries]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      1
    );
    const firstDow = firstOfMonth.getDay();
    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    }
    // Pad to a full 6-row grid for consistent sizing
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const handlePrev = useCallback(() => {
    void Haptics.selectionAsync();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const handleNext = useCallback(() => {
    void Haptics.selectionAsync();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const today = new Date();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak cards */}
      <View style={styles.streakRow}>
        <StreakCard
          value={streaks.current}
          title={COPY.calendarCurrent}
          glyph={'\u{1F525}'}
        />
        <StreakCard
          value={streaks.longest}
          title={COPY.calendarLongest}
          glyph={'\u{2728}'}
        />
      </View>

      {/* Month header */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={handlePrev}
          style={styles.monthButton}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text variant="h3" color={colors.primary[500]}>
            ←
          </Text>
        </Pressable>
        <Text
          variant="h2"
          color={colors.text.primary}
          style={styles.monthLabel}
        >
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </Text>
        <Pressable
          onPress={handleNext}
          style={styles.monthButton}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text variant="h3" color={colors.primary[500]}>
            →
          </Text>
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekHeaderRow}>
        {WEEK_HEADERS.map((h, i) => (
          <Text
            key={i}
            variant="caption"
            color={colors.text.muted}
            style={styles.weekHeaderCell}
          >
            {h}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {grid.map((cell, idx) => {
          if (!cell) {
            return <View key={`blank-${idx}`} style={styles.dayCell} />;
          }
          const isToday = isSameDay(cell, today);
          const hasEntry = daysWithEntry.has(dayKey(cell));
          return (
            <View
              key={idx}
              style={[
                styles.dayCell,
                styles.dayCellFilled,
                hasEntry && styles.dayCellHasEntry,
                isToday && styles.dayCellToday,
              ]}
            >
              <Text
                variant="caption"
                color={isToday ? colors.primary[500] : colors.text.secondary}
                style={styles.dayNumber}
              >
                {cell.getDate()}
              </Text>
              {hasEntry ? <View style={styles.entryDot} /> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function StreakCard({
  value,
  title,
  glyph,
}: {
  readonly value: number;
  readonly title: string;
  readonly glyph: string;
}): React.JSX.Element {
  return (
    <View style={styles.streakCard}>
      <Text variant="h1" color={colors.primary[500]} style={styles.streakValue}>
        {value}
      </Text>
      <Text
        variant="caption"
        color={colors.text.muted}
        style={styles.streakTitle}
      >
        {title}
      </Text>
      <Text variant="caption" color={colors.text.secondary}>
        {glyph} days
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakCard: {
    flex: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    alignItems: 'center',
    gap: 4,
  },
  streakValue: {
    fontSize: 48,
    fontStyle: 'italic',
  },
  streakTitle: {
    letterSpacing: 1.4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  monthButton: {
    padding: spacing.sm,
  },
  monthLabel: {
    fontStyle: 'italic',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: '13.6%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellFilled: {
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    backgroundColor: colors.alpha.blackLight,
  },
  dayCellToday: {
    borderColor: colors.primary[500],
    borderWidth: 1.5,
  },
  dayCellHasEntry: {
    backgroundColor: colors.alpha.goldLight,
  },
  dayNumber: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  entryDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
  },
});
