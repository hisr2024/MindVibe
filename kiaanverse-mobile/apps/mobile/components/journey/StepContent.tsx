/**
 * StepContent — Canonical 6-card daily journey renderer.
 *
 * Renders the six fixed cards every journey step must surface, in this exact
 * order:
 *   1. Verse        — Sanskrit + transliteration + English translation.
 *   2. Teaching     — The day's lesson body.
 *   3. Today's World — Modern real-life example + Gita implementation.
 *   4. Reflection   — Numbered guided-reflection prompts.
 *   5. Practice     — Daily practice with duration + numbered steps.
 *   6. Micro-Commitment — One-line vow for the day.
 *
 * An optional safety note is rendered after the six cards when applicable.
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
import type { JourneyModernExample } from '@kiaanverse/api';

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
  /** "In Today's World" — modern example + Gita implementation. */
  readonly modernExample?: JourneyModernExample | undefined;
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
            Teaching
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
 * "In Today's World" — Modern real-life example connected to a Gita verse.
 *
 * Renders three layers, mirroring the web mobile experience:
 *   • Scenario      — the everyday situation the user recognises.
 *   • Manifestation — how the inner enemy shows up in that scenario.
 *   • Antidote      — the Gita-rooted practical response (with optional
 *                     verse-ref chip when supplied).
 */
function TodaysWorldSection({
  example,
  accentColor,
  delay,
}: {
  readonly example: JourneyModernExample;
  readonly accentColor: string;
  readonly delay: number;
}): React.JSX.Element {
  const verseLabel = example.gitaVerseRef
    ? `BG ${example.gitaVerseRef.chapter}.${example.gitaVerseRef.verse}`
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <View
        style={[
          styles.todaysWorldCard,
          {
            borderColor: `${accentColor}33`,
            borderLeftColor: accentColor,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text variant="h3" color={accentColor}>
            {'✦'}
          </Text>
          <Text variant="label" color={accentColor}>
            In Today&apos;s World
          </Text>
        </View>

        {/* Scenario — the recognisable everyday situation. */}
        <Text
          variant="body"
          color={colors.text.primary}
          style={styles.todaysWorldScenario}
        >
          {example.scenario}
        </Text>

        {/* How the enemy manifests. */}
        <Text
          variant="bodySmall"
          color={colors.text.secondary}
          style={styles.todaysWorldManifestation}
        >
          {example.howEnemyManifests}
        </Text>

        {/* Hairline divider mirroring the web treatment. */}
        <View
          style={[
            styles.todaysWorldDivider,
            { backgroundColor: `${accentColor}33` },
          ]}
        />

        {/* Gita implementation — verse chip + wisdom + practical antidote. */}
        {verseLabel ? (
          <View
            style={[
              styles.verseChip,
              { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}55` },
            ]}
          >
            <Text variant="caption" color={accentColor}>
              {verseLabel}
            </Text>
          </View>
        ) : null}

        {example.gitaWisdom ? (
          <Text
            variant="bodySmall"
            color={colors.text.secondary}
            style={styles.todaysWorldWisdom}
          >
            {example.gitaWisdom}
          </Text>
        ) : null}

        <Text
          variant="body"
          color={colors.text.primary}
          style={styles.todaysWorldAntidote}
        >
          {example.practicalAntidote}
        </Text>
      </View>
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
            Reflection
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
              Practice
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
        {name ? (
          <Text variant="h3" color={colors.text.primary}>
            {name}
          </Text>
        ) : null}
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
 * Micro-commitment — single inspiring quote in a cyan-bordered card.
 *
 * Mirrors the web treatment: an uppercase "MICRO COMMITMENT" eyebrow with
 * the day's vow rendered as an italic, quoted line beneath.
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
      <View style={styles.commitmentCard}>
        <View style={[styles.sectionHeader, styles.commitmentBorder]}>
          <Text variant="h3" color={colors.divine.aura}>
            {'\u{1F3AF}'}
          </Text>
          <Text variant="label" color={colors.divine.aura}>
            Micro Commitment
          </Text>
        </View>
        <Text
          variant="body"
          color={colors.text.primary}
          style={styles.commitmentText}
        >
          {`“${text}”`}
        </Text>
      </View>
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
            {'⚠️'}
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
  modernExample,
  reflectionPrompts,
  practiceName,
  practiceDuration,
  practiceInstructions,
  microCommitment,
  safetyNotes,
  accentColor = colors.primary[500],
}: StepContentSection): React.JSX.Element {
  let delayCounter = 0;
  const next = () => (delayCounter += 100);

  return (
    <View style={styles.container}>
      {/* CARD 1 — Verse (English + Sanskrit + Transliteration) */}
      {verseRef ? (
        <Animated.View entering={FadeInDown.delay(next()).duration(500)}>
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

      {/* CARD 2 — Teaching */}
      {teaching ? <TeachingSection text={teaching} delay={next()} /> : null}

      {/* CARD 3 — In Today's World (modern example + Gita implementation) */}
      {modernExample ? (
        <TodaysWorldSection
          example={modernExample}
          accentColor={accentColor}
          delay={next()}
        />
      ) : null}

      {/* CARD 4 — Reflection */}
      {reflectionPrompts && reflectionPrompts.length > 0 ? (
        <ReflectionSection prompts={reflectionPrompts} delay={next()} />
      ) : null}

      {/* CARD 5 — Practice */}
      {practiceInstructions && practiceInstructions.length > 0 ? (
        <PracticeSection
          name={practiceName}
          duration={practiceDuration}
          instructions={practiceInstructions}
          delay={next()}
        />
      ) : null}

      {/* CARD 6 — Micro Commitment */}
      {microCommitment ? (
        <MicroCommitmentSection text={microCommitment} delay={next()} />
      ) : null}

      {/* Optional safety note (after the six required cards). */}
      {safetyNotes ? <SafetySection text={safetyNotes} delay={next()} /> : null}

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
  commitmentBorder: {
    borderLeftColor: colors.divine.aura,
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

  // Today's World
  todaysWorldCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.alpha.whiteLight,
  },
  todaysWorldScenario: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
  todaysWorldManifestation: {
    lineHeight: 22,
  },
  todaysWorldDivider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  todaysWorldWisdom: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  todaysWorldAntidote: {
    lineHeight: 24,
  },
  verseChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: 1,
  },

  commitmentCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: `${colors.divine.aura}33`,
    backgroundColor: `${colors.divine.aura}0A`,
    padding: spacing.lg,
    gap: spacing.sm,
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
