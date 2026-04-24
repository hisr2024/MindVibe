/**
 * Viyoga — Meditation
 *
 * One sentence per full-dark screen, centered. Navigation row at the
 * bottom (← Back · Auto · End) plus a tap-target dot for each screen.
 *
 * Transitions are a soft fade: the current sentence fades out and the
 * next fades in. Auto mode advances every 4 seconds until the user
 * toggles it off or reaches the last screen.
 *
 * Copy comes from `flow.aiResponse.meditationScreens`. When the backend
 * populates structured meditation text it will override the defaults
 * shipped in useSacredFlow.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

const DEFAULT_SCREENS: readonly string[] = [
  'The longing you carry is sacred.',
  'It is not weakness. It is love with nowhere to go.',
  'Breathe in what you remember.',
  'You carry it within you. It lives in your bones.',
  'The separation is real. The connection is also real.',
  'Distance cannot sever what is written into you.',
  'You are not uprooted. Your roots stretch everywhere.',
  'The bond holds. It always holds.',
  'Breathe out slowly. You are exactly where you are meant to be.',
];

const AUTO_ADVANCE_MS = 4000;
const FADE_OUT_MS = 300;
const FADE_IN_MS = 400;

export default function ViyogaMeditation(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { flow } = useSacredFlow('viyoga');

  // Use the response's copy when present; fall through to defaults so the
  // screen is never empty (a user landing here from deep-link wouldn't
  // have an aiResponse).
  const screens: readonly string[] =
    flow.aiResponse?.meditationScreens &&
    flow.aiResponse.meditationScreens.length > 0
      ? flow.aiResponse.meditationScreens
      : DEFAULT_SCREENS;

  const [current, setCurrent] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  const textOpacity = useSharedValue(1);
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  /**
   * Crossfade into a new screen index. JS-side we update `current` at
   * the trough of the fade so the new sentence is what fades back in.
   */
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= screens.length) return;
      textOpacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS },
        (finished) => {
          if (finished) {
            runOnJS(setCurrent)(index);
            textOpacity.value = withTiming(1, { duration: FADE_IN_MS });
          }
        }
      );
    },
    [screens.length, textOpacity]
  );

  // Auto-advance tick. Clears itself when auto mode flips off, when the
  // user reaches the last screen, or when the screen unmounts.
  useEffect(() => {
    if (!autoMode) return;

    const tick = setInterval(() => {
      setCurrent((c) => {
        if (c >= screens.length - 1) {
          setAutoMode(false);
          return c;
        }
        const next = c + 1;
        // Drive the crossfade from inside the state updater so we don't
        // stack fades when interval fires faster than the animation.
        textOpacity.value = withTiming(
          0,
          { duration: FADE_OUT_MS },
          (finished) => {
            if (finished) {
              textOpacity.value = withTiming(1, { duration: FADE_IN_MS });
            }
          }
        );
        return next;
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(tick);
  }, [autoMode, screens.length, textOpacity]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (current === 0) {
      router.back();
    } else {
      goTo(current - 1);
    }
  }, [current, goTo]);

  const handleAuto = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoMode((a) => !a);
  }, []);

  const handleEnd = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/tools/viyoga/release' as never);
  }, []);

  const sentence = screens[current] ?? '';

  const lastIndex = screens.length - 1;
  const isFirst = current === 0;

  return (
    <View style={s.screen}>
      <Animated.View style={[s.sentenceWrap, textStyle]}>
        <Text style={s.sentence}>{sentence}</Text>
      </Animated.View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.dots}>
          {screens.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                void Haptics.selectionAsync();
                goTo(i);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Go to screen ${i + 1} of ${screens.length}`}
            >
              <View style={[s.dot, i === current && s.dotActive]} />
            </Pressable>
          ))}
        </View>

        <View style={s.nav}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={
              isFirst ? 'Back to transmission' : 'Previous sentence'
            }
          >
            <Text style={s.navBtn}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAuto}
            accessibilityRole="button"
            accessibilityLabel={
              autoMode ? 'Pause auto-advance' : 'Start auto-advance'
            }
            accessibilityState={{ selected: autoMode }}
            disabled={current === lastIndex && !autoMode}
          >
            <Text style={[s.navBtn, autoMode && s.navBtnActive]}>
              {autoMode ? '⏸ Auto' : 'Auto'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEnd}
            accessibilityRole="button"
            accessibilityLabel="End meditation"
          >
            <Text style={s.navBtn}>End</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    justifyContent: 'space-between',
  },
  sentenceWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sentence: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 22,
    color: 'rgba(240,235,225,0.88)',
    textAlign: 'center',
    lineHeight: 36,
  },
  bottom: {
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212,160,23,0.25)',
  },
  dotActive: {
    backgroundColor: '#D4A017',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navBtn: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: 'rgba(240,235,225,0.4)',
  },
  navBtnActive: {
    color: '#D4A017',
  },
});
