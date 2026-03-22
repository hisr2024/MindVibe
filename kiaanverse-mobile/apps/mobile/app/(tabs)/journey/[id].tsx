/**
 * Journey Detail Screen — Wisdom Journey step progression.
 *
 * Shows journey overview, step list (Lesson → Practice → Reflection → Quiz),
 * progress tracking, and completion celebration with XP/karma awards.
 *
 * Deep link: kiaanverse://journey/:id
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Dumbbell, PenLine, HelpCircle, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import {
  Screen,
  Text,
  GoldenHeader,
  GoldenProgressBar,
  CompletionCelebration,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import {
  useWisdomJourneyDetail,
  useCompleteWisdomStep,
  type WisdomJourneyStep,
  type JourneyStepType,
} from '@kiaanverse/api';
import { useJourneyStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Step type icons and labels
// ---------------------------------------------------------------------------

const STEP_TYPE_CONFIG: Record<JourneyStepType, { icon: typeof BookOpen; label: string; color: string }> = {
  lesson: { icon: BookOpen, label: 'Lesson', color: colors.primary[300] },
  practice: { icon: Dumbbell, label: 'Practice', color: colors.divine.saffron },
  reflection: { icon: PenLine, label: 'Reflection', color: colors.divine.peacock },
  quiz: { icon: HelpCircle, label: 'Quiz', color: colors.semantic.info },
};

// ---------------------------------------------------------------------------
// Step Card
// ---------------------------------------------------------------------------

function StepCard({
  step,
  index,
  isActive,
  onPress,
}: {
  step: WisdomJourneyStep;
  index: number;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const config = STEP_TYPE_CONFIG[step.type];
  const Icon = config.icon;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={onPress}
        disabled={step.isCompleted}
        accessibilityRole="button"
        accessibilityLabel={`${config.label}: ${step.title}${step.isCompleted ? ', completed' : ''}`}
      >
        <View
          style={[
            styles.stepCard,
            {
              backgroundColor: isActive ? colors.alpha.goldLight : c.card,
              borderColor: isActive ? colors.primary[500] : c.cardBorder,
            },
          ]}
        >
          <View style={styles.stepRow}>
            {/* Step type icon */}
            <View
              style={[
                styles.stepIcon,
                { backgroundColor: step.isCompleted ? colors.alpha.goldMedium : colors.alpha.whiteLight },
              ]}
            >
              {step.isCompleted ? (
                <CheckCircle2 size={18} color={colors.semantic.success} />
              ) : (
                <Icon size={18} color={config.color} />
              )}
            </View>

            {/* Step info */}
            <View style={styles.stepInfo}>
              <Text variant="caption" color={config.color}>{config.label}</Text>
              <Text
                variant="label"
                color={step.isCompleted ? c.textTertiary : c.textPrimary}
                numberOfLines={1}
              >
                {step.title}
              </Text>
              <Text variant="caption" color={c.textTertiary}>
                +{step.xpReward} XP · +{step.karmaReward} Karma
              </Text>
            </View>

            {/* Status */}
            {!step.isCompleted ? (
              <ChevronRight size={18} color={c.textTertiary} />
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Step Content View
// ---------------------------------------------------------------------------

function StepContentView({
  step,
  onComplete,
  isCompleting,
}: {
  step: WisdomJourneyStep;
  onComplete: () => void;
  isCompleting: boolean;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const config = STEP_TYPE_CONFIG[step.type];
  const Icon = config.icon;
  const router = useRouter();

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={[styles.contentCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        {/* Header */}
        <View style={styles.contentHeader}>
          <Icon size={20} color={config.color} />
          <Text variant="caption" color={config.color}>{config.label}</Text>
        </View>

        <Text variant="h3" color={c.textPrimary}>{step.title}</Text>

        {/* Content */}
        <Text variant="body" color={c.textSecondary} style={styles.contentText}>
          {step.content}
        </Text>

        {/* Verse reference */}
        {step.verseRef ? (
          <Pressable
            onPress={() => {
              const parts = step.verseRef?.split('.') ?? [];
              if (parts.length === 2) {
                router.push(`/(tabs)/verse/${parts[0]}/${parts[1]}`);
              }
            }}
            style={[styles.verseLink, { backgroundColor: colors.alpha.goldLight }]}
            accessibilityLabel={`Read Gita verse ${step.verseRef}`}
          >
            <BookOpen size={14} color={colors.primary[300]} />
            <Text variant="caption" color={colors.primary[300]}>
              Gita {step.verseRef}
            </Text>
          </Pressable>
        ) : null}

        {/* Reflection prompt */}
        {step.reflection ? (
          <View style={[styles.reflectionBox, { borderColor: c.cardBorder }]}>
            <PenLine size={14} color={c.textTertiary} />
            <Text variant="bodySmall" color={c.textSecondary} style={styles.reflectionText}>
              {step.reflection}
            </Text>
          </View>
        ) : null}

        {/* Complete button */}
        {!step.isCompleted ? (
          <Pressable
            onPress={onComplete}
            disabled={isCompleting}
            style={[styles.completeButton, { backgroundColor: colors.primary[500] }]}
            accessibilityRole="button"
            accessibilityLabel="Complete this step"
          >
            <Text variant="label" color={colors.primary[100]} align="center">
              {isCompleting ? 'Completing...' : 'Complete Step'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={16} color={colors.semantic.success} />
            <Text variant="caption" color={colors.semantic.success}>Completed</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function JourneyDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const journeyId = id ?? '';
  const { data, isLoading, error } = useWisdomJourneyDetail(journeyId);
  const completeStep = useCompleteWisdomStep();
  const { setActiveJourney } = useJourneyStore();

  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ xp: number; karmaPoints: number; message: string } | null>(null);

  // Set active journey for navigation context
  React.useEffect(() => {
    if (journeyId) setActiveJourney(journeyId);
    return () => setActiveJourney(null);
  }, [journeyId, setActiveJourney]);

  const steps = data?.steps;
  const activeStep = useMemo(() => {
    if (!activeStepId || !steps) return null;
    return steps.find((s) => s.id === activeStepId) ?? null;
  }, [activeStepId, steps]);

  const progress = useMemo(() => {
    if (!data) return 0;
    const total = data.steps.length;
    if (total === 0) return 0;
    return (data.completedSteps / total) * 100;
  }, [data]);

  const handleComplete = useCallback(() => {
    if (!activeStepId) return;

    const step = data?.steps.find((s) => s.id === activeStepId);
    const dayIndex = step?.dayIndex ?? data?.steps.indexOf(step!) ?? 0;

    completeStep.mutate(
      { journeyId, dayIndex },
      {
        onSuccess: (result) => {
          setCelebration({
            xp: result.xp,
            karmaPoints: result.karmaPoints,
            message: result.journeyCompleted
              ? 'Journey Complete!'
              : `${step?.title ?? 'Step'} Complete!`,
          });
          setActiveStepId(null);
        },
      },
    );
  }, [activeStepId, journeyId, completeStep, data?.steps]);

  // Loading state
  if (isLoading) {
    return (
      <Screen>
        <GoldenHeader title="Journey" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <LoadingMandala size={80} />
          <Text variant="bodySmall" color={c.textSecondary}>Loading journey...</Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Screen>
        <GoldenHeader title="Journey" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <Text variant="body" color={colors.semantic.error}>Unable to load journey</Text>
          <Text variant="bodySmall" color={c.textSecondary}>Please try again later</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <GoldenHeader title={data.title} onBack={() => router.back()} testID="journey-detail-header" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Journey overview */}
        <Animated.View entering={FadeInDown.duration(400)}>
          {/* Difficulty + Category badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.alpha.goldLight }]}>
              <Text variant="caption" color={colors.primary[300]}>
                {data.difficulty}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.alpha.whiteLight }]}>
              <Text variant="caption" color={c.textSecondary}>
                {data.category.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <Text variant="bodySmall" color={c.textSecondary} style={styles.description}>
            {data.description}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="caption" color={c.textSecondary}>
                {data.completedSteps}/{data.steps.length} steps
              </Text>
              <Text variant="caption" color={colors.primary[300]}>
                {data.earnedXp}/{data.totalXp} XP
              </Text>
            </View>
            <GoldenProgressBar progress={progress} height={8} />
          </View>
        </Animated.View>

        {/* Active step content */}
        {activeStep ? (
          <StepContentView
            step={activeStep}
            onComplete={handleComplete}
            isCompleting={completeStep.isPending}
          />
        ) : null}

        {/* Step list */}
        <Text variant="label" color={c.textSecondary} style={styles.stepsTitle}>
          Steps
        </Text>
        {data.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            isActive={activeStepId === step.id}
            onPress={() => setActiveStepId(step.id)}
          />
        ))}
      </ScrollView>

      {/* Celebration overlay */}
      {celebration ? (
        <CompletionCelebration
          visible
          xp={celebration.xp}
          karmaPoints={celebration.karmaPoints}
          message={celebration.message}
          onDismiss={() => setCelebration(null)}
        />
      ) : null}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },

  // Overview
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  description: {
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  progressSection: {
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Step card
  stepCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },

  // Content view
  contentCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contentText: {
    lineHeight: 24,
  },
  verseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  reflectionBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reflectionText: {
    flex: 1,
    fontStyle: 'italic',
  },
  completeButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },

  stepsTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
});
