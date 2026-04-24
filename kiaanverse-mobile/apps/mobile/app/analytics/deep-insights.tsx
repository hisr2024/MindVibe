/**
 * Deep Insights — Guna Balance & Emotional Patterns
 *
 * Displays the three-guna distribution (Sattva/Rajas/Tamas) as
 * horizontal bars, detected emotional patterns with triggers and
 * healing suggestions, personalized recommendations, and linked
 * verses for spiritual growth.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  LoadingMandala,
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  useDeepInsights,
  useGunaBalance,
  useEmotionalPatterns,
} from '@kiaanverse/api';

/** Color mapping for the three gunas */
const GUNA_COLORS: Record<string, string> = {
  sattva: '#3D8B5E',
  rajas: '#E67E22',
  tamas: '#6C3483',
};

const GUNA_LABELS: Record<string, string> = {
  sattva: 'Sattva (Purity)',
  rajas: 'Rajas (Passion)',
  tamas: 'Tamas (Inertia)',
};

export default function DeepInsightsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: insights, isLoading: insightsLoading } = useDeepInsights();
  const { data: guna, isLoading: gunaLoading } = useGunaBalance();
  const { data: patterns, isLoading: patternsLoading } = useEmotionalPatterns();

  const isLoading = insightsLoading || gunaLoading || patternsLoading;

  if (isLoading) {
    return (
      <Screen>
        <GoldenHeader title="Deep Insights" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <LoadingMandala size={80} />
          <Text variant="body" color={colors.primary[300]}>
            Analyzing your inner landscape...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <GoldenHeader title="Deep Insights" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Guna Balance */}
        {guna ? (
          <Animated.View entering={FadeInDown.duration(500)}>
            <Card style={styles.gunaCard}>
              <Text variant="label" color={colors.primary[300]}>
                Guna Balance
              </Text>

              {(['sattva', 'rajas', 'tamas'] as const).map((gunaKey) => {
                const value = guna[gunaKey];
                const isDominant = guna.dominant_guna === gunaKey;
                return (
                  <View key={gunaKey} style={styles.gunaRow}>
                    <View style={styles.gunaLabelRow}>
                      <Text
                        variant="bodySmall"
                        color={
                          isDominant
                            ? colors.text.primary
                            : colors.text.secondary
                        }
                        style={isDominant ? styles.dominantLabel : undefined}
                      >
                        {GUNA_LABELS[gunaKey]}
                      </Text>
                      <Text variant="caption" color={colors.text.muted}>
                        {value}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${value}%`,
                            backgroundColor: GUNA_COLORS[gunaKey],
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}

              {guna.guidance ? (
                <Text
                  variant="bodySmall"
                  color={colors.text.secondary}
                  style={styles.guidanceText}
                >
                  {guna.guidance}
                </Text>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {/* Emotional Patterns */}
        {patterns && patterns.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Card style={styles.patternsCard}>
              <Text variant="label" color={colors.primary[300]}>
                Emotional Patterns
              </Text>

              {patterns.map((pattern, index) => (
                <View key={index} style={styles.patternItem}>
                  <View style={styles.patternHeader}>
                    <Text variant="body" color={colors.text.primary}>
                      {pattern.pattern_name}
                    </Text>
                    <Text variant="caption" color={colors.text.muted}>
                      {pattern.frequency}x
                    </Text>
                  </View>

                  {pattern.triggers.length > 0 ? (
                    <Text variant="bodySmall" color={colors.text.secondary}>
                      Triggers: {pattern.triggers.join(', ')}
                    </Text>
                  ) : null}

                  <Text variant="bodySmall" color={colors.primary[300]}>
                    {pattern.healing_suggestion}
                  </Text>

                  {pattern.verse_ref ? (
                    <Text variant="caption" color={colors.text.muted}>
                      BG {pattern.verse_ref}
                    </Text>
                  ) : null}

                  {index < patterns.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        {/* Recommendations */}
        {insights?.recommendations && insights.recommendations.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Card style={styles.recsCard}>
              <Text variant="label" color={colors.primary[300]}>
                Personalized Recommendations
              </Text>
              {insights.recommendations.map((rec, index) => (
                <View key={index} style={styles.recRow}>
                  <Text variant="body" color={colors.divine.aura}>
                    {'\u2022'}
                  </Text>
                  <Text
                    variant="body"
                    color={colors.text.secondary}
                    style={styles.recText}
                  >
                    {rec}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        {/* Linked Verses */}
        {insights?.linked_verses && insights.linked_verses.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <Card style={styles.versesCard}>
              <Text variant="label" color={colors.primary[300]}>
                Verses for Growth
              </Text>
              {insights.linked_verses.map((v, index) => (
                <View key={index} style={styles.verseRow}>
                  <Text variant="body" color={colors.divine.aura}>
                    BG {v.chapter}.{v.verse}
                  </Text>
                  <Text variant="bodySmall" color={colors.text.secondary}>
                    {v.relevance}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  gunaCard: {
    gap: spacing.md,
  },
  gunaRow: {
    gap: spacing.xxs,
  },
  gunaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dominantLabel: {
    fontWeight: '700',
  },
  barTrack: {
    height: 12,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  guidanceText: {
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  patternsCard: {
    gap: spacing.md,
  },
  patternItem: {
    gap: spacing.xxs,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recsCard: {
    gap: spacing.sm,
  },
  recRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  recText: {
    flex: 1,
  },
  versesCard: {
    gap: spacing.sm,
  },
  verseRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
});
