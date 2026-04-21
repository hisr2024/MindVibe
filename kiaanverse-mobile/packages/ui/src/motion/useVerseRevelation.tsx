/**
 * useVerseRevelation — hook form of the word-by-word Sanskrit reveal.
 *
 * Web parity: each word fades (opacity 0 → 1, 150 ms) and lifts
 * (translateY 6 → 0, 200 ms) with lotus-bloom easing, staggered 80 ms
 * between words. Honours `AccessibilityInfo.isReduceMotionEnabled`
 * (instant show when on).
 *
 * Unlike the existing `VerseRevelation` *component*, this hook returns
 * a memoised `<VerseRevelationText>` component that callers can drop in
 * anywhere they'd normally render a `<Text>`, plus a `resetKey` for
 * imperatively re-triggering the animation on the same text (e.g. when
 * a daily verse stays the same string across re-mounts but the user
 * pulled to refresh).
 *
 * Usage:
 *   const { VerseRevelationText, replay } = useVerseRevelation();
 *   return (
 *     <VerseRevelationText
 *       text="कर्मण्येवाधिकारस्ते"
 *       textStyle={{ fontFamily: 'NotoSansDevanagari-Regular' }}
 *     />
 *   );
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type EmitterSubscription,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { easeLotusBloom } from './tokens';

/** Default revelation timings — match the existing VerseRevelation component. */
const OPACITY_DURATION_MS = 150;
const TRANSLATE_DURATION_MS = 200;
const WORD_STAGGER_MS = 80;
const WORD_TRANSLATE_FROM = 6;

export interface UseVerseRevelationOptions {
  /** Override the stagger between words (ms). @default 80 */
  readonly staggerMs?: number;
  /** Delay (ms) before the first word starts. @default 0 */
  readonly initialDelayMs?: number;
  /** Force reduce-motion mode regardless of OS setting. */
  readonly forceReduceMotion?: boolean;
}

export interface VerseRevelationTextProps {
  /** The verse / paragraph to reveal. Whitespace delimits word boundaries. */
  readonly text: string;
  /** Text style applied to each animated word + any whitespace run. */
  readonly textStyle?: TextStyle;
  /** Optional flow-container style override (row + wrap). */
  readonly containerStyle?: ViewStyle;
  /** Invoked once the final word has entered. */
  readonly onComplete?: () => void;
  /** Test identifier. */
  readonly testID?: string;
}

export interface UseVerseRevelationResult {
  /** Ready-to-render `<Text>`-like component driving the animated reveal. */
  readonly VerseRevelationText: (
    props: VerseRevelationTextProps,
  ) => React.JSX.Element;
  /**
   * Imperatively replay the animation — increments an internal key which
   * the inner component threads through React so each Word re-mounts.
   */
  readonly replay: () => void;
  /** Current replay key (exposed so callers can store / log it). */
  readonly revealKey: number;
  /** Whether the OS is reporting reduce-motion. */
  readonly reduceMotion: boolean;
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
  const translate = useSharedValue(reduceMotion ? 0 : WORD_TRANSLATE_FROM);

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
      withTiming(1, {
        duration: OPACITY_DURATION_MS,
        easing: easeLotusBloom,
      }),
    );
    translate.value = withDelay(
      wordDelay,
      withTiming(
        0,
        { duration: TRANSLATE_DURATION_MS, easing: easeLotusBloom },
        (finished) => {
          'worklet';
          if (finished && isLast && onComplete) {
            // setImmediate exists on RN; the cast keeps the worklet JS-safe
            // without importing the entire RN globals shape.
            const g = globalThis as unknown as {
              setImmediate?: (cb: () => void) => void;
            };
            g.setImmediate?.(onComplete);
          }
        },
      ),
    );
  }, [
    delayMs,
    index,
    isLast,
    onComplete,
    opacity,
    reduceMotion,
    staggerMs,
    translate,
  ]);

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

export function useVerseRevelation(
  options: UseVerseRevelationOptions = {},
): UseVerseRevelationResult {
  const {
    staggerMs = WORD_STAGGER_MS,
    initialDelayMs = 0,
    forceReduceMotion,
  } = options;

  const [reduceMotion, setReduceMotion] = useState(
    forceReduceMotion ?? false,
  );
  const [revealKey, setRevealKey] = useState(0);
  const subscriptionRef = useRef<EmitterSubscription | null>(null);

  useEffect(() => {
    if (forceReduceMotion !== undefined) {
      setReduceMotion(forceReduceMotion);
      return;
    }
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduceMotion(enabled);
      })
      .catch(() => {
        // Platform query failed — assume motion is allowed.
      });
    subscriptionRef.current = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      alive = false;
      subscriptionRef.current?.remove();
    };
  }, [forceReduceMotion]);

  const replay = useCallback(() => {
    setRevealKey((k) => k + 1);
  }, []);

  const VerseRevelationText = useMemo(() => {
    return function VerseRevelationTextImpl({
      text,
      textStyle,
      containerStyle,
      onComplete,
      testID,
    }: VerseRevelationTextProps): React.JSX.Element {
      const words = useMemo(
        () => text.split(/(\s+)/u).filter((chunk) => chunk.length > 0),
        [text],
      );

      return (
        <View
          // `revealKey` change forces Word children to remount, restarting
          // the animation cleanly.
          key={`verse-${revealKey}`}
          style={[styles.flow, containerStyle]}
          testID={testID}
          accessible
          accessibilityLabel={text}
          accessibilityRole="text"
        >
          {words.map((chunk, i) => {
            if (/^\s+$/u.test(chunk)) {
              return (
                <Animated.Text
                  key={`ws-${i}`}
                  style={[styles.word, textStyle]}
                >
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
                delayMs={initialDelayMs}
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
    };
  }, [initialDelayMs, reduceMotion, revealKey, staggerMs]);

  return {
    VerseRevelationText,
    replay,
    revealKey,
    reduceMotion,
  };
}

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
