/**
 * Viyoga — Loading Screen
 *
 * "Finding the verse written for this moment..."
 *
 * Holds the user's attention while Sakha composes the transmission:
 *  - A three-ring mandala rotates at 8s / revolution on the UI thread.
 *  - The copy drifts from "Listening to the silence between..." to
 *    "Finding the verse written for this moment..." at 3s.
 *
 * The screen owns the actual API call — `submitFlow()` is fired on
 * mount, and on success (or failure) we `replace` into the transmission
 * screen so the user can't back-swipe into a dead loading state.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSacredFlow } from '@/hooks/useSacredFlow';

const LOADING_MESSAGES: readonly string[] = [
  'Listening to the silence between...',
  'Finding the verse written for this moment...',
];

const MESSAGE_SWITCH_DELAY_MS = 3000;
const ROTATION_DURATION_MS = 8000;

export default function ViyogaLoading(): React.JSX.Element {
  const [msgIndex, setMsgIndex] = useState(0);
  const { submitFlow } = useSacredFlow('viyoga');

  // Rotation animation for the sacred geometry mandala — runs on the UI
  // thread so it never stutters while the network call is in flight.
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ROTATION_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Swap the copy after a beat so the user isn't staring at static text.
  useEffect(() => {
    const t = setTimeout(() => setMsgIndex(1), MESSAGE_SWITCH_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Fire the real API call, then navigate regardless of success/failure —
  // the transmission screen handles the empty state itself. Using `replace`
  // so the user can't back-swipe to a dead loading screen.
  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      try {
        await submitFlow();
      } catch {
        // submitFlow already stored the error on the flow bucket; the
        // transmission screen will read and surface it.
      } finally {
        if (!cancelled) {
          router.replace('/tools/viyoga/transmission' as never);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [submitFlow]);

  const message = LOADING_MESSAGES[msgIndex] ?? LOADING_MESSAGES[0] ?? '';

  return (
    <View style={s.screen}>
      <Animated.View style={[s.mandala, rotateStyle]}>
        <View style={s.glow} />
        <View style={s.outerRing} />
        <View style={s.midRing} />
        <View style={s.innerRing} />
        <View style={s.centerDot} />
      </Animated.View>

      <Text style={s.message}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandala: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212,160,23,0.06)',
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(27,79,187,0.5)',
  },
  midRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(27,79,187,0.35)',
  },
  innerRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4A017',
  },
  message: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 16,
    color: 'rgba(240,235,225,0.5)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
