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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, colors, spacing, radii } from '@kiaanverse/ui';

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

const CIRCLE_SIZE = Dimensions.get('window').width * 0.55;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.0;

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe In...',
  hold: 'Hold...',
  exhale: 'Breathe Out...',
  rest: 'Rest...',
};

const PHASE_COLORS: Record<Phase, string> = {
  inhale: '#D4A843',
  hold: '#4ECDC4',
  exhale: '#3B7DD8',
  rest: '#2C3E50',
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

  const scale = useSharedValue(MIN_SCALE);
  const colorProgress = useSharedValue(0);
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

  /** Drive the breathing animation and countdown timer. */
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

      // Animate circle scale based on phase
      if (p === 'inhale') {
        scale.value = withTiming(MAX_SCALE, {
          duration: durationSec * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        colorProgress.value = withTiming(0, { duration: 300 });
      } else if (p === 'hold') {
        colorProgress.value = withTiming(1, { duration: 300 });
      } else if (p === 'exhale') {
        scale.value = withTiming(MIN_SCALE, {
          duration: durationSec * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        colorProgress.value = withTiming(2, { duration: 300 });
      } else {
        colorProgress.value = withTiming(3, { duration: 300 });
      }

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
      // End of cycle
      if (cycleRef.current < totalCycles) {
        cycleRef.current += 1;
        setCycle(cycleRef.current);
        startPhase('inhale');
      } else {
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
  // Animated styles
  // ---------------------------------------------------------------------------

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: PHASE_COLORS[phaseRef.current],
  }));

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

      {/* Breathing circle */}
      <View style={styles.circleWrap}>
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: PHASE_COLORS[phase] },
            circleAnimatedStyle,
          ]}
        >
          <Text variant="h1" color={colors.text.primary} align="center">
            {isComplete ? '\u2714' : countdown}
          </Text>
        </Animated.View>
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
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  phaseLabel: {
    marginTop: spacing.md,
  },
  continueButton: {
    marginTop: spacing.xl,
    width: '80%',
  },
});
