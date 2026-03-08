/**
 * Journeys Screen
 *
 * Two-section layout:
 * 1. Active Journeys — ongoing journeys with progress
 * 2. Journey Catalog — available templates to start
 *
 * Features:
 * - Pull-to-refresh
 * - Animated journey cards with progress bars
 * - Enemy-based theming (color + icon per Shadripu)
 * - Pause/resume toggle
 * - Navigation to journey detail
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '@services/apiClient';
import { darkTheme, typography, spacing, radii, colors, shadows } from '@theme/tokens';
import type { JourneyStackParamList } from '@app-types/index';

// ---------------------------------------------------------------------------
// Enemy Theme Mapping (Shadripu)
// ---------------------------------------------------------------------------

const ENEMY_THEMES: Record<string, { emoji: string; color: string; label: string }> = {
  kama: { emoji: '🔥', color: '#ef4444', label: 'Desire' },
  krodha: { emoji: '⚡', color: '#f97316', label: 'Anger' },
  lobha: { emoji: '💰', color: '#eab308', label: 'Greed' },
  moha: { emoji: '🌫️', color: '#8b5cf6', label: 'Delusion' },
  mada: { emoji: '👑', color: '#ec4899', label: 'Pride' },
  matsarya: { emoji: '💚', color: '#22c55e', label: 'Jealousy' },
};

function getEnemyTheme(category: string) {
  return ENEMY_THEMES[category.toLowerCase()] ?? { emoji: '🕉️', color: colors.gold[400], label: category };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneysScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const navigation = useNavigation<NativeStackNavigationProp<JourneyStackParamList>>();
  const queryClient = useQueryClient();

  // Fetch active journeys
  const {
    data: journeysData,
    isLoading: journeysLoading,
    refetch: refetchJourneys,
  } = useQuery({
    queryKey: ['journeys'],
    queryFn: async () => {
      const { data } = await api.journeys.list();
      return data;
    },
  });

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
  } = useQuery({
    queryKey: ['journey-templates'],
    queryFn: async () => {
      const { data } = await api.journeys.templates();
      return data;
    },
  });

  // Start journey mutation
  const startJourney = useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await api.journeys.start(templateId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });

  const isLoading = journeysLoading || templatesLoading;

  const activeJourneys = useMemo(() => {
    if (!journeysData) return [];
    const list = Array.isArray(journeysData) ? journeysData : journeysData.journeys ?? [];
    return list.filter(
      (j: { status: string }) => j.status === 'active' || j.status === 'paused',
    );
  }, [journeysData]);

  const templates = useMemo(() => {
    if (!templatesData) return [];
    return Array.isArray(templatesData) ? templatesData : templatesData.templates ?? [];
  }, [templatesData]);

  const sections = useMemo(() => {
    const result = [];
    if (activeJourneys.length > 0) {
      result.push({ title: 'Active Journeys', data: activeJourneys, type: 'active' as const });
    }
    if (templates.length > 0) {
      result.push({ title: 'Start a Journey', data: templates, type: 'template' as const });
    }
    return result;
  }, [activeJourneys, templates]);

  const handleRefresh = useCallback(() => {
    refetchJourneys();
    queryClient.invalidateQueries({ queryKey: ['journey-templates'] });
  }, [refetchJourneys, queryClient]);

  // Active journey card
  const renderActiveJourney = (item: Record<string, unknown>) => {
    const enemies = item.primary_enemies as string[] | undefined;
    const enemyTheme = getEnemyTheme((item.category ?? enemies?.[0] ?? 'krodha') as string);
    const progress = Number(item.progress_percentage ?? 0);
    const currentDay = Number(item.current_day ?? 0);
    const totalDays = Number(item.total_days ?? item.duration_days ?? 14);

    return (
      <TouchableOpacity
        style={[styles.activeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => navigation.navigate('JourneyDetail', { journeyId: item.journey_id as string ?? item.id as string })}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, day ${currentDay} of ${totalDays}`}
      >
        <View style={styles.activeCardHeader}>
          <Text style={styles.enemyEmoji}>{enemyTheme.emoji}</Text>
          <View style={styles.activeCardMeta}>
            <Text style={[styles.activeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.title as string}
            </Text>
            <Text style={[styles.activeSubtitle, { color: theme.textSecondary }]}>
              Day {currentDay} of {totalDays} · {String(item.streak_days ?? 0)} day streak
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: enemyTheme.color + '22' }]}>
            <Text style={[styles.statusText, { color: enemyTheme.color }]}>
              {(item.status as string) === 'paused' ? 'Paused' : enemyTheme.label}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.inputBackground }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: enemyTheme.color, width: `${Math.min(progress, 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textTertiary }]}>
          {Math.round(progress)}% complete
        </Text>
      </TouchableOpacity>
    );
  };

  // Template card
  const renderTemplate = (item: Record<string, unknown>) => {
    const enemyTheme = getEnemyTheme((item.enemy ?? item.category ?? '') as string);
    const isStarting = startJourney.isPending;

    return (
      <TouchableOpacity
        style={[styles.templateCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => startJourney.mutate(item.id as string)}
        disabled={isStarting}
        accessibilityRole="button"
        accessibilityLabel={`Start ${item.title} journey, ${item.duration_days ?? 14} days`}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateEmoji}>{enemyTheme.emoji}</Text>
          <View style={[styles.durationBadge, { backgroundColor: colors.alpha.goldLight }]}>
            <Text style={[styles.durationText, { color: theme.accent }]}>
              {String(item.duration_days ?? 14)} days
            </Text>
          </View>
        </View>
        <Text style={[styles.templateTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.title as string}
        </Text>
        <Text style={[styles.templateDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description as string}
        </Text>
        {typeof item.difficulty === 'string' && (
          <View style={[styles.difficultyBadge, { backgroundColor: theme.inputBackground }]}>
            <Text style={[styles.difficultyText, { color: theme.textTertiary }]}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item.id ?? item.journey_id ?? String(index)) as string}
        renderItem={({ item, section }) =>
          section.type === 'active'
            ? renderActiveJourney(item as Record<string, unknown>)
            : renderTemplate(item as Record<string, unknown>)
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {section.title}
            </Text>
          </View>
        )}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.bottomInset,
          paddingHorizontal: spacing.lg,
        }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading journeys...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🧘</Text>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No journeys yet
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Start a journey to begin conquering your inner enemies
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
  },
  // Active journey card
  activeCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  enemyEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  activeCardMeta: {
    flex: 1,
  },
  activeTitle: {
    ...typography.h3,
    marginBottom: 2,
  },
  activeSubtitle: {
    ...typography.caption,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'right',
  },
  // Template card
  templateCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  templateEmoji: {
    fontSize: 36,
  },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  durationText: {
    ...typography.caption,
    fontWeight: '600',
  },
  templateTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  templateDesc: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
  },
  difficultyText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  // States
  loadingContainer: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
    paddingHorizontal: spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    textAlign: 'center',
  },
});
