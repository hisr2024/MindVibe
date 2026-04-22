/**
 * Viyoga — Sacred Fire
 *
 * The offering ritual. A glowing tear drop dissolves (scales up + fades
 * to zero) over 1.5s, then three closing lines fade in at 1.5s, 2.8s,
 * and 4.0s. At 6s the screen `replace`s into the completion screen —
 * `replace` so the user can't back-swipe into the ritual mid-dissolution.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSacredFlow } from '@/hooks/useSacredFlow';

const DEFAULT_LINES: readonly string[] = [
  'Your offering has been received by the Sacred Fire.',
  'It is released... no longer has power over you.',
  'What remains is love. Only love.',
];

// When each line appears (ms after mount).
const LINE_DELAYS_MS: readonly number[] = [1500, 2800, 4000];
const LINE_FADE_DURATION_MS = 800;

// Tear drop timings.
const DROP_HOLD_MS = 1000;
const DROP_DISSOLVE_MS = 1500;
const DROP_DISSOLVE_SCALE = 1.4;

// When we auto-navigate to the completion screen.
const COMPLETE_AFTER_MS = 6000;

// ── Line — each line owns its own fade hook rather than being generated
//    inside a .map() (that would violate the rules of hooks). ─────────────

interface FireLineProps {
  readonly text: string;
  readonly delay: number;
  readonly emphasized: boolean;
}

function FireLine({ text, delay, emphasized }: FireLineProps): React.JSX.Element {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: LINE_FADE_DURATION_MS }));
    return () => {
      cancelAnimation(opacity);
    };
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[s.line, emphasized && s.lastLine, style]}>
      {text}
    </Animated.Text>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function ViyogaFire(): React.JSX.Element {
  const { flow } = useSacredFlow('viyoga');

  const lines =
    flow.aiResponse?.fireLines && flow.aiResponse.fireLines.length > 0
      ? flow.aiResponse.fireLines
      : DEFAULT_LINES;

  const dropOpacity = useSharedValue(1);
  const dropScale = useSharedValue(1);

  useEffect(() => {
    dropOpacity.value = withDelay(DROP_HOLD_MS, withTiming(0, { duration: DROP_DISSOLVE_MS }));
    dropScale.value = withDelay(
      DROP_HOLD_MS,
      withTiming(DROP_DISSOLVE_SCALE, { duration: DROP_DISSOLVE_MS }),
    );

    const t = setTimeout(() => {
      router.replace('/tools/viyoga/complete' as never);
    }, COMPLETE_AFTER_MS);

    return () => {
      clearTimeout(t);
      cancelAnimation(dropOpacity);
      cancelAnimation(dropScale);
    };
  }, [dropOpacity, dropScale]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: dropOpacity.value,
    transform: [{ scale: dropScale.value }],
  }));

  return (
    <View style={s.screen}>
      <Animated.View style={[s.tearWrap, dropStyle]}>
        <View style={s.glow} />
        <Text style={s.tear}>💧</Text>
      </Animated.View>

      <View style={s.lines}>
        {LINE_DELAYS_MS.map((delay, i) => (
          <FireLine
            key={i}
            text={lines[i] ?? DEFAULT_LINES[i] ?? ''}
            delay={delay}
            emphasized={i === LINE_DELAYS_MS.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tearWrap: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212,160,23,0.1)',
    top: -40,
    left: -40,
  },
  tear: {
    fontSize: 80,
  },
  lines: {
    alignItems: 'center',
    gap: 20,
  },
  line: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 18,
    color: 'rgba(240,235,225,0.8)',
    textAlign: 'center',
    lineHeight: 28,
  },
  lastLine: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    color: '#D4A017',
  },
});
