/**
 * BreathingOrb — Sacred breathing guide with animated inhale/hold/exhale cycles.
 *
 * A glowing orb that scales and shifts color through breathing phases,
 * guiding the user through pranayama-style patterns. Uses Reanimated
 * withTiming for smooth phase transitions and interpolateColor for
 * the inner glow color shift.
 *
 * Phases: Inhale (gold) -> Hold In (cyan) -> Exhale (peacock blue) -> Hold Out (rest)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { Text } from './Text';

/** Breathing pattern timing in milliseconds for each phase. */
export interface BreathingPattern {
  readonly inhale: number;
  readonly holdIn: number;
  readonly exhale: number;
  readonly holdOut: number;
}

/** Props for the BreathingOrb component. */
export interface BreathingOrbProps {
  /** Timing for each breathing phase in milliseconds. */
  readonly pattern: BreathingPattern;
  /** Whether the breathing cycle is actively running. */
  readonly isActive: boolean;
  /** Diameter of the orb in points. @default 200 */
  readonly size?: number;
  /** Called when one full inhale-hold-exhale-rest cycle completes. */
  readonly onCycleComplete?: () => void;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Phase labels displayed below the orb. */
const PHASE_LABELS = ['Breathe In...', 'Hold...', 'Breathe Out...', 'Rest...'] as const;

/** Phase color targets: gold (inhale), cyan (hold), peacock blue (exhale), dim (rest). */
const PHASE_COLORS = ['#D4A017', '#17b1a7', '#0F5E8C', '#0F5E8C'] as const;

function BreathingOrbComponent({
  pattern,
  isActive,
  size = 200,
  onCycleComplete,
  style,
  testID,
}: BreathingOrbProps): React.JSX.Element {
  /** 0 = inhale, 1 = holdIn, 2 = exhale, 3 = holdOut */
  const phaseIndex = useSharedValue(0);
  const scale = useSharedValue(1.0);
  const opacity = useSharedValue(0.6);
  /** 0-3 continuous value for color interpolation */
  const colorProgress = useSharedValue(0);
  /** Countdown seconds remaining in current phase */
  const countdown = useSharedValue(0);

  const phaseLabel = useSharedValue<string>(PHASE_LABELS[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Run a single breathing cycle, then recurse if still active. */
  const runCycle = useCallback(() => {
    if (!activeRef.current) return;

    const durations = [pattern.inhale, pattern.holdIn, pattern.exhale, pattern.holdOut];

    const runPhase = (idx: number) => {
      if (!activeRef.current) return;

      const dur = durations[idx] ?? 0;
      const phaseLabelForIdx = PHASE_LABELS[idx] ?? PHASE_LABELS[0];

      // Update phase index and label
      phaseIndex.value = idx;
      phaseLabel.value = phaseLabelForIdx;
      colorProgress.value = withTiming(idx, { duration: dur, easing: Easing.inOut(Easing.ease) });
      countdown.value = Math.round(dur / 1000);

      // Scale: inhale -> expand, holdIn -> stay, exhale -> contract, holdOut -> stay
      if (idx === 0) {
        scale.value = withTiming(1.3, { duration: dur, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(1.0, { duration: dur, easing: Easing.inOut(Easing.ease) });
      } else if (idx === 1) {
        // Hold at expanded — no animation needed
      } else if (idx === 2) {
        scale.value = withTiming(1.0, { duration: dur, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(0.6, { duration: dur, easing: Easing.inOut(Easing.ease) });
      }
      // Phase 3 (holdOut): stay at contracted state

      // Countdown timer ticks
      const tickInterval = 1000;
      let remaining = Math.round(dur / 1000);
      const tick = () => {
        remaining -= 1;
        if (remaining >= 0) {
          countdown.value = remaining;
        }
      };
      for (let t = 1; t <= remaining; t++) {
        setTimeout(tick, t * tickInterval);
      }

      // Schedule next phase
      timerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        const nextIdx = idx + 1;
        if (nextIdx < 4) {
          runPhase(nextIdx);
        } else {
          // Cycle complete
          if (onCycleComplete) {
            runOnJS(onCycleComplete)();
          }
          // Reset color progress for next cycle
          colorProgress.value = 0;
          runCycle();
        }
      }, dur);
    };

    runPhase(0);
  }, [pattern, onCycleComplete, phaseIndex, phaseLabel, colorProgress, countdown, scale, opacity]);

  useEffect(() => {
    if (isActive) {
      runCycle();
    } else {
      clearTimers();
      // Reset to resting state
      scale.value = withTiming(1.0, { duration: 400 });
      opacity.value = withTiming(0.6, { duration: 400 });
      colorProgress.value = withTiming(0, { duration: 400 });
      phaseLabel.value = PHASE_LABELS[0];
      countdown.value = 0;
    }

    return clearTimers;
  }, [isActive, runCycle, clearTimers, scale, opacity, colorProgress, phaseLabel, countdown]);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1, 2, 3],
      PHASE_COLORS as unknown as string[],
    ),
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    opacity: countdown.value > 0 ? 1 : 0.4,
  }));

  const phaseLabelStyle = useAnimatedStyle(() => ({
    opacity: isActive ? 1 : 0.4,
  }));

  const orbSize = size * 0.7;

  return (
    <View
      style={[styles.container, { width: size, height: size + 40 }, style]}
      testID={testID}
      accessibilityRole="timer"
      accessibilityLabel="Breathing guide orb"
    >
      <View style={[styles.orbWrapper, { width: size, height: size }]}>
        {/* Outer glow ring */}
        <View
          style={[
            styles.glowRing,
            {
              width: orbSize + 30,
              height: orbSize + 30,
              borderRadius: (orbSize + 30) / 2,
            },
          ]}
        />

        {/* Animated orb */}
        <Animated.View
          style={[
            styles.orb,
            {
              width: orbSize,
              height: orbSize,
              borderRadius: orbSize / 2,
            },
            orbAnimatedStyle,
          ]}
        >
          {/* Countdown text in center */}
          <Animated.Text style={[styles.countdownText, countdownStyle]}>
            {/* Static text — countdown driven by shared value updates */}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Phase label */}
      <Animated.View style={[styles.labelContainer, phaseLabelStyle]}>
        <Text variant="body" color={colors.text.secondary} align="center">
          {isActive ? PHASE_LABELS[0] : 'Tap to begin'}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Sacred breathing orb that guides inhale/hold/exhale cycles with smooth animations. */
export const BreathingOrb = React.memo(BreathingOrbComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.text.primary,
    textAlign: 'center',
  },
  labelContainer: {
    marginTop: spacing.sm,
  },
});
