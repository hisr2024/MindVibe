/**
 * JourneysBrowseSubTab — "Your Active Battles" + "Begin a New Journey".
 *
 * Mirrors the web mobile JourneysTab 1:1: round Hindi enemy filter chips,
 * active battles cards (with Pause + Close action buttons rendered below
 * each), then a single-column list of new-journey templates with the full
 * sacred enrichment (modern context, BG verse chip, conqueredBy line).
 *
 * The web grid is 2-column at very wide tablet widths but renders as a
 * single column at phone widths — Android phones are always single
 * column, so we match that without the breakpoint complexity.
 */

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, colors, spacing } from '@kiaanverse/ui';
import {
  type DashboardData,
  type Journey,
  type JourneyTemplate,
  useAbandonJourney,
  usePauseJourney,
  useStartJourney,
} from '@kiaanverse/api';

import { type EnemyKey } from '../enemyInfo';
import { ActiveJourneyCardMobile } from './ActiveJourneyCardMobile';
import { EnemyFilterChips, type EnemyFilter } from './EnemyFilterChips';
import { JourneyTemplateCard } from './JourneyTemplateCard';

function matchesFilter(
  filter: EnemyFilter,
  enemyTags: string[] | undefined,
  category: string,
): boolean {
  if (filter === 'all') return true;
  const tags = (enemyTags ?? [category]).map((t) => t.toLowerCase());
  return tags.includes(filter as EnemyKey);
}

export function JourneysBrowseSubTab({
  dashboard,
  templates,
}: {
  readonly dashboard: DashboardData | null | undefined;
  readonly templates: JourneyTemplate[];
}): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<EnemyFilter>('all');
  const startMutation = useStartJourney();
  const pauseMutation = usePauseJourney();
  const closeMutation = useAbandonJourney();

  const activeJourneys: Journey[] = useMemo(() => {
    const list = dashboard?.activeJourneys ?? [];
    return list.filter((j) =>
      matchesFilter(filter, j.primaryEnemies, j.category),
    );
  }, [dashboard, filter]);

  const visibleTemplates = useMemo<JourneyTemplate[]>(() => {
    return templates.filter((t) =>
      matchesFilter(filter, t.primaryEnemyTags, t.category),
    );
  }, [templates, filter]);

  // Map template -> existing started journey (if any) so the CTA can flip
  // to "Continue → Day N" when the user already started this template.
  const startedByTemplate = useMemo(() => {
    const map = new Map<string, Journey>();
    for (const j of dashboard?.activeJourneys ?? []) {
      map.set(j.title.toLowerCase().trim(), j);
    }
    return map;
  }, [dashboard]);

  const lookupStarted = (template: JourneyTemplate): Journey | null => {
    return startedByTemplate.get(template.title.toLowerCase().trim()) ?? null;
  };

  const atMaxActive =
    (dashboard?.activeCount ?? 0) >= (dashboard?.maxActive ?? 5);

  const handleStart = (templateId: string): void => {
    if (atMaxActive) return;
    startMutation.mutate(templateId, {
      onSuccess: (journey) => {
        router.push({ pathname: '/journey/[id]', params: { id: journey.id } });
      },
    });
  };

  const handleContinue = (journeyId: string): void => {
    router.push({ pathname: '/journey/[id]', params: { id: journeyId } });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter row */}
      <EnemyFilterChips value={filter} onChange={setFilter} />

      {/* Your Active Battles */}
      <View>
        <Text variant="caption" color={colors.text.muted} style={styles.eyebrow}>
          YOUR ACTIVE BATTLES
        </Text>
        {activeJourneys.length > 0 ? (
          <View style={styles.list}>
            {activeJourneys.map((j) => (
              <ActiveJourneyCardMobile
                key={j.id}
                journey={j}
                showActions
                onPause={(id) => pauseMutation.mutate(id)}
                onClose={(id) => closeMutation.mutate(id)}
                isPausing={pauseMutation.isPending}
                isClosing={closeMutation.isPending}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text variant="body" color={colors.text.secondary} align="center">
              No active battles yet.
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Begin a journey below to face an inner enemy.
            </Text>
          </View>
        )}
      </View>

      {/* Begin a New Journey */}
      <View>
        <View style={styles.beginHeader}>
          <Text variant="caption" color={colors.text.muted} style={styles.eyebrow}>
            BEGIN A NEW JOURNEY
          </Text>
          {atMaxActive ? (
            <Text variant="caption" color="#FCD34D">
              {`Max ${dashboard?.maxActive ?? 5} active`}
            </Text>
          ) : null}
        </View>
        {visibleTemplates.length > 0 ? (
          <View style={styles.list}>
            {visibleTemplates.map((t) => (
              <JourneyTemplateCard
                key={t.id}
                template={t}
                startedInfo={lookupStarted(t)}
                onStart={handleStart}
                onContinue={handleContinue}
                isStarting={
                  startMutation.isPending && startMutation.variables === t.id
                }
                disabled={atMaxActive && !lookupStarted(t)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text variant="body" color={colors.text.secondary} align="center">
              No journeys match this filter yet.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  eyebrow: {
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  beginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.xl,
    gap: spacing.xs,
    alignItems: 'center',
  },
});
