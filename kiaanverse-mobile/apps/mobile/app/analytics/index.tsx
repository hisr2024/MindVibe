/**
 * Analytics Dashboard — Journey Insights Overview
 *
 * Shows mood trends as a simple bar chart (View-based, no chart library),
 * date range selector, weekly summary, and journey completion stats.
 * Links to the deep insights screen for guna analysis and patterns.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  GoldenButton,
  LoadingMandala,
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useMoodTrends, useWeeklyInsights, useJourneyDashboard } from '@kiaanverse/api';

type DateRange = '7d' | '30d' | '90d';
const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

const DAYS_MAP: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

export default function AnalyticsScreen(): React.JSX.Element {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const days = DAYS_MAP[dateRange];
  const { data: moodData, isLoading: moodLoading } = useMoodTrends(days);
  const { data: weeklyData } = useWeeklyInsights();
  const { data: dashboardData } = useJourneyDashboard();

  const handleRangePress = useCallback((range: DateRange) => {
    void Haptics.selectionAsync();
    setDateRange(range);
  }, []);

  /** Maximum score in the data set, used to normalize bar heights */
  const maxScore = useMemo(() => {
    if (!moodData || moodData.length === 0) return 1;
    return Math.max(...moodData.map((d) => d.averageScore), 1);
  }, [moodData]);

  const visibleTrends = useMemo(() => {
    if (!moodData) return [];
    return moodData.slice(-days);
  }, [moodData, days]);

  return (
    <Screen>
      <GoldenHeader title="Your Journey Insights" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date range selector */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.rangeRow}>
          {DATE_RANGES.map((range) => (
            <Pressable
              key={range.value}
              onPress={() => handleRangePress(range.value)}
              style={[
                styles.rangeChip,
                dateRange === range.value && styles.rangeChipActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: dateRange === range.value }}
            >
              <Text
                variant="caption"
                color={dateRange === range.value ? colors.background.dark : colors.text.secondary}
              >
                {range.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Mood Trends Chart */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card style={styles.chartCard}>
            <Text variant="label" color={colors.primary[300]}>
              Mood Trends
            </Text>

            {moodLoading ? (
              <View style={styles.chartLoading}>
                <LoadingMandala size={40} />
              </View>
            ) : visibleTrends.length === 0 ? (
              <Text variant="bodySmall" color={colors.text.muted} align="center" style={styles.emptyChart}>
                No mood data yet for this period.
              </Text>
            ) : (
              <View style={styles.chartContainer}>
                <View style={styles.barsRow}>
                  {visibleTrends.map((trend, index) => {
                    const height = Math.max((trend.averageScore / maxScore) * 100, 4);
                    return (
                      <View key={`bar-${index}`} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            { height, backgroundColor: colors.primary[500] },
                          ]}
                        />
                        <Text variant="caption" color={colors.text.muted} style={styles.barLabel}>
                          {trend.date.slice(-2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Weekly Summary */}
        {weeklyData ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Card style={styles.summaryCard}>
              <Text variant="label" color={colors.primary[300]}>
                Weekly Summary
              </Text>
              <Text variant="body" color={colors.text.primary}>
                {weeklyData.summary}
              </Text>
              <Text variant="bodySmall" color={colors.text.secondary}>
                Top insight: {weeklyData.top_insight}
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        {/* Journey stats */}
        {dashboardData ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Card style={styles.statsCard}>
              <Text variant="label" color={colors.primary[300]}>
                Journey Progress
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="h2" color={colors.divine.aura} align="center">
                    {dashboardData.completedCount}
                  </Text>
                  <Text variant="caption" color={colors.text.muted} align="center">
                    Completed
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="h2" color={colors.primary[300]} align="center">
                    {dashboardData.activeJourneys?.length ?? 0}
                  </Text>
                  <Text variant="caption" color={colors.text.muted} align="center">
                    Active
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="h2" color={colors.text.primary} align="center">
                    {dashboardData.streakDays}
                  </Text>
                  <Text variant="caption" color={colors.text.muted} align="center">
                    Streak Days
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        <Divider />

        <GoldenButton
          title="View Deep Insights"
          onPress={() => router.push('/analytics/deep-insights')}
          variant="divine"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rangeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  rangeChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chartCard: {
    gap: spacing.md,
  },
  chartLoading: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyChart: {
    paddingVertical: spacing.lg,
  },
  chartContainer: {
    height: 140,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderRadius: radii.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  statsCard: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
