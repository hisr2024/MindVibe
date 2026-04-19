/**
 * Mood Tracking Screen
 *
 * Features:
 * - MoodRing selector with 8 spiritual states
 * - Sanskrit name, suggested practice, linked Gita verses
 * - Daily log (one entry/day, update same day allowed)
 * - 30-day mood chart (inline SVG bars)
 * - AI-generated mood insights
 * - Loading, error, and empty states
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Sparkles, BookOpen, TrendingUp } from 'lucide-react-native';
import {
  Screen,
  Text,
  GoldenHeader,
  MoodRing,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import type { Mood } from '@kiaanverse/ui';
import {
  useCreateMood,
  type SpiritualMood,
  type MoodEntry,
} from '@kiaanverse/api';
import { useMoodStore, MOOD_STATES, useWellnessStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Map MoodRing moods to SpiritualMood
// ---------------------------------------------------------------------------

const RING_TO_SPIRITUAL: Record<Mood, SpiritualMood> = {
  joy: 'joyful',
  peace: 'peaceful',
  anger: 'angry',
  sadness: 'sad',
  fear: 'anxious',
  love: 'hopeful',
  gratitude: 'grateful',
  confusion: 'confused',
};

const SPIRITUAL_TO_RING: Partial<Record<SpiritualMood, Mood>> = {
  joyful: 'joy',
  peaceful: 'peace',
  angry: 'anger',
  sad: 'sadness',
  anxious: 'fear',
  hopeful: 'love',
  grateful: 'gratitude',
  confused: 'confusion',
};

// ---------------------------------------------------------------------------
// Mood Detail Card (shown after selection)
// ---------------------------------------------------------------------------

function MoodDetailCard({ moodId }: { moodId: SpiritualMood }): React.JSX.Element | null {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const moodInfo = MOOD_STATES.find((m) => m.id === moodId);
  if (!moodInfo) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={[styles.detailCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <View style={styles.detailHeader}>
          <Text variant="h2">{moodInfo.emoji}</Text>
          <View style={styles.detailNames}>
            <Text variant="label" color={c.textPrimary}>{moodInfo.label}</Text>
            <Text variant="caption" color={colors.primary[300]}>{moodInfo.sanskrit}</Text>
          </View>
        </View>

        <View style={[styles.practiceBox, { backgroundColor: colors.alpha.goldLight }]}>
          <Sparkles size={14} color={colors.primary[300]} />
          <Text variant="bodySmall" color={c.textPrimary} style={styles.practiceText}>
            {moodInfo.suggestedPractice}
          </Text>
        </View>

        <View style={styles.versesRow}>
          <BookOpen size={14} color={c.textTertiary} />
          <Text variant="caption" color={c.textSecondary}>
            Gita: {moodInfo.linkedVerses.join(', ')}
          </Text>
        </View>

        {moodInfo.linkedVerses.length > 0 ? (
          <Pressable
            onPress={() => {
              const ref = moodInfo.linkedVerses[0];
              if (!ref) return;
              const [ch, v] = ref.split('.');
              router.push(`/verse/${ch}/${v}`);
            }}
            accessibilityLabel="Read linked verse"
          >
            <Text variant="caption" color={colors.primary[300]}>
              Read verse &rarr;
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// 30-Day Mood Chart (inline SVG)
// ---------------------------------------------------------------------------

function MoodChart({ entries }: { entries: MoodEntry[] }): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  const chartWidth = 320;
  const chartHeight = 140;
  const barWidth = 8;
  const gap = 2;
  const topPad = 20;
  const bottomPad = 20;
  const usableHeight = chartHeight - topPad - bottomPad;

  // Last 30 days
  const last30 = useMemo(() => {
    const days: Array<{ date: string; score: number | null }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = entries.find((e) => (e.date ?? e.at?.slice(0, 10)) === dateStr);
      days.push({ date: dateStr, score: entry ? entry.score : null });
    }
    return days;
  }, [entries]);

  const scoreToY = (score: number): number => {
    // Map score from -2..2 to chart space
    const normalized = (score + 2) / 4; // 0..1
    return chartHeight - bottomPad - normalized * usableHeight;
  };

  const barColor = (score: number): string => {
    if (score >= 1) return colors.semantic.success;
    if (score >= 0) return colors.primary[500];
    if (score >= -1) return colors.semantic.warning;
    return colors.semantic.error;
  };

  return (
    <View style={styles.chartContainer}>
      <Text variant="label" color={c.textSecondary} style={styles.chartTitle}>
        30-Day Mood Journey
      </Text>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Center line (neutral) */}
        <Line
          x1={0} y1={scoreToY(0)} x2={chartWidth} y2={scoreToY(0)}
          stroke={c.cardBorder} strokeWidth={1} strokeDasharray="4 4"
        />

        {/* Bars */}
        {last30.map((day, i) => {
          if (day.score === null) return null;
          const x = i * (barWidth + gap) + gap;
          const neutralY = scoreToY(0);
          const barY = scoreToY(day.score);
          const barH = Math.abs(barY - neutralY);
          const y = Math.min(barY, neutralY);

          return (
            <Rect
              key={day.date}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 2)}
              rx={2}
              fill={barColor(day.score)}
              opacity={0.8}
            />
          );
        })}

        {/* Y-axis labels */}
        <SvgText x={chartWidth - 2} y={topPad + 4} fontSize={9} fill={c.textTertiary} textAnchor="end">+2</SvgText>
        <SvgText x={chartWidth - 2} y={scoreToY(0) + 3} fontSize={9} fill={c.textTertiary} textAnchor="end">0</SvgText>
        <SvgText x={chartWidth - 2} y={chartHeight - bottomPad + 10} fontSize={9} fill={c.textTertiary} textAnchor="end">-2</SvgText>
      </Svg>
      <View style={styles.chartLabels}>
        <Text variant="caption" color={c.textTertiary}>30 days ago</Text>
        <Text variant="caption" color={c.textTertiary}>Today</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Insights Section
// ---------------------------------------------------------------------------

function InsightsSection(): React.JSX.Element | null {
  const { theme } = useTheme();
  const c = theme.colors;
  const moodHistory = useWellnessStore((s) => s.moodHistory);
  const streak = useWellnessStore((s) => s.streak);

  if (moodHistory.length < 3) return null;

  // Derive a simple dominant-mood insight from cached history
  const moodCounts: Record<string, number> = {};
  for (const entry of moodHistory.slice(0, 30)) {
    const key = entry.state ?? 'unknown';
    moodCounts[key] = (moodCounts[key] ?? 0) + 1;
  }
  const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return null;

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
      <View style={styles.insightsSection}>
        <View style={styles.insightsHeader}>
          <TrendingUp size={16} color={colors.primary[300]} />
          <Text variant="label" color={c.textSecondary}>Mood Insights</Text>
        </View>
        <View style={[styles.insightCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text variant="bodySmall" color={c.textPrimary}>
            Your dominant mood recently: {dominant[0]} ({dominant[1]} entries)
          </Text>
          {streak > 1 ? (
            <Text variant="caption" color={c.textSecondary}>
              {streak}-day tracking streak — keep going!
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MoodTrackingScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const { selectedMood, note, selectMood, setNote, markLogged } = useMoodStore();
  const createMood = useCreateMood();
  const moodHistory = useWellnessStore((s) => s.moodHistory);
  const addMoodEntry = useWellnessStore((s) => s.addMoodEntry);

  const [ringMood, setRingMood] = useState<Mood | undefined>(
    selectedMood ? SPIRITUAL_TO_RING[selectedMood] : undefined,
  );

  const handleMoodSelect = useCallback((mood: Mood) => {
    setRingMood(mood);
    const spiritual = RING_TO_SPIRITUAL[mood];
    selectMood(spiritual);
  }, [selectMood]);

  const handleSubmit = useCallback(() => {
    if (!selectedMood) return;
    const moodInfo = MOOD_STATES.find((m) => m.id === selectedMood);
    if (!moodInfo) return;

    const today = new Date().toISOString().slice(0, 10);
    const payload: { score: number; state: SpiritualMood; date: string; tags: string[]; note?: string } = {
      score: moodInfo.score,
      state: selectedMood,
      date: today,
      tags: [selectedMood],
    };
    if (note) payload.note = note;

    createMood.mutate(
      payload,
      {
        onSuccess: (data) => {
          markLogged();
          setRingMood(undefined);
          // Sync to wellness store for offline chart display
          addMoodEntry({
            id: typeof data.id === 'number' ? data.id : 0,
            score: payload.score,
            state: payload.state,
            tags: payload.tags,
            ...(payload.note !== undefined ? { note: payload.note } : {}),
            date: payload.date,
            at: new Date().toISOString(),
          });
        },
      },
    );
  }, [selectedMood, note, createMood, markLogged]);

  const kiaanResponse = createMood.data
    ? (createMood.data as { kiaanResponse?: string }).kiaanResponse
    : null;

  return (
    <Screen>
      <GoldenHeader
        title="Mood &amp; Wellness"
        onBack={() => router.back()}
        testID="mood-header"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* MoodRing selector */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <Text variant="label" color={c.textSecondary} align="center" style={styles.sectionLabel}>
            How are you feeling right now?
          </Text>
          <MoodRing
            {...(ringMood !== undefined ? { selectedMood: ringMood } : {})}
            onMoodSelect={handleMoodSelect}
            size={280}
            testID="mood-ring"
          />
        </Animated.View>

        {/* Selected mood details */}
        {selectedMood ? (
          <>
            <MoodDetailCard moodId={selectedMood} />

            {/* Note input */}
            <Animated.View entering={FadeIn.duration(300)}>
              <TextInput
                style={[styles.noteInput, { backgroundColor: c.card, borderColor: c.cardBorder, color: c.textPrimary }]}
                placeholder="Add a reflection (optional)..."
                placeholderTextColor={c.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={500}
                accessibilityLabel="Mood reflection note"
              />
            </Animated.View>

            {/* Submit button */}
            <Pressable
              onPress={handleSubmit}
              disabled={createMood.isPending}
              style={[styles.submitButton, { backgroundColor: colors.primary[500] }]}
              accessibilityRole="button"
              accessibilityLabel="Log mood"
            >
              <Text variant="label" color={colors.primary[100]} align="center">
                {createMood.isPending ? 'Logging...' : 'Log Mood'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {/* KIAAN response */}
        {kiaanResponse ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={[styles.responseCard, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="bodySmall" color={colors.primary[300]}>
                {kiaanResponse}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* 30-day chart */}
        {moodHistory.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <MoodChart entries={moodHistory} />
          </Animated.View>
        ) : (
          <View style={styles.emptyChart}>
            <Text variant="bodySmall" color={c.textTertiary} align="center">
              Start logging your mood to see your 30-day journey
            </Text>
          </View>
        )}

        {/* AI Insights */}
        <InsightsSection />
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },

  // Detail card
  detailCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailNames: {
    gap: 2,
  },
  practiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  practiceText: {
    flex: 1,
  },
  versesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Note input
  noteInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Submit button
  submitButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  // Response
  responseCard: {
    borderRadius: radii.md,
    padding: spacing.md,
  },

  // Chart
  chartContainer: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chartTitle: {
    marginBottom: spacing.xxs,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyChart: {
    paddingVertical: spacing.lg,
  },

  // Insights
  insightsSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  insightCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
});
