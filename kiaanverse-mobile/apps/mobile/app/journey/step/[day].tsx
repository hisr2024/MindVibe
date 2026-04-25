/**
 * Step Player Screen — Immersive daily journey experience.
 *
 * Full-screen guided step player for a single day within a 14-day
 * wisdom journey. Renders the sacred verse, teaching, reflection
 * prompts, practice instructions, micro-commitment, and a completion
 * area with optional reflection textarea. Themed to the journey's
 * enemy color.
 *
 * Route params:
 *   day       — Day index (1-indexed)
 *   journeyId — Parent journey identifier
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineGradient,
  GlowCard,
  SacredStepIndicator,
  SacredDivider,
  MandalaSpin,
  ConfettiCannon,
  CompletionCelebration,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  useWisdomJourneyDetail,
  useCompleteWisdomStep,
  type WisdomJourneyStep,
} from '@kiaanverse/api';
import { useJourneyStore } from '@kiaanverse/store';
import { StepContent } from '../../../components/journey/StepContent';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_REFLECTION_LENGTH = 5000;

/**
 * Enemy colors for journey theming.
 * Keys match the backend's `EnemyType` enum (six shadripu) — kama, krodha,
 * lobha, moha, mada, matsarya. Bhaya (fear) is NOT one of the shadripu.
 */
const ENEMY_COLORS: Record<string, string> = {
  kama: '#f59e0b',
  krodha: '#ef4444',
  lobha: '#10b981',
  moha: '#8b5cf6',
  mada: '#ec4899',
  matsarya: '#06b6d4',
};

/** Day meta themes for the 14-day journey arc. */
const DAY_META: Record<number, { theme: string; focus: string }> = {
  1: { theme: 'Awareness', focus: 'Recognizing Patterns' },
  2: { theme: 'Understanding', focus: 'Root Causes' },
  3: { theme: 'Acceptance', focus: 'Embracing Truth' },
  4: { theme: 'Release', focus: 'Letting Go' },
  5: { theme: 'Detachment', focus: 'Freedom from Attachment' },
  6: { theme: 'Compassion', focus: 'Self-Kindness' },
  7: { theme: 'Courage', focus: 'Building Inner Strength' },
  8: { theme: 'Wisdom', focus: 'Gita Principles' },
  9: { theme: 'Practice', focus: 'Daily Discipline' },
  10: { theme: 'Patience', focus: 'Trust the Process' },
  11: { theme: 'Transformation', focus: 'Inner Alchemy' },
  12: { theme: 'Integration', focus: 'Living the Wisdom' },
  13: { theme: 'Gratitude', focus: 'Celebrating Growth' },
  14: { theme: 'Completion', focus: 'New Beginning' },
};

/**
 * DivineGradient variant mapped from enemy keywords.
 * Falls back to 'divine' if no mapping exists.
 */
const ENEMY_GRADIENT_VARIANT: Record<string, string> = {
  kama: 'renewal',
  krodha: 'release',
  lobha: 'healing',
  moha: 'healing',
  mada: 'divine',
  matsarya: 'peace',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectEnemyKey(title: string, description: string): string | null {
  const combined = `${title} ${description}`.toLowerCase();
  for (const key of Object.keys(ENEMY_COLORS)) {
    if (combined.includes(key)) return key;
  }
  return null;
}

/**
 * Parse step content into structured sections.
 *
 * Modern backend deployments expose every section as a typed field on
 * `WisdomJourneyStep` (verse fields, reflectionPrompts, practice block,
 * microCommitment, safetyNote, modernExample). This parser:
 *
 *   1. Prefers the structured fields when present.
 *   2. Falls back to markdown-style headers embedded in `content` so legacy
 *      seed data and offline cache rows still render the 6 cards.
 */
function parseStepSections(step: WisdomJourneyStep) {
  const content = step.content ?? '';

  // Split content into sections by markdown-style headers (legacy fallback).
  const sections: Record<string, string> = {};
  let currentKey = 'teaching';
  const lines = content.split('\n');
  const buffer: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##?\s*(.+)/);
    if (headerMatch) {
      if (buffer.length > 0) {
        sections[currentKey] = buffer.join('\n').trim();
        buffer.length = 0;
      }
      currentKey = headerMatch[1]?.toLowerCase().trim() ?? 'teaching';
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length > 0) {
    sections[currentKey] = buffer.join('\n').trim();
  }

  // Reflection prompts — prefer the structured array, then the joined
  // legacy `reflection` string, then the markdown header fallback.
  let reflectionPrompts: string[] | undefined;
  if (step.reflectionPrompts && step.reflectionPrompts.length > 0) {
    reflectionPrompts = step.reflectionPrompts;
  } else {
    const reflectionText =
      step.reflection ??
      sections['reflection'] ??
      sections['guided reflection'] ??
      '';
    const parsed = reflectionText
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    if (parsed.length > 0) reflectionPrompts = parsed;
  }

  // Practice instructions — prefer structured block, then header fallback.
  let practiceInstructions: string[] | undefined;
  let practiceName: string | undefined;
  let practiceDuration: string | undefined;
  if (step.practice && step.practice.instructions.length > 0) {
    practiceInstructions = step.practice.instructions;
    practiceName = step.practice.name;
    if (typeof step.practice.durationMinutes === 'number') {
      practiceDuration = `${step.practice.durationMinutes} min`;
    }
  } else {
    const practiceText =
      sections['practice'] ?? sections["today's practice"] ?? '';
    const parsed = practiceText
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    if (parsed.length > 0) practiceInstructions = parsed;
  }

  return {
    teaching: sections['teaching'] ?? content,
    reflectionPrompts,
    practiceInstructions,
    practiceName,
    practiceDuration,
    microCommitment:
      step.microCommitment ??
      sections['micro-commitment'] ??
      sections['commitment'] ??
      undefined,
    safetyNotes:
      step.safetyNote ??
      sections['safety'] ??
      sections['safety notes'] ??
      sections['note'] ??
      undefined,
  };
}

// ---------------------------------------------------------------------------
// Completion Area
// ---------------------------------------------------------------------------

function CompletionArea({
  step,
  isCompleted,
  isAvailable,
  isCompleting,
  reflectionText,
  onReflectionChange,
  onComplete,
  accentColor,
  showReflection,
  onToggleReflection,
}: {
  readonly step: WisdomJourneyStep;
  readonly isCompleted: boolean;
  readonly isAvailable: boolean;
  readonly isCompleting: boolean;
  readonly reflectionText: string;
  readonly onReflectionChange: (text: string) => void;
  readonly onComplete: () => void;
  readonly accentColor: string;
  readonly showReflection: boolean;
  readonly onToggleReflection: () => void;
}): React.JSX.Element {
  if (isCompleted) {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.completionArea}
      >
        <GlowCard variant="golden" style={styles.completedCard}>
          <Text variant="h3" color={colors.semantic.success} align="center">
            {'\u2705'} Step Completed
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            You have completed this day&apos;s practice. Well done.
          </Text>
        </GlowCard>
      </Animated.View>
    );
  }

  if (!isAvailable) {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.completionArea}
      >
        <View style={styles.lockedCard}>
          <MandalaSpin size={48} color={colors.alpha.goldLight} speed="slow" />
          <Text variant="body" color={colors.text.secondary} align="center">
            This step will be available tomorrow
          </Text>
          <Text variant="caption" color={colors.text.muted} align="center">
            Rest now. Each day brings new wisdom.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(400)}
      style={styles.completionArea}
    >
      {/* "Add Reflection (Optional)" toggle — mirrors the web design.
          Tapping reveals the textarea; tapping again collapses it. */}
      <Pressable
        onPress={onToggleReflection}
        style={[
          styles.reflectionToggle,
          {
            borderColor: showReflection
              ? `${accentColor}66`
              : colors.alpha.whiteLight,
            backgroundColor: showReflection
              ? `${accentColor}14`
              : colors.alpha.whiteLight,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          showReflection ? 'Hide reflection input' : 'Add a reflection'
        }
        testID="add-reflection-toggle"
      >
        <Text
          variant="label"
          color={showReflection ? accentColor : colors.text.secondary}
          align="center"
        >
          {showReflection ? 'Hide Reflection' : 'Add Reflection (Optional)'}
        </Text>
      </Pressable>

      {showReflection ? (
        <>
          <TextInput
            style={[
              styles.reflectionInput,
              {
                borderColor:
                  reflectionText.length > 0
                    ? accentColor
                    : colors.alpha.whiteLight,
              },
            ]}
            value={reflectionText}
            onChangeText={onReflectionChange}
            placeholder="What stirs in you after this practice?"
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={MAX_REFLECTION_LENGTH}
            textAlignVertical="top"
            accessibilityLabel="Reflection textarea"
          />
          <Text
            variant="caption"
            color={colors.text.muted}
            style={styles.charCount}
          >
            {reflectionText.length}/{MAX_REFLECTION_LENGTH}
          </Text>
        </>
      ) : null}

      {/* Complete button */}
      <GoldenButton
        title={isCompleting ? 'Completing...' : "Complete Today's Step"}
        variant="divine"
        onPress={onComplete}
        loading={isCompleting}
        disabled={isCompleting}
        testID="complete-step-btn"
      />

      {/* Rewards preview */}
      <View style={styles.rewardPreview}>
        <Text variant="caption" color={colors.primary[300]}>
          +{step.xpReward} XP
        </Text>
        <Text variant="caption" color={colors.text.muted}>
          {'\u00B7'}
        </Text>
        <Text variant="caption" color={colors.primary[300]}>
          +{step.karmaReward} Karma
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StepPlayerScreen(): React.JSX.Element {
  const { day, journeyId } = useLocalSearchParams<{
    day: string;
    journeyId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const dayIndex = parseInt(day ?? '1', 10);
  const jId = journeyId ?? '';

  const { data, isLoading, error } = useWisdomJourneyDetail(jId);
  const completeStep = useCompleteWisdomStep();
  const { updateJourneyProgress } = useJourneyStore();

  const [reflectionText, setReflectionText] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebration, setCelebration] = useState<{
    xp: number;
    karmaPoints: number;
    message: string;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Derive values
  const enemyKey = useMemo(() => {
    if (!data) return null;
    return detectEnemyKey(data.title, data.description);
  }, [data]);

  const accentColor = enemyKey
    ? (ENEMY_COLORS[enemyKey] ?? colors.primary[500])
    : colors.primary[500];
  const gradientVariant = (
    enemyKey ? ENEMY_GRADIENT_VARIANT[enemyKey] : 'divine'
  ) as 'divine' | 'peace' | 'healing' | 'release' | 'renewal';

  const currentStep = useMemo(() => {
    if (!data?.steps) return null;
    return data.steps.find((s) => s.dayIndex === dayIndex) ?? null;
  }, [data, dayIndex]);

  const isCompleted = currentStep?.isCompleted ?? false;
  const isAvailable = dayIndex <= (data?.currentDay ?? 0);

  const completedStepIndices = useMemo(() => {
    if (!data?.steps) return [];
    return data.steps.filter((s) => s.isCompleted).map((s) => s.dayIndex - 1); // SacredStepIndicator uses 0-indexed
  }, [data]);

  const dayMeta = DAY_META[dayIndex];

  const parsedSections = useMemo(() => {
    if (!currentStep) return null;
    return parseStepSections(currentStep);
  }, [currentStep]);

  // Handlers
  const handleComplete = useCallback(() => {
    if (!currentStep || isCompleted) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    completeStep.mutate(
      { journeyId: jId, dayIndex },
      {
        onSuccess: (result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowConfetti(true);
          setCelebration({
            xp: result.xp,
            karmaPoints: result.karmaPoints,
            message: result.journeyCompleted
              ? 'Journey Complete! Namaste.'
              : `Day ${dayIndex} Complete!`,
          });

          // Update local progress
          updateJourneyProgress(jId, {
            currentDay: dayIndex + 1,
            completedSteps: (data?.completedSteps ?? 0) + 1,
            lastActivityAt: new Date().toISOString(),
          });

          // Scroll to top to see celebration
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        },
      }
    );
  }, [
    currentStep,
    isCompleted,
    jId,
    dayIndex,
    completeStep,
    data,
    updateJourneyProgress,
  ]);

  // Loading state
  if (isLoading || !data) {
    return (
      <DivineGradient
        variant="divine"
        style={{ flex: 1, paddingTop: insets.top }}
      >
        <View style={styles.centerState}>
          <LoadingMandala size={80} />
          <Text variant="bodySmall" color={colors.text.muted}>
            Preparing your practice...
          </Text>
        </View>
      </DivineGradient>
    );
  }

  // Error state
  if (error || !currentStep) {
    return (
      <DivineGradient
        variant="divine"
        style={{ flex: 1, paddingTop: insets.top }}
      >
        <View style={styles.centerState}>
          <Text variant="body" color={colors.semantic.error}>
            {currentStep === null
              ? 'Step not found for this day'
              : 'Unable to load step'}
          </Text>
          <Text variant="bodySmall" color={colors.text.muted}>
            Please go back and try again
          </Text>
          <GoldenButton
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </DivineGradient>
    );
  }

  return (
    <DivineGradient variant={gradientVariant} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.xxxl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------- Top Navigation ---------- */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.topNav}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.navBackButton}
              accessibilityRole="button"
              accessibilityLabel="Go back to journey"
            >
              <Text variant="label" color={colors.text.secondary}>
                {'\u2190'}
              </Text>
            </Pressable>

            <View style={styles.dayIndicator}>
              <Text variant="label" color={colors.divine.aura}>
                Day {dayIndex} of {data.durationDays}
              </Text>
              {dayMeta ? (
                <Text variant="caption" color={colors.text.muted}>
                  {dayMeta.theme}
                </Text>
              ) : null}
            </View>

            {/* Spacer for centering */}
            <View style={styles.navSpacer} />
          </Animated.View>

          {/* ---------- Step Progress Indicator ---------- */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <SacredStepIndicator
              totalSteps={data.durationDays}
              currentStep={dayIndex - 1}
              completedSteps={completedStepIndices}
              style={styles.stepIndicator}
            />
          </Animated.View>

          {/* ---------- Step Title ---------- */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.titleSection}
          >
            <Text variant="h2" color={colors.divine.aura} align="center">
              {currentStep.title}
            </Text>
            {dayMeta ? (
              <Text
                variant="bodySmall"
                color={colors.text.muted}
                align="center"
              >
                {dayMeta.focus}
              </Text>
            ) : null}
          </Animated.View>

          <SacredDivider />

          {/* ---------- Step Content Sections (canonical 6 cards) ---------- */}
          {parsedSections ? (
            <StepContent
              teaching={parsedSections.teaching}
              verseRef={currentStep.verseRef}
              sanskrit={currentStep.verseSanskrit}
              transliteration={currentStep.verseTransliteration}
              englishTranslation={currentStep.verseTranslation}
              hindiTranslation={currentStep.verseHindi}
              modernExample={currentStep.modernExample}
              reflectionPrompts={parsedSections.reflectionPrompts}
              practiceName={parsedSections.practiceName}
              practiceDuration={parsedSections.practiceDuration}
              practiceInstructions={parsedSections.practiceInstructions}
              microCommitment={parsedSections.microCommitment}
              safetyNotes={parsedSections.safetyNotes}
              accentColor={accentColor}
            />
          ) : (
            /* Fallback: render raw content */
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <GlowCard variant="divine" style={styles.rawContentCard}>
                <Text
                  variant="body"
                  color={colors.text.primary}
                  style={styles.rawContentText}
                >
                  {currentStep.content}
                </Text>
              </GlowCard>
            </Animated.View>
          )}

          {/* ---------- Completion Area ---------- */}
          <CompletionArea
            step={currentStep}
            isCompleted={isCompleted}
            isAvailable={isAvailable}
            isCompleting={completeStep.isPending}
            reflectionText={reflectionText}
            onReflectionChange={setReflectionText}
            onComplete={handleComplete}
            accentColor={accentColor}
            showReflection={showReflection}
            onToggleReflection={() => {
              Haptics.selectionAsync();
              setShowReflection((s) => !s);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- Confetti ---------- */}
      <View style={styles.confettiContainer} pointerEvents="none">
        <ConfettiCannon
          isActive={showConfetti}
          particleCount={80}
          onComplete={() => setShowConfetti(false)}
        />
      </View>

      {/* ---------- Celebration Overlay ---------- */}
      {celebration ? (
        <CompletionCelebration
          visible
          xp={celebration.xp}
          karmaPoints={celebration.karmaPoints}
          message={celebration.message}
          onDismiss={() => {
            setCelebration(null);
            setShowConfetti(false);
          }}
        />
      ) : null}
    </DivineGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // Top navigation
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.alpha.whiteLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicator: {
    alignItems: 'center',
    gap: 2,
  },
  navSpacer: {
    width: 40,
  },

  // Step indicator
  stepIndicator: {
    marginVertical: spacing.sm,
  },

  // Title section
  titleSection: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },

  // Raw content fallback
  rawContentCard: {
    padding: spacing.lg,
  },
  rawContentText: {
    lineHeight: 24,
  },

  // Completion area
  completionArea: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  completedCard: {
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  lockedCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  reflectionToggle: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionInput: {
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 120,
    maxHeight: 240,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
  },
  charCount: {
    alignSelf: 'flex-end',
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
