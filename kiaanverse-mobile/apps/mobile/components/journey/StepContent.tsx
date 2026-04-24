/**
 * StepContent — Full step content renderer for the daily journey experience.
 *
 * Renders all sections of a journey step: teaching, verse, reflection prompts,
 * practice instructions, micro-commitment, and safety notes. Each section is
 * wrapped in a themed GlowCard with an icon-accented left border.
 *
 * Designed to be embedded inside the step player ScrollView.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Text,
  GlowCard,
  SacredDivider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { VerseCard } from './VerseCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepContentSection {
  /** Main teaching/lesson text for the day. */
  readonly teaching?: string | undefined;
  /** Verse reference string, e.g. "2.47". */
  readonly verseRef?: string | undefined;
  /** Sanskrit text in Devanagari for the verse. */
  readonly sanskrit?: string | undefined;
  /** Romanized transliteration. */
  readonly transliteration?: string | undefined;
  /** English translation of the verse. */
  readonly englishTranslation?: string | undefined;
  /** Hindi translation (toggleable in VerseCard). */
  readonly hindiTranslation?: string | undefined;
  /** Array of guided reflection prompts. */
  readonly reflectionPrompts?: string[] | undefined;
  /** Practice name / title. */
  readonly practiceName?: string | undefined;
  /** Practice duration label, e.g. "15 min". */
  readonly practiceDuration?: string | undefined;
  /** Numbered practice instructions. */
  readonly practiceInstructions?: string[] | undefined;
  /** Micro-commitment quote or intention. */
  readonly microCommitment?: string | undefined;
  /** Safety/trigger notes if applicable. */
  readonly safetyNotes?: string | undefined;
  /** Accent color for decorative elements (enemy color). */
  readonly accentColor?: string | undefined;
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

/**
 * Teaching section with book icon and amber/gold left border.
 */
function TeachingSection({
  text,
  delay,
}: {
  readonly text: string;
  readonly delay: number;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <GlowCard variant="divine" style={styles.sectionCard}>
        <View style={[styles.sectionHeader, styles.teachingBorder]}>
          <Text variant="h3" color={colors.divine.aura}>
            {'\u{1F4D6}'}
          </Text>
          <Text variant="label" color={colors.divine.aura}>
            Today&apos;s Teaching
          </Text>
        </View>
        <Text
          variant="body"
          color={colors.text.primary}
          style={styles.bodyText}
        >
          {text}
        </Text>
      </GlowCard>
    </Animated.View>
  );
}

/**
 * Guided reflection prompts with thought-bubble icon and purple left border.
 */
function ReflectionSection({
  prompts,
  delay,
}: {
  readonly prompts: string[];
  readonly delay: number;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <GlowCard variant="golden" style={styles.sectionCard}>
        <View style={[styles.sectionHeader, styles.reflectionBorder]}>
          <Text variant="h3" color={colors.divine.peacock}>
            {'\u{1F4AD}'}
          </Text>
          <Text variant="label" color={colors.divine.peacock}>
            Guided Reflection
          </Text>
        </View>
        {prompts.map((prompt, index) => (
          <View key={index} style={styles.numberedItem}>
            <View
              style={[
                styles.numberBadge,
                { backgroundColor: colors.alpha.goldLight },
              ]}
            >
              <Text variant="caption" color={colors.divine.peacock}>
                {index + 1}
              </Text>
            </View>
            <Text
              variant="body"
              color={colors.text.secondary}
              style={styles.numberedText}
            >
              {prompt}
            </Text>
          </View>
        ))}
      </GlowCard>
    </Animated.View>
  );
}

/**
 * Practice section with meditation icon and green left border.
 */
function PracticeSection({
  name,
  duration,
  instructions,
  delay,
}: {
  readonly name?: string | undefined;
  readonly duration?: string | undefined;
  readonly instructions: string[];
  readonly delay: number;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <GlowCard variant="default" style={styles.sectionCard}>
        <View style={[styles.sectionHeader, styles.practiceBorder]}>
          <Text variant="h3" color={colors.semantic.success}>
            {'\u{1F9D8}'}
          </Text>
          <View style={styles.practiceHeaderText}>
            <Text variant="label" color={colors.semantic.success}>
              {name ?? "Today's Practice"}
            </Text>
            {duration ? (
              <View style={styles.durationBadge}>
                <Text variant="caption" color={colors.semantic.success}>
                  {duration}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.numberedItem}>
            <View
              style={[
                styles.numberBadge,
                { backgroundColor: `${colors.semantic.success}20` },
              ]}
            >
              <Text variant="caption" color={colors.semantic.success}>
                {index + 1}
              </Text>
            </View>
            <Text
              variant="body"
              color={colors.text.secondary}
              style={styles.numberedText}
            >
              {instruction}
            </Text>
          </View>
        ))}
      </GlowCard>
    </Animated.View>
  );
}

/**
 * Micro-commitment — single inspiring quote centered in a GlowCard.
 */
function MicroCommitmentSection({
  text,
  delay,
}: {
  readonly text: string;
  readonly delay: number;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <GlowCard variant="default" style={styles.commitmentCard}>
        <Text variant="h3" color={colors.divine.aura} align="center">
          {'\u{1F3AF}'}
        </Text>
        <Text
          variant="body"
          color={colors.text.secondary}
          align="center"
          style={styles.commitmentText}
        >
          {text}
        </Text>
      </GlowCard>
    </Animated.View>
  );
}

/**
 * Safety notes section with warning icon and rose border.
 */
function SafetySection({
  text,
  delay,
}: {
  readonly text: string;
  readonly delay: number;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={styles.safetyCard}>
        <View style={[styles.sectionHeader, styles.safetyBorder]}>
          <Text variant="h3" color={colors.semantic.warning}>
            {'\u26A0\uFE0F'}
          </Text>
          <Text variant="label" color={colors.semantic.warning}>
            Please Note
          </Text>
        </View>
        <Text
          variant="bodySmall"
          color={colors.text.secondary}
          style={styles.bodyText}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function StepContent({
  teaching,
  verseRef,
  sanskrit,
  transliteration,
  englishTranslation,
  hindiTranslation,
  reflectionPrompts,
  practiceName,
  practiceDuration,
  practiceInstructions,
  microCommitment,
  safetyNotes,
  accentColor = colors.primary[500],
}: StepContentSection): React.JSX.Element {
  let delayCounter = 0;

  return (
    <View style={styles.container}>
      {/* Verse Section — the Sacred Heart */}
      {verseRef ? (
        <Animated.View
          entering={FadeInDown.delay((delayCounter += 100)).duration(500)}
        >
          <VerseCard
            verseRef={verseRef}
            sanskrit={sanskrit}
            transliteration={transliteration}
            englishTranslation={englishTranslation}
            hindiTranslation={hindiTranslation}
            accentColor={accentColor}
          />
        </Animated.View>
      ) : null}

      {/* Teaching Section */}
      {teaching ? (
        <TeachingSection text={teaching} delay={(delayCounter += 100)} />
      ) : null}

      {/* Reflection Prompts */}
      {reflectionPrompts && reflectionPrompts.length > 0 ? (
        <ReflectionSection
          prompts={reflectionPrompts}
          delay={(delayCounter += 100)}
        />
      ) : null}

      {/* Practice Instructions */}
      {practiceInstructions && practiceInstructions.length > 0 ? (
        <PracticeSection
          name={practiceName}
          duration={practiceDuration}
          instructions={practiceInstructions}
          delay={(delayCounter += 100)}
        />
      ) : null}

      {/* Micro-Commitment */}
      {microCommitment ? (
        <MicroCommitmentSection
          text={microCommitment}
          delay={(delayCounter += 100)}
        />
      ) : null}

      {/* Safety Notes */}
      {safetyNotes ? (
        <SafetySection text={safetyNotes} delay={(delayCounter += 100)} />
      ) : null}

      <SacredDivider />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
  },
  teachingBorder: {
    borderLeftColor: colors.divine.aura,
  },
  reflectionBorder: {
    borderLeftColor: colors.divine.peacock,
  },
  practiceBorder: {
    borderLeftColor: colors.semantic.success,
  },
  safetyBorder: {
    borderLeftColor: colors.semantic.warning,
  },
  practiceHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  durationBadge: {
    backgroundColor: `${colors.semantic.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  bodyText: {
    lineHeight: 24,
  },
  numberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numberedText: {
    flex: 1,
    lineHeight: 22,
  },
  commitmentCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  commitmentText: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
  safetyCard: {
    backgroundColor: `${colors.semantic.warning}10`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.semantic.warning}30`,
  },
});
