/**
 * BreathingStep -- Sacred breathing exercise (Step 1 of Emotional Reset).
 *
 * Full-screen immersive layout with a large BreathingOrb (240px) at the absolute
 * center of the viewport, backed by a slow-spinning MandalaSpin. The phase label
 * ("Inhale...", "Hold...", etc.) floats above the orb and the countdown timer
 * sits below it.
 *
 * Phase-specific haptics create a somatic rhythm:
 *   - Inhale  = Light  (gentle expansion cue)
 *   - Hold    = Medium (firm stillness cue)
 *   - Exhale  = Heavy  (deep release cue)
 *   - Rest    = Light  (soft grounding cue)
 *
 * Performance: Countdown runs via Reanimated shared values on the UI thread.
 * Only phase and cycle changes trigger JS re-renders (every few seconds, not
 * every second).
 *
 * NO ScrollView -- everything fits within one viewport.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  BreathingOrb,
  MandalaSpin,
  colors,
  spacing,
} from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BreathingStepProps {
  readonly stepData: {
    inhaleDuration?: number;
    holdDuration?: number;
    exhaleDuration?: number;
    restDuration?: number;
    totalCycles?: number;
  } | null;
  readonly onNext: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Size of the BreathingOrb -- large enough to be the visual anchor. */
const ORB_SIZE = 240;

/** Size of the MandalaSpin behind the orb -- slightly larger for a halo effect. */
const MANDALA_SIZE = 320;

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe In...',
  hold: 'Hold...',
  exhale: 'Breathe Out...',
  rest: 'Rest...',
};

/**
 * Each breathing phase triggers a different haptic intensity so the user
 * can feel the rhythm even with eyes closed.
 */
const PHASE_HAPTICS: Record<Phase, Haptics.ImpactFeedbackStyle> = {
  inhale: Haptics.ImpactFeedbackStyle.Light,
  hold: Haptics.ImpactFeedbackStyle.Medium,
  exhale: Haptics.ImpactFeedbackStyle.Heavy,
  rest: Haptics.ImpactFeedbackStyle.Light,
};

/**
 * Animated TextInput used to display countdown on UI thread without JS re-renders.
 */
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BreathingStep({
  stepData,
  onNext,
}: BreathingStepProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const inhaleSec = stepData?.inhaleDuration ?? 4;
  const holdSec = stepData?.holdDuration ?? 7;
  const exhaleSec = stepData?.exhaleDuration ?? 8;
  const restSec = stepData?.restDuration ?? 2;
  const totalCycles = stepData?.totalCycles ?? 3;

  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isBreathing, setIsBreathing] = useState(true);

  // Countdown as shared value — updates on UI thread, no JS re-renders
  const countdownShared = useSharedValue(inhaleSec);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('inhale');
  const countdownRef = useRef(inhaleSec);
  const cycleRef = useRef(1);

  /** Clean up timer on unmount to prevent memory leaks. */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Handle cycle completion signalled by the BreathingOrb component. */
  const handleCycleComplete = useCallback(() => {
    if (cycleRef.current < totalCycles) {
      cycleRef.current += 1;
      setCycle(cycleRef.current);
    } else {
      setIsBreathing(false);
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [totalCycles]);

  /**
   * Start a breathing phase: set the label, reset the countdown,
   * fire the phase-specific haptic, and begin the 1-second tick.
   */
  const startPhase = useCallback(
    (p: Phase) => {
      phaseRef.current = p;
      setPhase(p);

      const durations: Record<Phase, number> = {
        inhale: inhaleSec,
        hold: holdSec,
        exhale: exhaleSec,
        rest: restSec,
      };

      const durationSec = durations[p];
      countdownRef.current = durationSec;
      // Update shared value on UI thread — no re-render
      countdownShared.value = durationSec;

      // Phase-specific haptic for somatic feedback
      Haptics.impactAsync(PHASE_HAPTICS[p]);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        countdownRef.current -= 1;
        // Update shared value only — no setState, no re-render
        countdownShared.value = Math.max(0, countdownRef.current);

        if (countdownRef.current <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          advancePhase();
        }
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inhaleSec, holdSec, exhaleSec, restSec, totalCycles]
  );

  /**
   * Move to the next phase in the inhale->hold->exhale->rest cycle.
   * After the rest phase, either start a new cycle or mark complete.
   */
  const advancePhase = useCallback(() => {
    const order: Phase[] = ['inhale', 'hold', 'exhale', 'rest'];
    const currentIdx = order.indexOf(phaseRef.current);
    const nextIdx = currentIdx + 1;

    const nextPhase = order[nextIdx];
    if (nextPhase !== undefined) {
      startPhase(nextPhase);
    } else {
      // End of one full cycle
      if (cycleRef.current < totalCycles) {
        cycleRef.current += 1;
        setCycle(cycleRef.current);
        startPhase('inhale');
      } else {
        setIsBreathing(false);
        setIsComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCycles, startPhase]);

  /** Kick off the first breathing cycle on mount. */
  useEffect(() => {
    startPhase('inhale');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive countdown text from shared value — runs on UI thread
  const countdownText = useDerivedValue(() => {
    if (isComplete) return '\u2714';
    const val = Math.round(countdownShared.value);
    return `${val}`;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reanimated text prop works at runtime but isn't typed
  const countdownAnimatedProps = useAnimatedProps(
    () =>
      ({
        text: countdownText.value,
      }) as any
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Title + cycle counter at top */}
      <View style={styles.header}>
        <Text variant="h2" color={colors.divine.aura} align="center">
          Sacred Breathing
        </Text>
        <Text
          variant="caption"
          color={colors.text.muted}
          align="center"
          style={styles.cycleText}
        >
          Cycle {cycle} of {totalCycles}
        </Text>
      </View>

      {/* Phase label ABOVE the orb */}
      <View style={styles.phaseLabelAbove}>
        <Animated.View entering={FadeIn.duration(300)} key={phase}>
          <Text variant="body" color={colors.text.secondary} align="center">
            {isComplete ? 'Breathing complete' : PHASE_LABELS[phase]}
          </Text>
        </Animated.View>
      </View>

      {/* Center piece: MandalaSpin behind BreathingOrb, both vertically centered */}
      <View style={styles.orbContainer}>
        <MandalaSpin
          size={MANDALA_SIZE}
          speed="slow"
          color={colors.alpha.goldLight}
          opacity={0.15}
        />
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <BreathingOrb
            pattern={{
              inhale: inhaleSec,
              holdIn: holdSec,
              exhale: exhaleSec,
              holdOut: restSec,
            }}
            isActive={isBreathing}
            size={ORB_SIZE}
            onCycleComplete={handleCycleComplete}
          />
        </View>
        {/* Countdown number overlaid on the orb center — UI-thread text updates */}
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <AnimatedTextInput
            editable={false}
            style={styles.countdownText}
            animatedProps={countdownAnimatedProps}
          />
        </View>
      </View>

      {/* Spacer pushes button to bottom */}
      <View style={styles.spacer} />

      {/* Continue button at bottom -- only after all cycles complete */}
      {isComplete ? (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <GoldenButton
            title="Continue"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNext();
            }}
            testID="breathing-continue-btn"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cycleText: {
    marginTop: spacing.xs,
  },
  phaseLabelAbove: {
    marginTop: spacing.lg,
    minHeight: 28,
    justifyContent: 'center',
  },
  orbContainer: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.text.primary,
    textAlign: 'center',
    padding: 0,
  },
  spacer: {
    flex: 1,
  },
});
