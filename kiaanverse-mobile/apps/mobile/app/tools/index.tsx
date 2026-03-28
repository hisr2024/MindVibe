/**
 * Tools Hub — Sacred Tools Grid
 *
 * Displays all spiritual wellness tools in a 2-column grid layout.
 * Each card navigates to the respective tool with haptic feedback.
 * Staggered entrance animation for a polished reveal effect.
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, GoldenHeader, colors, spacing, radii } from '@kiaanverse/ui';

interface ToolItem {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'emotional-reset',
    title: 'Emotional Reset',
    emoji: '\u{1F30A}',
    description: 'Release and transform emotions',
    route: '/tools/emotional-reset',
  },
  {
    id: 'karma-reset',
    title: 'Karma Reset',
    emoji: '\u267B\uFE0F',
    description: 'Heal karmic patterns',
    route: '/tools/karma-reset',
  },
  {
    id: 'relationship-compass',
    title: 'Relationship Compass',
    emoji: '\u{1F9ED}',
    description: 'Dharma-guided clarity',
    route: '/tools/relationship-compass',
  },
  {
    id: 'viyoga',
    title: 'Viyoga',
    emoji: '\u{1F54A}\uFE0F',
    description: 'The art of letting go',
    route: '/tools/viyoga',
  },
  {
    id: 'ardha',
    title: 'Ardha',
    emoji: '\u{1F504}',
    description: 'Reframe your perspective',
    route: '/tools/ardha',
  },
  {
    id: 'karma-footprint',
    title: 'Karma Footprint',
    emoji: '\u{1F463}',
    description: 'Track your karmic ripples',
    route: '/karma-footprint',
  },
];

export default function ToolsHubScreen(): React.JSX.Element {
  const router = useRouter();

  const handlePress = useCallback(
    (route: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(route as never);
    },
    [router],
  );

  return (
    <Screen scroll>
      <View style={styles.container}>
        <GoldenHeader title="Sacred Tools" />

        <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
          Tools for transformation, clarity, and inner peace
        </Text>

        <View style={styles.grid}>
          {TOOLS.map((tool, index) => (
            <Animated.View
              key={tool.id}
              entering={FadeInUp.delay(index * 80).duration(500).springify()}
              style={styles.gridItem}
            >
              <Pressable
                onPress={() => handlePress(tool.route)}
                style={({ pressed }) => [
                  styles.pressable,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel={`${tool.title}: ${tool.description}`}
                accessibilityRole="button"
              >
                <Card style={styles.card}>
                  <Text variant="h2" align="center" style={styles.emoji}>
                    {tool.emoji}
                  </Text>
                  <Text variant="label" color={colors.primary[300]} align="center">
                    {tool.title}
                  </Text>
                  <Text variant="bodySmall" color={colors.text.muted} align="center" style={styles.desc}>
                    {tool.description}
                  </Text>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  subtitle: {
    paddingHorizontal: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
  },
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  card: {
    alignItems: 'center',
    gap: spacing.xs,
    borderColor: colors.alpha.goldMedium,
    borderWidth: 1,
    paddingVertical: spacing.lg,
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  desc: {
    marginTop: spacing.xxs,
  },
});
