/**
 * Journey Tab
 *
 * Browse journey catalog and view active journeys.
 */

import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Screen, Text, Card, Button, Divider, colors, spacing, radii } from '@kiaanverse/ui';
import { useJourneyTemplates, useJourneys, useStartJourney, type JourneyTemplate, type Journey } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

type TabFilter = 'catalog' | 'active' | 'completed';

export default function JourneyScreen(): React.JSX.Element {
  const { t } = useTranslation('journeys');
  const [activeTab, setActiveTab] = useState<TabFilter>('catalog');
  const { data: templates } = useJourneyTemplates();
  const { data: activeJourneys } = useJourneys('active');
  const { data: completedJourneys } = useJourneys('completed');
  const startJourney = useStartJourney();

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'catalog', label: t('catalog') },
    { key: 'active', label: t('active') },
    { key: 'completed', label: t('completed') },
  ];

  const renderTemplate = ({ item }: { item: JourneyTemplate }) => (
    <Card style={styles.templateCard}>
      <Text variant="label">{item.title}</Text>
      <Text variant="bodySmall" color={colors.divine.muted} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.templateMeta}>
        <Text variant="caption" color={colors.gold[400]}>
          {item.durationDays} {t('day')}s
        </Text>
        <Text variant="caption" color={colors.divine.muted}>
          {item.category}
        </Text>
      </View>
      <Button
        title={t('start')}
        variant="secondary"
        onPress={() => startJourney.mutate(item.id)}
        loading={startJourney.isPending}
      />
    </Card>
  );

  const renderJourney = ({ item }: { item: Journey }) => (
    <Card style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <Text variant="label">{item.title}</Text>
        <Text variant="caption" color={colors.gold[400]}>
          {t('day')} {item.currentDay}/{item.durationDays}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round((item.completedSteps / item.durationDays) * 100)}%` },
          ]}
        />
      </View>
      <Text variant="caption" color={colors.divine.muted}>
        {t('progress')}: {Math.round((item.completedSteps / item.durationDays) * 100)}%
      </Text>
    </Card>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h2">{t('catalog')}</Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text
              variant="label"
              color={activeTab === tab.key ? colors.gold[400] : colors.divine.muted}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'catalog' ? (
        <FlatList
          data={templates ?? []}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === 'active' ? (
        <FlatList
          data={activeJourneys ?? []}
          renderItem={renderJourney}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text variant="body" color={colors.divine.muted} align="center">
              No active journeys
            </Text>
          }
        />
      ) : (
        <FlatList
          data={completedJourneys ?? []}
          renderItem={renderJourney}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text variant="body" color={colors.divine.muted} align="center">
              No completed journeys yet
            </Text>
          }
        />
      )}
    </Screen>
  );
}

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
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  activeTab: {
    backgroundColor: colors.alpha.goldLight,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  templateCard: {
    gap: spacing.sm,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journeyCard: {
    gap: spacing.xs,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold[500],
    borderRadius: 2,
  },
});
