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
import { useTranslation } from '@kiaanverse/i18n';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

/** Default-meditation key list (resolved at render via t()). */
const DEFAULT_SCREEN_KEYS: readonly string[] = [
  'viyogaMedScreen1',
  'viyogaMedScreen2',
  'viyogaMedScreen3',
  'viyogaMedScreen4',
  'viyogaMedScreen5',
  'viyogaMedScreen6',
  'viyogaMedScreen7',
  'viyogaMedScreen8',
  'viyogaMedScreen9',
];

const AUTO_ADVANCE_MS = 4000;
const FADE_OUT_MS = 300;
const FADE_IN_MS = 400;

export default function ViyogaMeditation(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('tools');
  const { flow } = useSacredFlow('viyoga');

  // Use the response's copy when present; fall through to localized
  // defaults so the screen is never empty (a user landing here from
  // deep-link wouldn't have an aiResponse).
  const screens: readonly string[] =
    flow.aiResponse?.meditationScreens &&
    flow.aiResponse.meditationScreens.length > 0
      ? flow.aiResponse.meditationScreens
      : DEFAULT_SCREEN_KEYS.map((k) => t(k));

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
              accessibilityLabel={t('viyogaMedScreenOfA11y', {
                n: String(i + 1),
                total: String(screens.length),
              })}
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
              isFirst ? t('viyogaMedBackToTx') : t('viyogaMedPrevSentence')
            }
          >
            <Text style={s.navBtn}>{t('viyogaMedBack')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAuto}
            accessibilityRole="button"
            accessibilityLabel={
              autoMode ? t('viyogaMedAutoPause') : t('viyogaMedAutoStart')
            }
            accessibilityState={{ selected: autoMode }}
            disabled={current === lastIndex && !autoMode}
          >
            <Text style={[s.navBtn, autoMode && s.navBtnActive]}>
              {autoMode ? t('viyogaMedAutoOn') : t('viyogaMedAutoOff')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEnd}
            accessibilityRole="button"
            accessibilityLabel={t('viyogaMedEndA11y')}
          >
            <Text style={s.navBtn}>{t('viyogaMedEnd')}</Text>
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
