/**
 * BreathMandala — 4-phase pranayama animation.
 *
 * Runs inhale → hold_in → exhale → hold_out for `rounds` cycles. The orb
 * scales up on inhale, holds, then deflates — identical rhythm to the
 * web `<MobileBreathMandala>` but using Reanimated timings instead of
 * framer-motion. When the cycles finish we call `onComplete`.
 *
 * The phase pattern is chosen by intensity (see `breathPatternForIntensity`):
 *   • Low intensity  → balanced box-breath (4-4-4-1)
 *   • Mid intensity  → calming 4-7-8 (Dr. Andrew Weil's pattern)
 *   • High intensity → quick reset (2-4-6-1)
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import type { BreathingPattern } from '../types';

interface BreathMandalaProps {
  pattern: BreathingPattern;
  rounds?: number;
  onComplete?: () => void;
}

type BreathPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

const PHASE_LABEL: Record<BreathPhase, string> = {
  inhale: 'Inhale',
  hold_in: 'Hold',
  exhale: 'Exhale',
  hold_out: 'Rest',
};

const PHASE_SCALE: Record<BreathPhase, number> = {
  inhale: 1.35,
  hold_in: 1.35,
  exhale: 0.85,
  hold_out: 0.85,
};

const PHASE_OPACITY: Record<BreathPhase, number> = {
  inhale: 0.95,
  hold_in: 0.85,
  exhale: 0.55,
  hold_out: 0.5,
};

const ORDER: BreathPhase[] = ['inhale', 'hold_in', 'exhale', 'hold_out'];

export function BreathMandala({
  pattern,
  rounds = 4,
  onComplete,
}: BreathMandalaProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.65);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [count, setCount] = useState(pattern.inhale);
  const [round, setRound] = useState(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const durationFor = (p: BreathPhase): number => {
      switch (p) {
        case 'inhale':
          return pattern.inhale;
        case 'hold_in':
          return pattern.holdIn;
        case 'exhale':
          return pattern.exhale;
        case 'hold_out':
          return pattern.holdOut;
      }
    };

    const runPhase = (r: number, idx: number) => {
      if (cancelled) return;
      const p = ORDER[idx];
      if (!p) return;
      const secs = durationFor(p);

      setPhase(p);
      setRound(r);
      setCount(secs);

      // Animate the orb
      scale.value = withTiming(PHASE_SCALE[p], {
        duration: secs * 1000,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(PHASE_OPACITY[p], {
        duration: secs * 1000,
        easing: Easing.inOut(Easing.ease),
      });

      // Countdown visible to the user (1-second granularity).
      let left = secs;
      const countdown = setInterval(() => {
        left -= 1;
        if (cancelled) {
          clearInterval(countdown);
          return;
        }
        if (left <= 0) {
          clearInterval(countdown);
        } else {
          setCount(left);
        }
      }, 1000);
      timers.push(countdown as unknown as ReturnType<typeof setTimeout>);

      // After the phase duration, advance.
      const next = setTimeout(() => {
        clearInterval(countdown);
        if (cancelled) return;

        const nextIdx = idx + 1;
        if (nextIdx >= ORDER.length) {
          // End of a cycle.
          const nextRound = r + 1;
          if (nextRound > rounds) {
            onCompleteRef.current?.();
            return;
          }
          runPhase(nextRound, 0);
        } else {
          runPhase(r, nextIdx);
        }
      }, secs * 1000);
      timers.push(next);
    };

    runPhase(1, 0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // The cycle pattern is captured at mount — we intentionally do not
    // re-run this effect if the caller passes a new reference mid-cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.orbWrap}>
        <View style={styles.orbRing} />
        <Animated.View style={[styles.orb, orbStyle]}>
          <Text style={styles.count}>{count}</Text>
        </Animated.View>
      </View>
      <Text style={styles.phaseLabel}>{PHASE_LABEL[phase]}</Text>
      <Text style={styles.roundLabel}>
        Round {round} of {rounds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 16,
  },
  orbWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
  },
  orb: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(27,79,187,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  count: {
    fontSize: 48,
    color: '#D4A017',
    fontWeight: '300',
  },
  phaseLabel: {
    fontSize: 18,
    color: '#EDE8DC',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  roundLabel: {
    fontSize: 12,
    color: 'rgba(237,232,220,0.45)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
