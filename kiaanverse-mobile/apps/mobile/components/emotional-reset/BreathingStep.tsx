/**
 * BreathingStep — Sacred breathing exercise (Step 1 of Emotional Reset).
 *
 * Renders a large animated circle that expands on inhale and contracts on
 * exhale. The 4-7-8 pattern (inhale 4s, hold 7s, exhale 8s) is the default
 * but can be overridden by the API response. Color shifts convey each phase:
 *   - Gold on inhale (expansion, light entering)
 *   - Cyan on hold (stillness, clarity)
 *   - Blue on exhale (release, letting go)
 *   - Dim on rest (pause, grounding)
 *
 * After the configured number of cycles (default 3), a "Continue" button
 * appears to advance to the next step.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, BreathingOrb, MandalaSpin, colors, spacing, radii } from '@kiaanverse/ui';

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

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe In...',
  hold: 'Hold...',
  exhale: 'Breathe Out...',
  rest: 'Rest...',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BreathingStep({ stepData, onNext }: BreathingStepProps): React.JSX.Element {
  const inhaleSec = stepData?.inhaleDuration ?? 4;
  const holdSec = stepData?.holdDuration ?? 7;
  const exhaleSec = stepData?.exhaleDuration ?? 8;
  const restSec = stepData?.restDuration ?? 2;
  const totalCycles = stepData?.totalCycles ?? 3;

  const [phase, setPhase] = useState<Phase>('inhale');
  const [countdown, setCountdown] = useState(inhaleSec);
  const [cycle, setCycle] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isBreathing, setIsBreathing] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('inhale');
  const countdownRef = useRef(inhaleSec);
  const cycleRef = useRef(1);

  /** Clear any running timer on unmount. */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Handle cycle completion from the BreathingOrb component. */
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

  /** Drive the countdown timer display and phase labels. */
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
      setCountdown(durationSec);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Countdown tick
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        countdownRef.current -= 1;
        setCountdown(countdownRef.current);

        if (countdownRef.current <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          advancePhase();
        }
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inhaleSec, holdSec, exhaleSec, restSec, totalCycles],
  );

  /** Move to the next phase or cycle; mark complete after all cycles. */
  const advancePhase = useCallback(() => {
    const order: Phase[] = ['inhale', 'hold', 'exhale', 'rest'];
    const currentIdx = order.indexOf(phaseRef.current);
    const nextIdx = currentIdx + 1;

    if (nextIdx < order.length) {
      startPhase(order[nextIdx]);
    } else {
      // End of cycle — BreathingOrb handles the visual, we handle the label/countdown
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

  /** Kick off the first cycle on mount. */
  useEffect(() => {
    startPhase('inhale');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <Text variant="h2" color={colors.divine.aura} align="center">
        Sacred Breathing
      </Text>
      <Text variant="caption" color={colors.text.muted} align="center" style={styles.cycleText}>
        Cycle {cycle} of {totalCycles}
      </Text>

      {/* Sacred breathing orb with mandala background */}
      <View style={styles.orbContainer}>
        <MandalaSpin size={300} speed="slow" color={colors.alpha.goldLight} opacity={0.15} />
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <BreathingOrb
            pattern={{ inhale: inhaleSec, holdIn: holdSec, exhale: exhaleSec, holdOut: restSec }}
            isActive={isBreathing}
            size={200}
            onCycleComplete={handleCycleComplete}
          />
        </View>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text variant="h1" color={colors.text.primary} align="center">
            {isComplete ? '\u2714' : countdown}
          </Text>
        </View>
      </View>

      {/* Phase label */}
      <Text variant="body" color={colors.text.secondary} align="center" style={styles.phaseLabel}>
        {isComplete ? 'Breathing complete' : PHASE_LABELS[phase]}
      </Text>

      {/* Continue button — only after all cycles */}
      {isComplete ? (
        <GoldenButton
          title="Continue"
          onPress={onNext}
          style={styles.continueButton}
          testID="breathing-continue-btn"
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  cycleText: {
    marginBottom: spacing.lg,
  },
  orbContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    marginTop: spacing.md,
  },
  continueButton: {
    marginTop: spacing.xl,
    width: '80%',
  },
});
