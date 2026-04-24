/**
 * Journey Detail — the Shadripu battleground for a single enemy.
 *
 * Layout (top → bottom):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  ← Back                                 ⋯    │
 *   │                                              │
 *   │  JourneyHero — gradient + Sanskrit invocation│
 *   │                                              │
 *   │          DayProgressRing (100 px)            │
 *   │          "Day X of Y" ring arc               │
 *   ├──────────────────────────────────────────────┤
 *   │  TodaysStepCard                              │
 *   │  - Day badge                                 │
 *   │  - CormorantGaramond-Italic prompt           │
 *   │  - Gita wisdom quote                         │
 *   │  - SacredInput reflection                    │
 *   │  - DivineButton Submit Reflection            │
 *   ├──────────────────────────────────────────────┤
 *   │  All steps list (scrollable)                 │
 *   └──────────────────────────────────────────────┘
 *
 * Submit flow: `SubmitReflection` → CompletionCelebration overlay
 * (XP + karma from useCompleteWisdomStep), then the detail query
 * invalidates so the ring re-renders with the new day count.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  CompletionCelebration,
  DivineBackground,
  DivineButton,
  LoadingMandala,
} from '@kiaanverse/ui';
import {
  useCompleteWisdomStep,
  useWisdomJourneyDetail,
  type WisdomJourneyStep,
} from '@kiaanverse/api';
import { useJourneyStore } from '@kiaanverse/store';

import {
  DayProgressRing,
  JourneyHero,
  resolveRipu,
  TodaysStepCard,
} from '../../components/journey';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';

export default function JourneyDetailScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const journeyId = id ?? '';

  const { data, isLoading, error, refetch, isRefetching } =
    useWisdomJourneyDetail(journeyId);
  const { setActiveJourney } = useJourneyStore();
  const completeStep = useCompleteWisdomStep();

  const [reflection, setReflection] = useState('');
  const [celebration, setCelebration] = useState<{
    xp: number;
    karmaPoints: number;
    message: string;
  } | null>(null);

  // Sync active journey for navigation context.
  useEffect(() => {
    if (journeyId) setActiveJourney(journeyId);
    return () => setActiveJourney(null);
  }, [journeyId, setActiveJourney]);

  // Reset the draft when the displayed day changes.
  const currentDay = data?.currentDay ?? 1;
  useEffect(() => {
    setReflection('');
  }, [currentDay, journeyId]);

  const ripu = useMemo(() => {
    if (!data) return null;
    return resolveRipu({
      title: data.title,
      category: data.category,
      description: data.description,
    });
  }, [data]);

  const activeStep: WisdomJourneyStep | null = useMemo(() => {
    if (!data?.steps) return null;
    return data.steps.find((s) => s.dayIndex === currentDay) ?? null;
  }, [data, currentDay]);

  const handleSubmit = useCallback(() => {
    if (!journeyId || !activeStep) return;
    if (activeStep.isCompleted) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeStep.mutate(
      { journeyId, dayIndex: activeStep.dayIndex },
      {
        onSuccess: (result) => {
          setCelebration({
            xp: result.xp,
            karmaPoints: result.karmaPoints,
            message: result.journeyCompleted
              ? 'Journey complete — victory over the enemy within'
              : 'Reflection received. The ring grows.',
          });
          setReflection('');
        },
      }
    );
  }, [activeStep, completeStep, journeyId]);

  if (isLoading) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <View style={[styles.stateCenter, { paddingTop: insets.top + 24 }]}>
          <LoadingMandala size={80} />
          <Text style={styles.stateText}>Loading your journey…</Text>
        </View>
      </DivineBackground>
    );
  }

  if (error || !data) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <View style={[styles.stateCenter, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.stateError}>Unable to load journey</Text>
          <Text style={styles.stateText}>
            Please check your connection and try again.
          </Text>
          <DivineButton
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </DivineBackground>
    );
  }

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={GOLD}
          />
        }
      >
        {/* Top bar with back button on the gradient hero. */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
        </View>

        {/* Immersive hero */}
        <JourneyHero
          ripu={ripu}
          title={data.title}
          description={data.description}
        />

        {/* Progress ring + day counter */}
        <View style={styles.ringSection}>
          <DayProgressRing
            completed={data.completedSteps}
            total={data.durationDays}
            color={ripu?.color ?? GOLD}
            {...(ripu?.sanskrit ? { sanskrit: ripu.sanskrit } : {})}
            size={120}
          />
          <Text style={styles.xpCaption}>
            {data.earnedXp} / {data.totalXp} XP earned
          </Text>
        </View>

        {/* Today's step card */}
        {activeStep ? (
          <View style={styles.sectionWrap}>
            <TodaysStepCard
              dayIndex={activeStep.dayIndex}
              prompt={activeStep.title}
              quote={activeStep.content}
              verseRef={activeStep.verseRef}
              ripu={ripu}
              reflection={reflection}
              onChangeReflection={setReflection}
              onSubmit={handleSubmit}
              isSubmitting={completeStep.isPending}
              isCompleted={activeStep.isCompleted}
            />
          </View>
        ) : null}

        {/* Remaining steps list */}
        {data.steps.length > 0 ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>ALL STEPS</Text>
            <View style={styles.stepList}>
              {data.steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isCurrent={step.dayIndex === currentDay}
                  accent={ripu?.color ?? GOLD}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

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

function StepRow({
  step,
  isCurrent,
  accent,
}: {
  readonly step: WisdomJourneyStep;
  readonly isCurrent: boolean;
  readonly accent: string;
}): React.JSX.Element {
  const dot = step.isCompleted
    ? '#22c55e'
    : isCurrent
      ? accent
      : 'rgba(255,255,255,0.15)';
  return (
    <View
      style={[
        styles.stepRow,
        isCurrent && {
          borderColor: accent,
          backgroundColor: `${accent}12`,
        },
      ]}
    >
      <View
        style={[styles.dayBubble, { backgroundColor: dot }]}
        pointerEvents="none"
      >
        <Text style={styles.dayBubbleText}>
          {step.isCompleted ? '✓' : step.dayIndex}
        </Text>
      </View>
      <View style={styles.stepInfo}>
        <Text style={styles.stepTitle} numberOfLines={1}>
          {step.title}
        </Text>
        <Text style={styles.stepMeta} numberOfLines={1}>
          +{step.xpReward} XP · +{step.karmaReward} karma
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(17,20,53,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 20,
    color: GOLD,
    marginTop: -2,
  },
  ringSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    paddingHorizontal: 16,
  },
  xpCaption: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.6,
    paddingHorizontal: 4,
  },
  stepList: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.12)',
    backgroundColor: 'rgba(17,20,53,0.6)',
  },
  dayBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: SACRED_WHITE,
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: SACRED_WHITE,
  },
  stepMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  stateText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  stateError: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
  },
});
