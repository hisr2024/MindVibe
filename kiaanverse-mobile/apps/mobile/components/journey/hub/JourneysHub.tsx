/**
 * JourneysHub — षड्रिपु Journeys orchestrator with 4 sub-tabs.
 *
 * Mirrors the web mobile JourneysScreen 1:1:
 *   • Header: षड्रिपु Journeys / THE INNER BATTLEFIELD
 *   • Active sub-tab fades in below the header
 *   • Fixed sub-tab bar at the bottom: Today · Journeys · Battleground · Wisdom
 *
 * Sub-tab content lives in dedicated files under this folder so each surface
 * stays focused and individually testable.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing } from '@kiaanverse/ui';
import {
  useJourneyDashboard,
  useJourneyTemplates,
} from '@kiaanverse/api';

import { TodaySubTab } from './TodaySubTab';
import { JourneysBrowseSubTab } from './JourneysBrowseSubTab';
import { PlaceholderSubTab } from './PlaceholderSubTab';

type SubTab = 'today' | 'journeys' | 'battleground' | 'wisdom';

interface SubTabDef {
  readonly id: SubTab;
  readonly label: string;
  readonly icon: string;
}

const TABS: readonly SubTabDef[] = [
  { id: 'today', label: 'Today', icon: '🔥' },
  { id: 'journeys', label: 'Journeys', icon: '⚔️' },
  { id: 'battleground', label: 'Battleground', icon: '☸️' },
  { id: 'wisdom', label: 'Wisdom', icon: '✦' },
];

export function JourneysHub(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<SubTab>('today');
  const { data: dashboard, isLoading: dashLoading } = useJourneyDashboard();
  const { data: templates } = useJourneyTemplates();

  const switchTab = (next: SubTab): void => {
    if (next === active) return;
    Haptics.selectionAsync().catch(() => undefined);
    setActive(next);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3" color={colors.text.primary} align="center">
          <Text variant="h3" color={colors.text.primary} style={styles.headerDevanagari}>
            षड्रिपु
          </Text>
          <Text variant="h3" color={colors.text.primary} style={styles.headerEnglish}>
            {' Journeys'}
          </Text>
        </Text>
        <Text variant="caption" color={colors.text.muted} align="center" style={styles.headerSub}>
          THE INNER BATTLEFIELD
        </Text>
      </View>

      {/* Sub-tab content */}
      <View style={styles.content}>
        <Animated.View
          key={active}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(160)}
          style={styles.flex}
        >
          {active === 'today' ? (
            <TodaySubTab dashboard={dashboard ?? null} templates={templates ?? []} />
          ) : null}
          {active === 'journeys' ? (
            <JourneysBrowseSubTab
              dashboard={dashboard ?? null}
              templates={templates ?? []}
            />
          ) : null}
          {active === 'battleground' ? (
            <PlaceholderSubTab
              title="Battleground"
              description="षड्रिपु — The Six Inner Enemies radar and per-enemy mastery overview."
            />
          ) : null}
          {active === 'wisdom' ? (
            <PlaceholderSubTab
              title="आज का ज्ञान"
              description="Today's Divine Wisdom verse + Sakha's reflection + this week's teachings."
            />
          ) : null}
        </Animated.View>

        {dashLoading && !dashboard ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <Text variant="caption" color={colors.text.muted}>
              Loading your battlefield…
            </Text>
          </View>
        ) : null}
      </View>

      {/* 4-sub-tab fixed footer bar */}
      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, spacing.xs) },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => switchTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={styles.tabBtn}
            >
              {isActive ? <View style={styles.activeDot} /> : null}
              <Text variant="caption" color={isActive ? colors.divine.aura : colors.text.secondary}>
                {tab.icon}
              </Text>
              <Text
                variant="caption"
                color={isActive ? colors.divine.aura : colors.text.muted}
                style={styles.tabLabel}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  headerDevanagari: {
    fontFamily: 'NotoSansDevanagari-Regular',
  },
  headerEnglish: {
    fontStyle: 'italic',
  },
  headerSub: {
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4,6,18,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(27,79,187,0.18)',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divine.aura,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
  },
});
