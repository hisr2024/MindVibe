/**
 * Journey Tab — Wisdom Journey catalog with category filtering.
 *
 * 3 categories: Beginner Paths, Deep Dives, 21-Day Challenges
 * Journey cards: title, description, difficulty badge, progress indicator.
 * Tabs: Catalog | Active | Completed
 * Features cosmic gradient background and golden glow cards.
 */

import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, Flame, Target, Star } from 'lucide-react-native';
import {
  Screen,
  Text,
  Button,
  GlowCard,
  GoldenProgressBar,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import {
  useJourneyTemplates,
  useJourneys,
  useStartJourney,
  type JourneyTemplate,
  type Journey,
} from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabFilter = 'catalog' | 'active' | 'completed';

/** Category filter options matching JourneyCategory type. */
const CATEGORIES = [
  { key: 'all', label: 'All', icon: Star },
  { key: 'beginner_paths', label: 'Beginner', icon: BookOpen },
  { key: 'deep_dives', label: 'Deep Dives', icon: Flame },
  { key: '21_day_challenges', label: '21-Day', icon: Target },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: colors.semantic.success,
  intermediate: colors.semantic.warning,
  advanced: colors.semantic.error,
};

// ---------------------------------------------------------------------------
// Template Card (catalog)
// ---------------------------------------------------------------------------

function TemplateCard({
  item,
  index,
  onStart,
  isStarting,
}: {
  item: JourneyTemplate;
  index: number;
  onStart: () => void;
  isStarting: boolean;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const difficulty = (item as JourneyTemplate & { difficulty?: string }).difficulty ?? 'beginner';
  const diffColor = DIFFICULTY_COLORS[difficulty] ?? colors.primary[300];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <View style={[styles.templateCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        {/* Cover image or golden gradient placeholder */}
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.coverImage}
            accessibilityIgnoresInvertColors
            alt={item.title}
          />
        ) : (
          <LinearGradient
            colors={[colors.alpha.goldLight, colors.alpha.goldMedium, colors.alpha.goldLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverPlaceholder}
          >
            <BookOpen size={32} color={colors.primary[300]} />
          </LinearGradient>
        )}

        <View style={styles.templateContent}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
              <Text variant="caption" color={diffColor}>{difficulty}</Text>
            </View>
            <Text variant="caption" color={c.textTertiary}>
              {item.durationDays} days · {item.category.replace(/_/g, ' ')}
            </Text>
          </View>

          <Text variant="label" color={c.textPrimary} numberOfLines={1}>{item.title}</Text>
          <Text variant="bodySmall" color={c.textSecondary} numberOfLines={2}>
            {item.description}
          </Text>

          <Button
            title="Start Journey"
            variant="secondary"
            onPress={onStart}
            loading={isStarting}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Active Journey Card
// ---------------------------------------------------------------------------

function ActiveJourneyCard({
  item,
  index,
  onPress,
}: {
  item: Journey;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const progress = item.durationDays > 0
    ? (item.completedSteps / item.durationDays) * 100
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <GlowCard variant={progress >= 75 ? 'golden' : 'default'} style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <Text variant="label" color={c.textPrimary} numberOfLines={1} style={styles.journeyTitle}>
              {item.title}
            </Text>
            <Text variant="caption" color={colors.primary[300]}>
              Day {item.currentDay}/{item.durationDays}
            </Text>
          </View>

          <GoldenProgressBar progress={progress} height={6} />

          <View style={styles.journeyFooter}>
            <Text variant="caption" color={c.textTertiary}>
              {Math.round(progress)}% complete
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="caption" color={colors.primary[300]}>
                {item.status}
              </Text>
            </View>
          </View>
        </GlowCard>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function JourneyScreen(): React.JSX.Element {
  const { t } = useTranslation('journeys');
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabFilter>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: templates, isLoading: templatesLoading } = useJourneyTemplates();
  const { data: activeJourneys } = useJourneys('active');
  const { data: completedJourneys } = useJourneys('completed');
  const startJourney = useStartJourney();

  // Filter templates by category
  const filteredTemplates = templates?.filter((t) =>
    categoryFilter === 'all' || t.category === categoryFilter,
  ) ?? [];

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'catalog', label: t('catalog') },
    { key: 'active', label: t('active') },
    { key: 'completed', label: t('completed') },
  ];

  const handleStartJourney = useCallback(
    (templateId: string) => {
      startJourney.mutate(templateId);
    },
    [startJourney],
  );

  const handleJourneyPress = useCallback(
    (journeyId: string) => {
      router.push(`/(tabs)/journey/${journeyId}`);
    },
    [router],
  );

  return (
    <Screen gradient>
      <View style={styles.header}>
        <Text variant="h2">Wisdom Journeys</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: colors.alpha.goldLight },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text
              variant="label"
              color={activeTab === tab.key ? colors.primary[300] : c.textTertiary}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Category filter (catalog only) */}
      {activeTab === 'catalog' ? (
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategoryFilter(cat.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.alpha.goldMedium : colors.alpha.whiteLight,
                    borderColor: isActive ? colors.primary[500] : 'transparent',
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Icon size={14} color={isActive ? colors.primary[300] : c.textTertiary} />
                <Text variant="caption" color={isActive ? colors.primary[300] : c.textTertiary}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Content */}
      {activeTab === 'catalog' ? (
        <FlatList
          data={filteredTemplates}
          renderItem={({ item, index }) => (
            <TemplateCard
              item={item}
              index={index}
              onStart={() => handleStartJourney(item.id)}
              isStarting={startJourney.isPending}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            templatesLoading ? (
              <View style={styles.emptyState}>
                <LoadingMandala size={64} />
                <Text variant="bodySmall" color={c.textSecondary}>Loading journeys...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="body" color={c.textSecondary} align="center">
                  No journeys in this category yet
                </Text>
              </View>
            )
          }
        />
      ) : activeTab === 'active' ? (
        <FlatList
          data={activeJourneys ?? []}
          renderItem={({ item, index }) => (
            <ActiveJourneyCard
              item={item}
              index={index}
              onPress={() => handleJourneyPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={c.textSecondary} align="center">
                No active journeys
              </Text>
              <Text variant="bodySmall" color={c.textTertiary} align="center">
                Start a journey from the catalog
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={completedJourneys ?? []}
          renderItem={({ item, index }) => (
            <ActiveJourneyCard
              item={item}
              index={index}
              onPress={() => handleJourneyPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={c.textSecondary} align="center">
                No completed journeys yet
              </Text>
              <Text variant="bodySmall" color={c.textTertiary} align="center">
                Complete a journey to see it here
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },

  // Template card
  templateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.alpha.whiteLight,
  },
  coverPlaceholder: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  diffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },

  // Journey card
  journeyCard: {
    gap: spacing.sm,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
});
