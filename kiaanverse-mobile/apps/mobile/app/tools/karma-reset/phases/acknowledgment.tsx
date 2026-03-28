/**
 * Phase 1: Acknowledgment — Recognize the karmic pattern to release.
 *
 * Presents the six Shadripu (six enemies of the mind) as selectable cards
 * and collects a personal description of the pattern. Haptic feedback
 * fires on card selection to reinforce the intentional act of naming.
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  GoldenButton,
  Divider,
  colors,
  spacing,
} from '@kiaanverse/ui';
import {
  KarmicPatternCard,
  KarmicPattern,
} from '../../../../components/karma-reset/KarmicPatternCard';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';

// ---------------------------------------------------------------------------
// Shadripu — The Six Enemies of the Mind
// ---------------------------------------------------------------------------

const KARMIC_PATTERNS: readonly KarmicPattern[] = [
  {
    id: 'kama',
    sanskrit: 'Kama',
    english: 'Desire / Attachment',
    icon: '🔥',
    description: 'Clinging to outcomes, people, or possessions that bind you',
  },
  {
    id: 'krodha',
    sanskrit: 'Krodha',
    english: 'Anger',
    icon: '⚡',
    description: 'Reactive fury that clouds judgment and harms relationships',
  },
  {
    id: 'lobha',
    sanskrit: 'Lobha',
    english: 'Greed',
    icon: '💰',
    description: 'Insatiable wanting that leaves the soul perpetually empty',
  },
  {
    id: 'moha',
    sanskrit: 'Moha',
    english: 'Delusion',
    icon: '🌀',
    description: 'Confusion about what is real, mistaking the transient for eternal',
  },
  {
    id: 'mada',
    sanskrit: 'Mada',
    english: 'Pride',
    icon: '👑',
    description: 'Ego-driven superiority that separates you from others',
  },
  {
    id: 'matsarya',
    sanskrit: 'Matsarya',
    english: 'Jealousy',
    icon: '🐍',
    description: 'Resentment of another\'s fortune that poisons your own peace',
  },
] as const;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AcknowledgmentPhase(): React.JSX.Element {
  const router = useRouter();
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [personalDescription, setPersonalDescription] = useState('');

  const handleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPatternId(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedPatternId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/tools/karma-reset/phases/understanding',
      params: {
        patternId: selectedPatternId,
        description: personalDescription,
      },
    });
  }, [selectedPatternId, personalDescription, router]);

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Phase tracker */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <KarmaPhaseTracker currentPhase={1} completedPhases={[]} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
          <Text variant="h2" align="center">
            🪷 Phase 1: Acknowledgment
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Step 1 of 4
          </Text>
        </Animated.View>

        <Divider />

        {/* Prompt */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text variant="body" color={colors.text.secondary} align="center">
            What karmic pattern are you ready to release?
          </Text>
        </Animated.View>

        {/* Pattern grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.grid}>
          {KARMIC_PATTERNS.map((pattern) => (
            <KarmicPatternCard
              key={pattern.id}
              pattern={pattern}
              isSelected={selectedPatternId === pattern.id}
              onSelect={handleSelect}
            />
          ))}
        </Animated.View>

        {/* Personal description */}
        {selectedPatternId ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.inputSection}>
            <Text variant="label" color={colors.text.secondary}>
              Describe this pattern in your life
            </Text>
            <TextInput
              style={styles.textInput}
              value={personalDescription}
              onChangeText={setPersonalDescription}
              placeholder="How does this pattern show up for you?"
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              accessibilityLabel="Personal description of karmic pattern"
            />
          </Animated.View>
        ) : null}

        {/* Continue button */}
        {selectedPatternId ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.actions}>
            <GoldenButton
              title="Continue to Understanding"
              onPress={handleContinue}
              testID="acknowledgment-continue"
            />
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
