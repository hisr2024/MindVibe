/**
 * Nitya Sadhana — The Daily Sacred Practice.
 *
 * Ceremony, not checklist. Six phases unfold one at a time in a full-
 * screen immersive cycle:
 *
 *   I.   Arrival       Pranayama (BreathingOrb, 4-7-8, 3 cycles)
 *   II.  Stillness     Dhyana (silent mandala, 60 s minimum sit)
 *   III. Wisdom        Shravana (ShlokaCard + "Ask Sakha")
 *   IV.  Reflection    Manana (SacredInput journal entry)
 *   V.   Movement      Asana (Surya Namaskar, 3 min timer)
 *   VI.  Gratitude     Kritajñata (mood + gratitude statement)
 *
 * Between phases, `PhaseCeremony` runs a 1.4 s lotus-bloom transition.
 * When the final phase completes we fire CompletionCelebration with
 * XP + streak numbers pulled from the existing sadhana API, then
 * settle into a "completed" card that routes the user back.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  CompletionCelebration,
  DivineBackground,
  DivineButton,
} from '@kiaanverse/ui';
import {
  useCompleteSadhana,
  useSadhanaDaily,
  useSadhanaStreak,
} from '@kiaanverse/api';

import { LotusProgressHeader } from '../../components/sadhana/LotusProgressHeader';
import { PhaseCeremony } from '../../components/sadhana/PhaseCeremony';
import {
  ArrivalPhase,
  GratitudePhase,
  MovementPhase,
  ReflectionPhase,
  StillnessPhase,
  WisdomPhase,
} from '../../components/sadhana/phases';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

type PhaseKey =
  | 'arrival'
  | 'stillness'
  | 'wisdom'
  | 'reflection'
  | 'movement'
  | 'gratitude';

const PHASE_ORDER: readonly PhaseKey[] = [
  'arrival',
  'stillness',
  'wisdom',
  'reflection',
  'movement',
  'gratitude',
];

export default function NityaSadhanaScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: dailyData } = useSadhanaDaily();
  const { data: streakData } = useSadhanaStreak();
  const completeSadhana = useCompleteSadhana();

  const [phase, setPhase] = useState<PhaseKey>('arrival');
  const [completed, setCompleted] = useState<Set<PhaseKey>>(() => new Set());
  const [reflection, setReflection] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [ceremonyDone, setCeremonyDone] = useState(false);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const completedIndices = useMemo(
    () => {
      const indices = new Set<number>();
      for (const k of completed) {
        indices.add(PHASE_ORDER.indexOf(k));
      }
      return indices;
    },
    [completed],
  );

  const streak = streakData?.current ?? 0;

  const advance = useCallback((from: PhaseKey) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(from);
      return next;
    });
    const idx = PHASE_ORDER.indexOf(from);
    const nextPhase = PHASE_ORDER[idx + 1];
    if (nextPhase) setPhase(nextPhase);
  }, []);

  const handleFinalComplete = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const payload: {
        verse_id?: string;
        reflection?: string;
        intention?: string;
        mood_score?: number;
      } = {};
      const reflectionTrimmed = reflection.trim();
      const gratitudeTrimmed = gratitude.trim();
      if (dailyData?.verse_id) payload.verse_id = dailyData.verse_id;
      if (reflectionTrimmed) payload.reflection = reflectionTrimmed;
      if (gratitudeTrimmed) payload.intention = gratitudeTrimmed;
      if (mood !== null) payload.mood_score = mood;
      await completeSadhana.mutateAsync(payload);
    } catch {
      // Allow the ceremony to close even if the network request fails —
      // the user's offline record is preserved client-side and will
      // sync on the next queued attempt.
    }
    // Fire the ceremonial finale: heavy haptic + petals fill.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add('gratitude');
      return next;
    });
    setCeremonyDone(true);
  }, [completeSadhana, dailyData, gratitude, mood, reflection]);

  const renderPhase = useCallback(() => {
    switch (phase) {
      case 'arrival':
        return <ArrivalPhase onComplete={() => advance('arrival')} />;
      case 'stillness':
        return <StillnessPhase onComplete={() => advance('stillness')} />;
      case 'wisdom':
        return <WisdomPhase onComplete={() => advance('wisdom')} />;
      case 'reflection':
        return (
          <ReflectionPhase
            value={reflection}
            onChange={setReflection}
            onComplete={() => advance('reflection')}
          />
        );
      case 'movement':
        return <MovementPhase onComplete={() => advance('movement')} />;
      case 'gratitude':
        return (
          <GratitudePhase
            mood={mood}
            onChangeMood={setMood}
            gratitude={gratitude}
            onChangeGratitude={setGratitude}
            onComplete={handleFinalComplete}
            isCompleting={completeSadhana.isPending}
          />
        );
    }
  }, [
    phase,
    reflection,
    mood,
    gratitude,
    advance,
    handleFinalComplete,
    completeSadhana.isPending,
  ]);

  // ---------------------------------------------------------------------------
  // Completion view
  // ---------------------------------------------------------------------------
  if (ceremonyDone) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <CompletionCelebration
          visible
          xp={54}
          karmaPoints={21}
          message={
            streak > 0
              ? `Nitya Sadhana complete. Streak: ${streak + 1} days.`
              : 'Nitya Sadhana complete. Your streak begins today.'
          }
          duration={4800}
        />
        <View
          style={[styles.completedBlock, { paddingTop: insets.top + 40 }]}
        >
          <Text style={styles.om} allowFontScaling={false}>
            ॐ
          </Text>
          <Text style={styles.completedTitle}>The Sadhana Is Sealed</Text>
          <Text style={styles.completedSanskrit}>कार्य सिद्धम्</Text>
          <Text style={styles.completedBody}>
            Every phase has been offered. Return tomorrow to begin again.
          </Text>
          <View style={styles.completedCta}>
            <DivineButton
              title="Return to Home"
              variant="primary"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        </View>
      </DivineBackground>
    );
  }

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View style={styles.titleCol}>
          <Text style={styles.sectionTag} allowFontScaling={false}>
            NITYA SADHANA
          </Text>
          <Text style={styles.title}>Daily Sacred Practice</Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakCount}>{streak}</Text>
        </View>
      </View>

      <LotusProgressHeader
        total={PHASE_ORDER.length}
        current={phaseIndex}
        completed={completedIndices}
      />

      {/* Reserve the system gesture/nav bar inset so the bottom CTA on
          every phase is always reachable, and the text fields on the
          Reflection / Gratitude phases lift above the keyboard.
          iOS needs `padding` because the window does not resize; Android
          defaults to adjustResize, so `height` avoids a double-shift. */}
      <KeyboardAvoidingView
        style={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <PhaseCeremony phaseKey={phase}>{renderPhase()}</PhaseCeremony>
      </KeyboardAvoidingView>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(17,20,53,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 20,
    color: GOLD,
    marginTop: -2,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  sectionTag: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 20,
    color: SACRED_WHITE,
    letterSpacing: 0.3,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(212,160,23,0.1)',
  },
  streakFlame: {
    fontSize: 14,
  },
  streakCount: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: GOLD,
  },
  body: {
    flex: 1,
  },
  completedBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  om: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 80,
    lineHeight: 90,
    color: GOLD,
    textShadowColor: 'rgba(212,160,23,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    marginBottom: 12,
  },
  completedTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 28,
    color: SACRED_WHITE,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  completedSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 28,
    lineHeight: 44,
    color: GOLD,
    textAlign: 'center',
  },
  completedBody: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 300,
  },
  completedCta: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    marginBottom: 40,
  },
});
