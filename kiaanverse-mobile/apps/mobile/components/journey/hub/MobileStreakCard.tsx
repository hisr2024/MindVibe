/**
 * MobileStreakCard — Streak count + 14-day practice heatmap (2 rows × 7 cols).
 *
 * Mirrors the web mobile card 1:1: flame icon, big streak number, M T W T F
 * S S column labels, two rows of 7 squares (top row = previous week, bottom
 * row = current week). Today is right-most in the bottom row and gets a
 * gold ring instead of a fill.
 *
 * The heatmap is approximate — real per-day records aren't on the dashboard
 * payload. We fill the most recent `streak` cells solid, then sprinkle older
 * practice days deterministically so the card never re-renders differently
 * on the same data.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function generateHeatmap(streak: number, totalDays: number): boolean[] {
  const days = new Array<boolean>(14).fill(false);
  for (let i = 0; i < Math.min(streak, 14); i++) {
    days[13 - i] = true;
  }
  const remaining = Math.min(Math.max(0, totalDays - streak), 14 - Math.min(streak, 14));
  let filled = 0;
  for (let i = 0; i < 14 && filled < remaining; i++) {
    if (!days[i] && Math.sin(i * 7 + totalDays) > -0.2) {
      days[i] = true;
      filled++;
    }
  }
  return days;
}

export function MobileStreakCard({
  currentStreak,
  totalDaysPracticed,
}: {
  readonly currentStreak: number;
  readonly totalDaysPracticed: number;
}): React.JSX.Element {
  const heatmap = generateHeatmap(currentStreak, totalDaysPracticed);

  return (
    <View style={styles.card} accessibilityLabel={`Streak ${currentStreak} days`}>
      <View style={styles.left}>
        <Text variant="h2">🔥</Text>
        <View>
          <Text variant="h1" color="#F97316">
            {currentStreak}
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            Day streak
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.gridRow}>
          {DAY_LABELS.map((label, i) => (
            <View key={`label-${i}`} style={styles.cellLabel}>
              <Text variant="caption" color={colors.text.muted}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        {[0, 1].map((row) => (
          <View key={row} style={styles.gridRow}>
            {heatmap.slice(row * 7, row * 7 + 7).map((practiced, col) => {
              const dayIdx = row * 7 + col;
              const isToday = dayIdx === 13;
              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: practiced
                        ? 'rgba(212,160,23,0.5)'
                        : 'rgba(255,255,255,0.04)',
                      borderWidth: isToday ? 2 : 1,
                      borderColor: isToday
                        ? 'rgba(212,160,23,0.85)'
                        : 'rgba(255,255,255,0.05)',
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    gap: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  right: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cellLabel: {
    width: 20,
    alignItems: 'center',
  },
  cell: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
