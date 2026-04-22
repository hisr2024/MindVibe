/**
 * EntryPhase — 1.6s sacred entry ceremony.
 *
 * Sequence:
 *   t=0ms   : flame appears (scale 0.5 → 1, opacity 0 → 1)
 *   t=200ms : Sanskrit "कर्म" reveals letter-by-letter with blur-to-clear
 *   t=900ms : "Karma Reset" subtitle fades in
 *   t=1200ms: flame shrinks and drifts to the top
 *   t=1600ms: onComplete() — the orchestrator swaps to the Context phase
 *
 * If the user has reduce-motion enabled we skip straight to onComplete.
 * Mirrors `app/(mobile)/m/karma-reset/phases/EntryPhase.tsx`.
 */

import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { DharmaFlameIcon } from '../visuals/DharmaFlameIcon';

interface EntryPhaseProps {
  onComplete: () => void;
}

type Step = 'flame' | 'sanskrit' | 'subtitle' | 'shrink' | 'done';

const SANSKRIT_CHARS = ['क', 'र्म'] as const;

function Char({
  char,
  delay,
}: {
  char: string;
  delay: number;
}): React.JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.Text style={[styles.sanskritChar, style]}>
      {char}
    </Animated.Text>
  );
}

export function EntryPhase({ onComplete }: EntryPhaseProps): React.JSX.Element {
  const [step, setStep] = useState<Step>('flame');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Query + subscribe to reduce-motion
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduceMotion(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      onComplete();
      return;
    }

    const timers = [
      setTimeout(() => setStep('sanskrit'), 200),
      setTimeout(() => setStep('subtitle'), 900),
      setTimeout(() => setStep('shrink'), 1200),
      setTimeout(() => {
        setStep('done');
        onComplete();
      }, 1600),
    ];

    return () => timers.forEach(clearTimeout);
  }, [reduceMotion, onComplete]);

  // Flame animation — scale + y
  const flameScale = useSharedValue(0.5);
  const flameY = useSharedValue(0);
  const flameOpacity = useSharedValue(0);

  useEffect(() => {
    flameOpacity.value = withTiming(1, { duration: 400 });
    flameScale.value = withSpring(1, { damping: 18, stiffness: 180 });
  }, [flameOpacity, flameScale]);

  useEffect(() => {
    if (step === 'shrink' || step === 'done') {
      flameScale.value = withTiming(0.3, { duration: 400 });
      flameY.value = withTiming(-200, {
        duration: 400,
        easing: Easing.bezier(0, 0.8, 0.2, 1),
      });
      flameOpacity.value = withTiming(0.6, { duration: 400 });
    }
  }, [step, flameScale, flameY, flameOpacity]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: flameOpacity.value,
    transform: [
      { translateY: flameY.value },
      { scale: flameScale.value },
    ],
  }));

  return (
    <View style={styles.root}>
      {/* Central flame */}
      <Animated.View style={flameStyle}>
        <DharmaFlameIcon size={48} intensity="bright" animate />
      </Animated.View>

      {/* Sanskrit "कर्म" — letter by letter */}
      {(step === 'sanskrit' || step === 'subtitle' || step === 'shrink') ? (
        <View style={styles.sanskritRow}>
          {SANSKRIT_CHARS.map((char, i) => (
            <Char key={`${i}-${char}`} char={char} delay={i * 80} />
          ))}
        </View>
      ) : null}

      {/* Subtitle */}
      {(step === 'subtitle' || step === 'shrink') ? (
        <Animated.Text
          entering={FadeIn.duration(300)}
          style={styles.subtitle}
        >
          Karma Reset
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050714',
  },
  sanskritRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 16,
  },
  sanskritChar: {
    fontSize: 52,
    fontWeight: '300',
    color: '#F0C040',
    letterSpacing: 4,
    textShadowColor: 'rgba(212,160,23,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontStyle: 'italic',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    color: '#B8AE98',
    fontWeight: '300',
  },
});
