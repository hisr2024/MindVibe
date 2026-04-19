/**
 * VerseRevelation — Word-by-word Sanskrit entrance animation.
 *
 * Web parity:
 * - Text prop is split into words.
 * - Each word fades (opacity 0→1, 150ms) and lifts (translateY 6→0, 200ms),
 *   staggered at 80ms intervals using lotus-bloom easing.
 * - Optional overall delay before the sequence starts.
 * - Respects AccessibilityInfo.isReduceMotionEnabled — instant show when on.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type EmitterSubscription,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const OPACITY_DURATION_MS = 150;
const TRANSLATE_DURATION_MS = 200;
const WORD_STAGGER_MS = 80;

/** Lotus bloom easing — soft start, rounded finish. */
const lotusBloom = Easing.bezier(0.22, 1, 0.36, 1);

export interface VerseRevelationProps {
  /** The verse text to reveal. Whitespace delimits word boundaries. */
  readonly text: string;
  /** Text style applied to each animated word. */
  readonly textStyle?: TextStyle;
  /** Optional style override for the flow container. */
  readonly containerStyle?: ViewStyle;
  /** Delay (ms) before the first word animates in. @default 0 */
  readonly delay?: number;
  /** Overrides stagger between words (ms). @default 80 */
  readonly staggerMs?: number;
  /** Called when the final word has completed its entrance. */
  readonly onComplete?: () => void;
  /** Test identifier. */
  readonly testID?: string;
}

interface WordProps {
  readonly word: string;
  readonly index: number;
  readonly delayMs: number;
  readonly staggerMs: number;
  readonly textStyle: TextStyle | undefined;
  readonly reduceMotion: boolean;
  readonly onComplete?: (() => void) | undefined;
  readonly isLast: boolean;
}

function Word({
  word,
  index,
  delayMs,
  staggerMs,
  textStyle,
  reduceMotion,
  onComplete,
  isLast,
}: WordProps): React.JSX.Element {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translate = useSharedValue(reduceMotion ? 0 : 6);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translate.value = 0;
      if (isLast) onComplete?.();
      return;
    }
    const wordDelay = delayMs + index * staggerMs;
    opacity.value = withDelay(
      wordDelay,
      withTiming(1, { duration: OPACITY_DURATION_MS, easing: lotusBloom }),
    );
    translate.value = withDelay(
      wordDelay,
      withTiming(0, { duration: TRANSLATE_DURATION_MS, easing: lotusBloom }, (finished) => {
        if (finished && isLast && onComplete) {
          // runOnJS is safer, but calling a stable JS callback via shared-value
          // worklet requires it. Deferring to a microtask on UI would be wrong.
          // We rely on the parent retaining stable onComplete identity.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (globalThis as unknown as { setImmediate?: (cb: () => void) => void }).setImmediate?.(
            onComplete,
          );
        }
      }),
    );
  }, [delayMs, index, isLast, onComplete, opacity, reduceMotion, staggerMs, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.Text
      style={[styles.word, textStyle, animatedStyle]}
      accessible={false}
    >
      {word}
    </Animated.Text>
  );
}

function VerseRevelationInner({
  text,
  textStyle,
  containerStyle,
  delay = 0,
  staggerMs = WORD_STAGGER_MS,
  onComplete,
  testID,
}: VerseRevelationProps): React.JSX.Element {
  const [reduceMotion, setReduceMotion] = useState(false);
  const subscriptionRef = useRef<EmitterSubscription | null>(null);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduceMotion(enabled);
      })
      .catch(() => {
        // Reduce-motion detection not supported on this platform — assume false.
      });
    subscriptionRef.current = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      alive = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  const words = useMemo(
    () => text.split(/(\s+)/u).filter((chunk) => chunk.length > 0),
    [text],
  );

  return (
    <View
      style={[styles.flow, containerStyle]}
      testID={testID}
      accessible
      accessibilityLabel={text}
      accessibilityRole="text"
    >
      {words.map((chunk, i) => {
        if (/^\s+$/u.test(chunk)) {
          // Preserve whitespace without animating it.
          return (
            <Animated.Text key={`ws-${i}`} style={[styles.word, textStyle]}>
              {chunk}
            </Animated.Text>
          );
        }
        const wordIndex = words
          .slice(0, i)
          .filter((c) => !/^\s+$/u.test(c)).length;
        return (
          <Word
            key={`w-${i}`}
            word={chunk}
            index={wordIndex}
            delayMs={delay}
            staggerMs={staggerMs}
            textStyle={textStyle}
            reduceMotion={reduceMotion}
            onComplete={onComplete}
            isLast={i === words.length - 1}
          />
        );
      })}
    </View>
  );
}

/** Animated word-by-word verse reveal with reduce-motion support. */
export const VerseRevelation = React.memo(VerseRevelationInner);

const styles = StyleSheet.create({
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  word: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 17,
    color: '#D4A017',
  },
});
