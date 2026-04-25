/**
 * MobileStatsBar — Four horizontally-scrollable stat cards for the Today
 * sub-tab. Mirrors the web mobile MobileStatsBar 1:1.
 *
 * Cards: Active (N/maxActive) · Completed · Streak · Days
 *
 * Trusts the backend-authoritative `activeCount` so the stats bar can never
 * disagree with the start-journey limit check on the Journeys browse tab.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { DashboardData } from '@kiaanverse/api';

interface StatDef {
  readonly label: string;
  readonly value: number;
  readonly suffix?: string;
  readonly icon: string;
  readonly tint: string;
}

export function MobileStatsBar({
  dashboard,
}: {
  readonly dashboard: DashboardData | null | undefined;
}): React.JSX.Element {
  const stats: StatDef[] = [
    {
      label: 'Active',
      value: dashboard?.activeCount ?? dashboard?.activeJourneys.length ?? 0,
      suffix: `/${dashboard?.maxActive ?? 5}`,
      icon: '⚔️',
      tint: 'rgba(139,92,246,0.18)',
    },
    {
      label: 'Completed',
      value: dashboard?.completedCount ?? 0,
      icon: '✅',
      tint: 'rgba(16,185,129,0.18)',
    },
    {
      label: 'Streak',
      value: dashboard?.streakDays ?? 0,
      icon: '🔥',
      tint: 'rgba(212,160,23,0.18)',
    },
    {
      label: 'Days',
      value: dashboard?.totalDaysPracticed ?? 0,
      icon: '📿',
      tint: 'rgba(236,72,153,0.18)',
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[styles.card, { backgroundColor: stat.tint }]}
          accessibilityLabel={`${stat.label}: ${stat.value}${stat.suffix ?? ''}`}
        >
          <Text variant="caption" color={colors.text.secondary}>
            {stat.icon}
          </Text>
          <View style={styles.valueRow}>
            <Text variant="h2" color={colors.divine.aura}>
              {stat.value}
            </Text>
            {stat.suffix ? (
              <Text variant="bodySmall" color={colors.text.muted}>
                {stat.suffix}
              </Text>
            ) : null}
          </View>
          <Text variant="caption" color={colors.text.muted}>
            {stat.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  card: {
    width: 96,
    minHeight: 100,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
