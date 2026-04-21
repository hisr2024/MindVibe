/**
 * JourneysView — embedded Journey catalog view for the Journal hub.
 *
 * Shown inside the "Journeys" tab of the Sacred Journal hub. Keeps the surface
 * compact: active journeys at the top (with progress bars), a CTA to the full
 * Sacred Journey catalog for deeper exploration, and an empty state that
 * routes the user straight to Discover when nothing is active yet.
 *
 * Full template browsing lives on `/journey` (the षड्रिपु engine). This view
 * is intentionally a lightweight complement — the journal surface stays
 * writing-first, while giving active journeys visibility alongside the diary.
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sparkles, Flame, ChevronRight } from 'lucide-react-native';
import {
  Text,
  GoldenButton,
  GlowCard,
  GoldenProgressBar,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useJourneys, useJourneyDashboard, type Journey } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Enemy metadata (six shadripu — must match backend EnemyType enum)
// ---------------------------------------------------------------------------

const ENEMY_INFO: Record<string, { name: string; sanskrit: string; color: string }> = {
  kama: { name: 'Desire', sanskrit: 'काम', color: '#f59e0b' },
  krodha: { name: 'Anger', sanskrit: 'क्रोध', color: '#ef4444' },
  lobha: { name: 'Greed', sanskrit: 'लोभ', color: '#10b981' },
  moha: { name: 'Delusion', sanskrit: 'मोह', color: '#8b5cf6' },
  mada: { name: 'Pride', sanskrit: 'मद', color: '#ec4899' },
  matsarya: { name: 'Envy', sanskrit: 'मत्सर्य', color: '#06b6d4' },
};

function resolveEnemyKey(journey: Pick<Journey, 'category' | 'title'>): string | undefined {
  const searchText = `${journey.category} ${journey.title}`.toLowerCase();
  for (const key of Object.keys(ENEMY_INFO)) {
    if (searchText.includes(key)) return key;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Active Journey Card
// ---------------------------------------------------------------------------

interface ActiveJourneyCardProps {
  readonly journey: Journey;
  readonly index: number;
  readonly onPress: (journey: Journey) => void;
}

function ActiveJourneyCard({
  journey,
  index,
  onPress,
}: ActiveJourneyCardProps): React.JSX.Element {
  const progress =
    journey.durationDays > 0 ? (journey.completedSteps / journey.durationDays) * 100 : 0;
  const enemyKey = resolveEnemyKey(journey);
  const enemy = enemyKey ? ENEMY_INFO[enemyKey] : undefined;
  const accentColor = enemy?.color ?? colors.primary[500];

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(journey);
  }, [journey, onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(450).springify()}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${journey.title}, Day ${journey.currentDay} of ${journey.durationDays}`}
      >
        <GlowCard variant="golden" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
              {enemy ? (
                <Text variant="caption" color={accentColor}>
                  {enemy.sanskrit}
                </Text>
              ) : null}
            </View>
            <Text variant="caption" color={colors.primary[500]}>
              Day {journey.currentDay} of {journey.durationDays}
            </Text>
          </View>

          <Text variant="label" color={colors.text.primary} numberOfLines={1}>
            {journey.title}
          </Text>

          <GoldenProgressBar progress={progress} height={8} />

          <Text variant="caption" color={colors.text.muted} style={styles.progressLabel}>
            {Math.round(progress)}% complete
          </Text>
        </GlowCard>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

export function JourneysView(): React.JSX.Element {
  const router = useRouter();

  const {
    data: activeJourneys,
    isLoading: activeLoading,
    refetch: refetchActive,
    isRefetching: isRefetchingActive,
  } = useJourneys('active');

  const { data: dashboard } = useJourneyDashboard();

  const handleJourneyPress = useCallback(
    (journey: Journey) => {
      router.push(`/journey/${journey.id}`);
    },
    [router],
  );

  const handleBrowseCatalog = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/journey');
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Journey>) => (
      <ActiveJourneyCard journey={item} index={index} onPress={handleJourneyPress} />
    ),
    [handleJourneyPress],
  );

  const keyExtractor = useCallback((item: Journey) => item.id, []);

  const renderHeader = useCallback(
    () => (
      <Animated.View entering={FadeIn.duration(400)} style={styles.heroWrap}>
        <Text variant="h3" color={colors.primary[500]} style={styles.heroTitle}>
          षड्रिपु · Six Inner Enemies
        </Text>
        <Text variant="bodySmall" color={colors.text.secondary} style={styles.heroSub}>
          Transform anger, desire, greed, delusion, pride, and envy through guided
          multi-day practices rooted in the Bhagavad Gita.
        </Text>

        <View style={styles.statsRow}>
          <StatPill
            label="Active"
            value={dashboard?.activeJourneys?.length ?? activeJourneys?.length ?? 0}
          />
          <StatPill label="Completed" value={dashboard?.completedCount ?? 0} />
          <StatPill label="Streak" value={dashboard?.streakDays ?? 0} />
        </View>

        <GoldenButton
          title="Browse Sacred Catalog"
          variant="primary"
          onPress={handleBrowseCatalog}
          style={styles.cta}
        />

        {(activeJourneys?.length ?? 0) > 0 ? (
          <Text variant="label" color={colors.text.primary} style={styles.sectionLabel}>
            Your Active Journeys
          </Text>
        ) : null}
      </Animated.View>
    ),
    [activeJourneys, dashboard, handleBrowseCatalog],
  );

  const renderEmpty = useCallback(
    () =>
      activeLoading ? (
        <View style={styles.emptyState}>
          <LoadingMandala size={56} />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Flame size={40} color={colors.alpha.goldMedium} />
          <Text variant="body" color={colors.text.muted} align="center">
            No active journeys yet
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center">
            Begin a sacred path from the catalog to start transforming an inner enemy.
          </Text>
          <Pressable
            onPress={handleBrowseCatalog}
            style={styles.emptyCta}
            accessibilityRole="button"
            accessibilityLabel="Browse sacred journey catalog"
          >
            <Sparkles size={16} color={colors.primary[500]} />
            <Text variant="caption" color={colors.primary[500]}>
              Discover journeys
            </Text>
            <ChevronRight size={14} color={colors.primary[500]} />
          </Pressable>
        </Animated.View>
      ),
    [activeLoading, handleBrowseCatalog],
  );

  return (
    <FlatList
      data={activeJourneys ?? []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingActive}
          onRefresh={() => void refetchActive()}
          tintColor={colors.primary[500]}
        />
      }
    />
  );
}

// ---------------------------------------------------------------------------
// StatPill — compact count display
// ---------------------------------------------------------------------------

function StatPill({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <Text variant="h3" color={colors.primary[500]}>
        {value}
      </Text>
      <Text variant="caption" color={colors.text.muted}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.sm,
  },
  heroWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
  },
  heroSub: {
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 12,
  },
  cta: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: spacing.xxs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
});
