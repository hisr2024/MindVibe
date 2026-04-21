/**
 * Journey Discover — Shadripu Battleground catalog.
 *
 * Layout:
 *   1. Sacred header — "षड्रिपु Journeys" (NotoSansDevanagari 22 px gold)
 *      + English subtitle "Transform your inner enemies".
 *   2. Tab pills: Discover · Active · Completed.
 *   3. Ripu filter bar (horizontal scroll) — visible on Discover tab.
 *   4. FlatList of JourneyCards. Discover shows template variants with
 *      a "Begin" CTA; Active shows the taller progress variant; Completed
 *      shows a completed strip.
 *
 * Start a journey → invalidates journey queries → tab pill may auto-
 * switch to "Active" on success so the user sees their new journey.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  DivineBackground,
  LoadingMandala,
} from '@kiaanverse/ui';
import {
  useJourneys,
  useJourneyTemplates,
  useStartJourney,
  type Journey,
  type JourneyTemplate,
} from '@kiaanverse/api';

import {
  JourneyCard,
  resolveRipu,
  RipuFilterBar,
  type RipuFilterValue,
} from '../../components/journey';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.75)';

type TabKey = 'discover' | 'active' | 'completed';

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'discover', label: 'Discover' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function JourneyDiscoverScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>('discover');
  const [filter, setFilter] = useState<RipuFilterValue>('all');

  const {
    data: templates,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
    isRefetching: isRefetchingTemplates,
  } = useJourneyTemplates();

  const {
    data: activeJourneys,
    refetch: refetchActive,
    isRefetching: isRefetchingActive,
  } = useJourneys('active');

  const {
    data: completedJourneys,
    refetch: refetchCompleted,
    isRefetching: isRefetchingCompleted,
  } = useJourneys('completed');

  const startJourney = useStartJourney();

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (filter === 'all') return templates;
    return templates.filter((tmpl) => {
      const ripu = resolveRipu({
        title: tmpl.title,
        category: tmpl.category,
        description: tmpl.description,
      });
      return ripu?.key === filter;
    });
  }, [templates, filter]);

  const handleStartJourney = useCallback(
    (templateId: string) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startJourney.mutate(templateId, {
        onSuccess: (created) => {
          setTab('active');
          router.push(`/journey/${created.id}` as never);
        },
      });
    },
    [startJourney, router],
  );

  const handleJourneyPress = useCallback(
    (journeyId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/journey/${journeyId}` as never);
    },
    [router],
  );

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  const renderTemplateItem = useCallback(
    ({ item }: ListRenderItemInfo<JourneyTemplate>) => {
      const ripu = resolveRipu({
        title: item.title,
        category: item.category,
        description: item.description,
      });
      return (
        <JourneyCard
          variant="template"
          title={item.title}
          description={item.description}
          durationDays={item.durationDays}
          ripu={ripu}
          onPress={() => handleStartJourney(item.id)}
          isStarting={startJourney.isPending}
        />
      );
    },
    [handleStartJourney, startJourney.isPending],
  );

  const renderActiveItem = useCallback(
    ({ item }: ListRenderItemInfo<Journey>) => {
      const ripu = resolveRipu({
        title: item.title,
        category: item.category,
        description: item.description,
      });
      return (
        <JourneyCard
          variant="active"
          title={item.title}
          durationDays={item.durationDays}
          completedSteps={item.completedSteps}
          ripu={ripu}
          onPress={() => handleJourneyPress(item.id)}
        />
      );
    },
    [handleJourneyPress],
  );

  const renderCompletedItem = useCallback(
    ({ item }: ListRenderItemInfo<Journey>) => {
      const ripu = resolveRipu({
        title: item.title,
        category: item.category,
        description: item.description,
      });
      return (
        <JourneyCard
          variant="active"
          title={item.title}
          durationDays={item.durationDays}
          completedSteps={item.durationDays}
          ripu={ripu}
          onPress={() => handleJourneyPress(item.id)}
        />
      );
    },
    [handleJourneyPress],
  );

  // Configuration per tab.
  const tabState = useMemo(() => {
    switch (tab) {
      case 'discover':
        return {
          data: filteredTemplates,
          renderItem: renderTemplateItem,
          refreshing: isRefetchingTemplates,
          onRefresh: () => {
            void refetchTemplates();
          },
          loading: templatesLoading,
          emptyText: 'No journeys in this category yet.',
          showFilter: true,
        };
      case 'active':
        return {
          data: activeJourneys ?? [],
          renderItem: renderActiveItem,
          refreshing: isRefetchingActive,
          onRefresh: () => {
            void refetchActive();
          },
          loading: false,
          emptyText: 'No active journeys — begin one from Discover.',
          showFilter: false,
        };
      case 'completed':
        return {
          data: completedJourneys ?? [],
          renderItem: renderCompletedItem,
          refreshing: isRefetchingCompleted,
          onRefresh: () => {
            void refetchCompleted();
          },
          loading: false,
          emptyText: 'No completed journeys yet — your first victory awaits.',
          showFilter: false,
        };
    }
  }, [
    tab,
    filteredTemplates,
    activeJourneys,
    completedJourneys,
    renderTemplateItem,
    renderActiveItem,
    renderCompletedItem,
    isRefetchingTemplates,
    isRefetchingActive,
    isRefetchingCompleted,
    refetchTemplates,
    refetchActive,
    refetchCompleted,
    templatesLoading,
  ]);

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text
          style={styles.titleSanskrit}
          accessibilityRole="header"
          accessibilityLabel="Shadripu Journeys"
        >
          <Text style={styles.titleSanskritHead}>षड्रिपु</Text>
          {'  '}
          Journeys
        </Text>
        <Text style={styles.subtitle}>Transform your inner enemies</Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TabPill
                key={t.key}
                label={t.label}
                active={active}
                onPress={() => {
                  if (active) return;
                  void Haptics.selectionAsync();
                  setTab(t.key);
                }}
              />
            );
          })}
        </View>

        {tabState.showFilter ? (
          <RipuFilterBar value={filter} onChange={setFilter} />
        ) : null}
      </View>

      <FlatList
        // The key forces FlatList to remount on tab change so scroll
        // position and animations reset — better UX than retaining the
        // Discover scroll offset while in Completed.
        key={tab}
        data={tabState.data as readonly { id: string }[]}
        keyExtractor={keyExtractor}
        renderItem={
          tabState.renderItem as unknown as (
            info: ListRenderItemInfo<{ id: string }>,
          ) => React.ReactElement | null
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tabState.refreshing}
            onRefresh={tabState.onRefresh}
            tintColor={GOLD}
          />
        }
        ListEmptyComponent={
          tabState.loading ? (
            <View style={styles.state}>
              <LoadingMandala size={64} />
              <Text style={styles.emptyText}>Unveiling sacred paths…</Text>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.emptyText}>{tabState.emptyText}</Text>
            </View>
          )
        }
      />
    </DivineBackground>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ItemSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  titleSanskrit: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  titleSanskritHead: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 22,
    color: GOLD,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    backgroundColor: 'rgba(17,20,53,0.75)',
  },
  tabActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212,160,23,0.16)',
  },
  tabLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: SACRED_WHITE,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separator: {
    height: 12,
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
