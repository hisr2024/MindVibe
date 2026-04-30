/**
 * SadhanaPhaseFlow — Renders the correct content for each Sadhana phase.
 *
 * Animated transitions between phases (fade in/out). Consistent layout:
 * content area at center, action button at bottom. Sacred typography for verses.
 */

import React from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text, GoldenButton, colors, spacing } from '@kiaanverse/ui';
import type { SadhanaDaily } from '@kiaanverse/api';
import type { SadhanaPhase } from '../../app/sadhana/index';
import { ShankhaVoiceInput } from '../../voice/components/ShankhaVoiceInput';

interface MoodOption {
  readonly emoji: string;
  readonly label: string;
  readonly score: number;
}

export interface SadhanaPhaseFlowProps {
  readonly phase: SadhanaPhase;
  readonly userName: string;
  readonly moodOptions: readonly MoodOption[];
  readonly selectedMood: number | null;
  readonly onMoodSelect: (score: number) => void;
  readonly verseData: SadhanaDaily | undefined;
  readonly reflection: string;
  readonly onReflectionChange: (text: string) => void;
  readonly intention: string;
  readonly onIntentionChange: (text: string) => void;
  readonly onNextPhase: () => void;
  readonly onComplete: () => void;
  readonly onReturn: () => void;
  readonly isCompleting: boolean;
  readonly streak: number;
}

export function SadhanaPhaseFlow({
  phase,
  userName,
  moodOptions,
  selectedMood,
  onMoodSelect,
  verseData,
  reflection,
  onReflectionChange,
  intention,
  onIntentionChange,
  onNextPhase,
  onComplete,
  onReturn,
  isCompleting,
  streak,
}: SadhanaPhaseFlowProps): React.JSX.Element {
  return (
    <Animated.View
      key={phase}
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      {phase === 'greeting' && (
        <View style={styles.phaseContent}>
          <Text
            variant="h2"
            color={colors.divine.aura}
            align="center"
            style={styles.sacredText}
          >
            {'🙏'}
          </Text>
          <Text variant="h1" color={colors.text.primary} align="center">
            Namaste, {userName}.
          </Text>
          <Text
            variant="body"
            color={colors.text.secondary}
            align="center"
            style={styles.subtitle}
          >
            Welcome to your sacred practice.{'\n'}Take a deep breath and settle
            in.
          </Text>
          <View style={styles.actionArea}>
            <GoldenButton
              title="Begin Practice"
              onPress={onNextPhase}
              variant="divine"
            />
          </View>
        </View>
      )}

      {phase === 'mood_check' && (
        <View style={styles.phaseContent}>
          <Text variant="h2" color={colors.text.primary} align="center">
            How does your spirit feel today?
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center">
            Be honest with yourself. There is no wrong answer.
          </Text>
          <View style={styles.moodRow}>
            {moodOptions.map((option) => (
              <Pressable
                key={option.score}
                onPress={() => onMoodSelect(option.score)}
                style={[
                  styles.moodOption,
                  selectedMood === option.score && styles.moodSelected,
                ]}
                accessibilityLabel={option.label}
                accessibilityRole="button"
              >
                <Text variant="h1" align="center">
                  {option.emoji}
                </Text>
                <Text
                  variant="caption"
                  color={colors.text.muted}
                  align="center"
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actionArea}>
            <GoldenButton
              title="Continue"
              onPress={onNextPhase}
              disabled={selectedMood === null}
              variant="divine"
            />
          </View>
        </View>
      )}

      {phase === 'verse_contemplation' && (
        <View style={styles.phaseContent}>
          <Text variant="label" color={colors.primary[300]} align="center">
            Today's Wisdom
          </Text>
          {verseData?.verse_id ? (
            <View style={styles.verseCard}>
              <Text
                variant="h2"
                color={colors.divine.aura}
                align="center"
                style={styles.sanskritText}
              >
                {/* Sanskrit text would come from verse data — placeholder */}
                {'॥ श्रीमद्भगवद्गीता ॥'}
              </Text>
              <Text
                variant="body"
                color={colors.text.primary}
                align="center"
                style={styles.verseTranslation}
              >
                Contemplate this wisdom and let it settle within your being.
              </Text>
              <Text variant="caption" color={colors.text.muted} align="center">
                Verse: {verseData.verse_id}
              </Text>
            </View>
          ) : (
            <View style={styles.verseCard}>
              <Text variant="body" color={colors.text.primary} align="center">
                You are the eternal Self, beyond birth and death.{'\n'}
                The wise grieve neither for the living nor for the dead.
              </Text>
              <Text variant="caption" color={colors.text.muted} align="center">
                Bhagavad Gita 2.20
              </Text>
            </View>
          )}
          <Text variant="caption" color={colors.text.secondary} align="center">
            Sit with this verse. Let its meaning unfold naturally.
          </Text>
          <View style={styles.actionArea}>
            <GoldenButton
              title="I've Contemplated"
              onPress={onNextPhase}
              variant="divine"
            />
          </View>
        </View>
      )}

      {phase === 'reflection' && (
        <View style={styles.phaseContent}>
          <Text variant="h2" color={colors.text.primary} align="center">
            Reflect
          </Text>
          <Text variant="body" color={colors.text.secondary} align="center">
            What does this verse mean for you today?
          </Text>
          <ShankhaVoiceInput
            style={styles.reflectionInput}
            placeholder="Share your reflection..."
            value={reflection}
            onChangeText={onReflectionChange}
            multiline
            selectionColor={colors.primary[500]}
            dictationMode="append"
            />
          <View style={styles.actionArea}>
            <GoldenButton
              title="Continue"
              onPress={onNextPhase}
              variant="divine"
            />
          </View>
        </View>
      )}

      {phase === 'intention' && (
        <View style={styles.phaseContent}>
          <Text variant="h2" color={colors.text.primary} align="center">
            Set Your Intention
          </Text>
          <Text variant="body" color={colors.text.secondary} align="center">
            What will you carry forward from this practice today?
          </Text>
          <ShankhaVoiceInput
            style={styles.reflectionInput}
            placeholder="My intention for today is..."
            value={intention}
            onChangeText={onIntentionChange}
            multiline
            selectionColor={colors.primary[500]}
            dictationMode="append"
            />
          <View style={styles.actionArea}>
            <GoldenButton
              title="Complete Sadhana"
              onPress={onComplete}
              loading={isCompleting}
              variant="divine"
            />
          </View>
        </View>
      )}

      {phase === 'complete' && (
        <View style={styles.phaseContent}>
          <Text variant="h1" align="center" style={styles.checkmark}>
            {'✨'}
          </Text>
          <Text variant="h1" color={colors.divine.aura} align="center">
            Sadhana Complete
          </Text>
          <Text variant="body" color={colors.text.secondary} align="center">
            Your dedication nourishes your soul.{'\n'}
            +10 Karma Points earned.
          </Text>
          {streak > 0 && (
            <Text variant="body" color={colors.primary[300]} align="center">
              {'🔥'} {streak + 1} Day Streak!
            </Text>
          )}
          <View style={styles.actionArea}>
            <GoldenButton title="Return" onPress={onReturn} variant="divine" />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  phaseContent: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  sacredText: {
    fontSize: 48,
  },
  subtitle: {
    paddingHorizontal: spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: spacing.md,
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    minWidth: 56,
  },
  moodSelected: {
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  verseCard: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  sanskritText: {
    fontStyle: 'italic',
    lineHeight: 32,
  },
  verseTranslation: {
    lineHeight: 26,
  },
  reflectionInput: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.md,
    paddingTop: spacing.md,
  },
  actionArea: {
    width: '100%',
    paddingTop: spacing.md,
  },
  checkmark: {
    fontSize: 64,
  },
});
