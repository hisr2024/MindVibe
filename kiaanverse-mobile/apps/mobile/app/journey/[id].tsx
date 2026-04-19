/**
 * Journey Detail Screen — Immersive 14-day wisdom journey experience.
 *
 * Full-screen sacred layout with DivineBackground, LotusProgress bloom,
 * horizontal DaySelector, active step preview, and bottom sheet actions
 * (pause/resume/abandon). Navigates to the step player for daily practice.
 *
 * Deep link: kiaanverse://journey/:id
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineBackground,
  GlowCard,
  GoldenProgressBar,
  LotusProgress,
  SacredDivider,
  SacredBottomSheet,
  CompletionCelebration,
  LoadingMandala,
  MandalaSpin,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  useWisdomJourneyDetail,
  type WisdomJourneyStep,
} from '@kiaanverse/api';
import { useJourneyStore } from '@kiaanverse/store';
import { DaySelector } from '../../components/journey/DaySelector';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Enemy colors mapped by journey category keyword for theming. */
const ENEMY_COLORS: Record<string, string> = {
  krodha: '#ef4444',
  bhaya: '#3b82f6',
  kama: '#f59e0b',
  moha: '#8b5cf6',
  mada: '#ec4899',
  matsarya: '#06b6d4',
};

/** Sanskrit names for the six inner enemies (shadripu). */
const ENEMY_SANSKRIT: Record<string, string> = {
  krodha: '\u0915\u094D\u0930\u094B\u0927',      // Anger
  bhaya: '\u092D\u092F',                          // Fear
  kama: '\u0915\u093E\u092E',                     // Desire
  moha: '\u092E\u094B\u0939',                     // Delusion
  mada: '\u092E\u0926',                           // Pride
  matsarya: '\u092E\u093E\u0924\u094D\u0938\u0930\u094D\u092F', // Jealousy
};

/** Status badge styling by journey status. */
interface StatusEntry {
  readonly label: string;
  readonly bgColor: string;
  readonly textColor: string;
}
const STATUS_DEFAULT: StatusEntry = {
  label: 'Available',
  bgColor: colors.alpha.whiteLight,
  textColor: colors.text.muted,
};
const STATUS_CONFIG: Record<string, StatusEntry> = {
  active: { label: 'Active', bgColor: `${colors.semantic.success}20`, textColor: colors.semantic.success },
  paused: { label: 'Paused', bgColor: `${colors.semantic.warning}20`, textColor: colors.semantic.warning },
  completed: { label: 'Completed', bgColor: colors.alpha.goldMedium, textColor: colors.divine.aura },
  abandoned: { label: 'Abandoned', bgColor: `${colors.semantic.error}20`, textColor: colors.semantic.error },
  available: STATUS_DEFAULT,
};

/** Day meta themes for 14-day journeys. */
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect the enemy keyword from the journey title or description.
 * Falls back to a default golden accent if no enemy keyword is found.
 */
function detectEnemyKey(title: string, description: string): string | null {
  const combined = `${title} ${description}`.toLowerCase();
  for (const key of Object.keys(ENEMY_COLORS)) {
    if (combined.includes(key)) return key;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Active Step Preview Card
// ---------------------------------------------------------------------------

function ActiveStepPreview({
  step,
  dayMeta,
  accentColor,
  onContinue,
}: {
  readonly step: WisdomJourneyStep;
  readonly dayMeta: { theme: string; focus: string } | undefined;
  readonly accentColor: string;
  readonly onContinue: () => void;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.delay(400).duration(500)}>
      <GlowCard variant="golden" style={styles.previewCard}>
        {/* Day theme */}
        {dayMeta ? (
          <View style={styles.previewThemeRow}>
            <View style={[styles.themeDot, { backgroundColor: accentColor }]} />
            <Text variant="caption" color={colors.text.muted}>
              {dayMeta.theme} — {dayMeta.focus}
            </Text>
          </View>
        ) : null}

        {/* Step title */}
        <Text variant="label" color={colors.text.primary} numberOfLines={2}>
          {step.title}
        </Text>

        {/* Rewards preview */}
        <View style={styles.rewardsRow}>
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

        {/* CTA button */}
        <GoldenButton
          title={step.isCompleted ? 'Review Today\u2019s Step' : 'Continue Today\u2019s Step'}
          variant="divine"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onContinue();
          }}
          testID="journey-continue-btn"
        />
      </GlowCard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Actions Bottom Sheet Content
// ---------------------------------------------------------------------------

function ActionSheetContent({
  status,
  onPause,
  onResume,
  onAbandon,
}: {
  readonly status: string;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onAbandon: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.sheetContent}>
      <Text variant="h3" color={colors.text.primary} align="center">
        Journey Actions
      </Text>
      <SacredDivider />

      {status === 'active' ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPause();
          }}
          style={styles.sheetAction}
          accessibilityRole="button"
          accessibilityLabel="Pause journey"
        >
          <Text variant="body" color={colors.semantic.warning}>
            {'\u23F8\uFE0F'}  Pause Journey
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            Take a break. Your progress is safe.
          </Text>
        </Pressable>
      ) : status === 'paused' ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onResume();
          }}
          style={styles.sheetAction}
          accessibilityRole="button"
          accessibilityLabel="Resume journey"
        >
          <Text variant="body" color={colors.semantic.success}>
            {'\u25B6\uFE0F'}  Resume Journey
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            Welcome back. Continue where you left off.
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onAbandon();
        }}
        style={styles.sheetAction}
        accessibilityRole="button"
        accessibilityLabel="Abandon journey"
      >
        <Text variant="body" color={colors.semantic.error}>
          {'\u{1F6D1}'}  Abandon Journey
        </Text>
        <Text variant="caption" color={colors.text.muted}>
          This journey will be archived. You can always restart.
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function JourneyDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const journeyId = id ?? '';
  const { data, isLoading, error, refetch, isRefetching } = useWisdomJourneyDetail(journeyId);
  const { setActiveJourney } = useJourneyStore();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [celebration, setCelebration] = useState<{
    xp: number;
    karmaPoints: number;
    message: string;
  } | null>(null);

  // Set active journey for navigation context
  React.useEffect(() => {
    if (journeyId) setActiveJourney(journeyId);
    return () => setActiveJourney(null);
  }, [journeyId, setActiveJourney]);

  // Derive computed values from journey data
  const enemyKey = useMemo(() => {
    if (!data) return null;
    return detectEnemyKey(data.title, data.description);
  }, [data]);

  const accentColor = enemyKey ? ENEMY_COLORS[enemyKey] ?? colors.primary[500] : colors.primary[500];

  const progress = useMemo(() => {
    if (!data) return 0;
    const total = data.durationDays;
    if (total === 0) return 0;
    return (data.completedSteps / total) * 100;
  }, [data]);

  const completedDays = useMemo(() => {
    if (!data?.steps) return new Set<number>();
    return new Set(
      data.steps.filter((s) => s.isCompleted).map((s) => s.dayIndex),
    );
  }, [data]);

  const currentDay = data?.currentDay ?? 1;
  const effectiveSelectedDay = selectedDay ?? currentDay;

  const activeStep = useMemo(() => {
    if (!data?.steps) return null;
    return data.steps.find((s) => s.dayIndex === effectiveSelectedDay) ?? null;
  }, [data, effectiveSelectedDay]);

  const statusConfig: StatusEntry = STATUS_CONFIG[data?.status ?? 'available'] ?? STATUS_DEFAULT;

  // Handlers
  const handleDaySelect = useCallback((day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(day);
  }, []);

  const handleContinueStep = useCallback(() => {
    router.push({
      pathname: '/journey/step/[day]',
      params: { day: String(effectiveSelectedDay), journeyId },
    });
  }, [router, effectiveSelectedDay, journeyId]);

  const handlePause = useCallback(() => {
    setShowActions(false);
    // TODO: Integrate pause mutation when API is available
  }, []);

  const handleResume = useCallback(() => {
    setShowActions(false);
    // TODO: Integrate resume mutation when API is available
  }, []);

  const handleAbandon = useCallback(() => {
    setShowActions(false);
    // TODO: Integrate abandon mutation with confirmation dialog
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <DivineBackground variant="sacred" style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.centerState}>
          <LoadingMandala size={80} />
          <Text variant="bodySmall" color={colors.text.muted}>
            Loading your journey...
          </Text>
        </View>
      </DivineBackground>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <DivineBackground variant="sacred" style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.centerState}>
          <Text variant="body" color={colors.semantic.error}>
            Unable to load journey
          </Text>
          <Text variant="bodySmall" color={colors.text.muted}>
            Please check your connection and try again
          </Text>
          <GoldenButton
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </DivineBackground>
    );
  }

  return (
    <DivineBackground variant="sacred" style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary[300]} />
        }
      >
        {/* ---------- Sacred Header ---------- */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
          {/* Back + Actions row */}
          <View style={styles.topRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text variant="label" color={colors.text.secondary}>
                {'\u2190'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowActions(true);
              }}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="Journey actions"
            >
              <Text variant="label" color={colors.text.secondary}>
                {'\u22EF'}
              </Text>
            </Pressable>
          </View>

          {/* Enemy indicator + Sanskrit name */}
          {enemyKey ? (
            <View style={styles.enemyRow}>
              <View style={[styles.enemyDot, { backgroundColor: accentColor }]} />
              <Text variant="caption" color={colors.text.muted}>
                {ENEMY_SANSKRIT[enemyKey] ?? enemyKey}
              </Text>
            </View>
          ) : null}

          {/* Journey title */}
          <Text variant="h2" color={colors.divine.aura} style={styles.title}>
            {data.title}
          </Text>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text variant="caption" color={statusConfig.textColor}>
              {statusConfig.label}
            </Text>
          </View>

          {/* Description */}
          <Text variant="bodySmall" color={colors.text.secondary} style={styles.description}>
            {data.description}
          </Text>
        </Animated.View>

        {/* ---------- Lotus Progress ---------- */}
        <Animated.View entering={ZoomIn.delay(200).duration(600)} style={styles.lotusSection}>
          <LotusProgress
            progress={progress / 100}
            size={120}
            petalColor={accentColor}
          />
          <Text variant="label" color={colors.text.primary}>
            Day {currentDay} of {data.durationDays}
          </Text>
          <Text variant="caption" color={colors.primary[300]}>
            {Math.round(progress)}% Complete
          </Text>
          <GoldenProgressBar
            progress={progress}
            height={8}
          />
          <View style={styles.xpRow}>
            <Text variant="caption" color={colors.text.muted}>
              {data.earnedXp}/{data.totalXp} XP earned
            </Text>
          </View>
        </Animated.View>

        <SacredDivider />

        {/* ---------- Day Selector ---------- */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text variant="label" color={colors.text.secondary} style={styles.sectionLabel}>
            Journey Days
          </Text>
        </Animated.View>

        <DaySelector
          totalDays={data.durationDays}
          currentDay={effectiveSelectedDay}
          completedDays={completedDays}
          onSelectDay={handleDaySelect}
          accentColor={accentColor}
        />

        {/* ---------- Selected Day Info ---------- */}
        {effectiveSelectedDay && DAY_META[effectiveSelectedDay] ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.dayInfoRow}>
            <Text variant="caption" color={accentColor}>
              Day {effectiveSelectedDay}
            </Text>
            <Text variant="caption" color={colors.text.muted}>
              {'\u00B7'}
            </Text>
            <Text variant="caption" color={colors.text.secondary}>
              {DAY_META[effectiveSelectedDay]?.theme} — {DAY_META[effectiveSelectedDay]?.focus}
            </Text>
          </Animated.View>
        ) : null}

        <SacredDivider />

        {/* ---------- Active Step Preview ---------- */}
        {activeStep ? (
          <>
            <Text variant="label" color={colors.text.secondary} style={styles.sectionLabel}>
              {activeStep.isCompleted ? 'Completed Step' : "Today's Step"}
            </Text>
            <ActiveStepPreview
              step={activeStep}
              dayMeta={DAY_META[effectiveSelectedDay]}
              accentColor={accentColor}
              onContinue={handleContinueStep}
            />
          </>
        ) : (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.noStepCard}>
            <MandalaSpin size={60} color={colors.alpha.goldLight} speed="slow" />
            <Text variant="body" color={colors.text.secondary} align="center">
              No step available for this day yet
            </Text>
            <Text variant="caption" color={colors.text.muted} align="center">
              Continue your journey one day at a time
            </Text>
          </Animated.View>
        )}

        {/* ---------- Step List (all days) ---------- */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text variant="label" color={colors.text.secondary} style={styles.sectionLabel}>
            All Steps
          </Text>
          {data.steps.map((step, index) => {
            const isSelected = step.dayIndex === effectiveSelectedDay;
            const dayInfo = DAY_META[step.dayIndex];
            return (
              <Animated.View
                key={step.id}
                entering={FadeInDown.delay(500 + index * 40).duration(300)}
              >
                <Pressable
                  onPress={() => {
                    handleDaySelect(step.dayIndex);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${step.dayIndex}: ${step.title}${step.isCompleted ? ', completed' : ''}`}
                >
                  <View
                    style={[
                      styles.stepListItem,
                      {
                        backgroundColor: isSelected ? `${accentColor}15` : 'transparent',
                        borderColor: isSelected ? accentColor : colors.alpha.whiteLight,
                      },
                    ]}
                  >
                    {/* Day number circle */}
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: step.isCompleted
                            ? colors.semantic.success
                            : step.dayIndex === currentDay
                              ? accentColor
                              : colors.alpha.whiteLight,
                        },
                      ]}
                    >
                      {step.isCompleted ? (
                        <Text variant="caption" color={colors.raw.white}>
                          {'\u2713'}
                        </Text>
                      ) : (
                        <Text
                          variant="caption"
                          color={step.dayIndex === currentDay ? colors.raw.white : colors.text.muted}
                        >
                          {step.dayIndex}
                        </Text>
                      )}
                    </View>

                    {/* Step info */}
                    <View style={styles.stepListInfo}>
                      <Text
                        variant="label"
                        color={step.isCompleted ? colors.text.muted : colors.text.primary}
                        numberOfLines={1}
                      >
                        {step.title}
                      </Text>
                      <Text variant="caption" color={colors.text.muted}>
                        {dayInfo ? `${dayInfo.theme} \u00B7 ` : ''}+{step.xpReward} XP
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* ---------- Actions Bottom Sheet ---------- */}
      <SacredBottomSheet
        isVisible={showActions}
        onClose={() => setShowActions(false)}
        snapPoints={[320]}
      >
        <ActionSheetContent
          status={data.status}
          onPause={handlePause}
          onResume={handleResume}
          onAbandon={handleAbandon}
        />
      </SacredBottomSheet>

      {/* ---------- Celebration Overlay ---------- */}
      {celebration ? (
        <CompletionCelebration
          visible
          xp={celebration.xp}
          karmaPoints={celebration.karmaPoints}
          message={celebration.message}
          onDismiss={() => setCelebration(null)}
        />
      ) : null}
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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

  // Header
  headerSection: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.alpha.whiteLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.alpha.whiteLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  enemyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    lineHeight: 36,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  description: {
    lineHeight: 22,
  },

  // Lotus + progress
  lotusSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  // Day info
  dayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },

  // Section labels
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },

  // Active step preview
  previewCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  previewThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // No step
  noStepCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },

  // Step list
  stepListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepListInfo: {
    flex: 1,
    gap: 2,
  },

  // Bottom sheet
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetAction: {
    gap: spacing.xxs,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.alpha.whiteLight,
  },
});
