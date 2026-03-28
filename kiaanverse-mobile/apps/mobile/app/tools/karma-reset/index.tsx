/**
 * Karma Reset — Entry Screen
 *
 * Introduces the 4-phase sacred ritual for healing relational harm.
 * Displays phase overview cards and a golden button to begin the journey.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, Text, Card, GoldenButton, Divider, colors, spacing } from '@kiaanverse/ui';

const PHASES = [
  {
    number: 1,
    title: 'Acknowledgment',
    icon: '🪷',
    description: 'Recognize the karmic pattern you wish to release',
  },
  {
    number: 2,
    title: 'Understanding',
    icon: '📖',
    description: 'Receive wisdom from the Bhagavad Gita for clarity',
  },
  {
    number: 3,
    title: 'Release',
    icon: '🔥',
    description: 'A guided breathing ritual to let go of the pattern',
  },
  {
    number: 4,
    title: 'Renewal',
    icon: '✨',
    description: 'Set a new intention and receive a sacred blessing',
  },
] as const;

export default function KarmaResetIndex(): React.JSX.Element {
  const router = useRouter();

  const handleBeginRitual = (): void => {
    router.push('/tools/karma-reset/phases/acknowledgment');
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text variant="h1" align="center">
            Karma Reset
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Release what no longer serves your dharma
          </Text>
        </Animated.View>

        <Divider />

        <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.intro}>
          <Text variant="body" color={colors.text.secondary} align="center">
            This sacred ritual guides you through four phases of transformation,
            drawing on the timeless wisdom of the Bhagavad Gita to help you
            release harmful karmic patterns and cultivate inner peace.
          </Text>
        </Animated.View>

        <View style={styles.phaseList}>
          {PHASES.map((phase, index) => (
            <Animated.View
              key={phase.number}
              entering={FadeInDown.duration(500).delay(250 + index * 100)}
            >
              <Card style={styles.phaseCard}>
                <View style={styles.phaseRow}>
                  <View style={styles.phaseIconContainer}>
                    <Text variant="h2">{phase.icon}</Text>
                  </View>
                  <View style={styles.phaseContent}>
                    <Text variant="label" color={colors.primary[300]}>
                      Phase {phase.number}: {phase.title}
                    </Text>
                    <Text variant="bodySmall" color={colors.text.muted}>
                      {phase.description}
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.actions}>
          <GoldenButton
            title="Begin Sacred Ritual"
            onPress={handleBeginRitual}
            testID="karma-reset-begin"
          />
        </Animated.View>
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
  header: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    paddingHorizontal: spacing.xl,
  },
  phaseList: {
    gap: spacing.md,
  },
  phaseCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  phaseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseContent: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
