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

  // Sanskrit verses arrive as multi-line strings:
  //
  //   सञ्जय उवाच\n
  //   एवमुक्त्वाऽर्जुनः सङ्ख्ये रथोपस्थ उपाविशत्।\n
  //   विसृज्य सशरं चापं शोकसंविग्नमानसः।।1.47।।
  //
  // The web renders these as 3 visual lines — speaker tag, then two
  // lines of the verse body. The previous flexDirection:'row' +
  // flexWrap:'wrap' layout on Android lost those newlines because
  // \n collapsed into ordinary whitespace inside the wrap, producing
  // "सञ्जय उवाचएवमुक्त्वाऽर्जुनः..." (mashed-together text reported
  // by the user).
  //
  // Fix: split on \n FIRST, render each line as its own flex row, run
  // the word-by-word stagger across all lines (so the animation flows
  // naturally from the speaker tag down through the body — same
  // wordIndex sequence the original code computed, just laid out
  // across multiple rows).
  //
  // Empty lines (\n\n) are preserved as a small vertical gap so the
  // visual breathing space between speaker + body matches the web.
  const lines = useMemo(() => {
    // Split on any newline variant (\n, \r\n, \r), normalize.
    const rawLines = text.split(/\r\n|\r|\n/u);
    let cumulativeWordIndex = 0;
    return rawLines.map((line) => {
      const chunks = line.split(/(\s+)/u).filter((chunk) => chunk.length > 0);
      const lineStartIndex = cumulativeWordIndex;
      // Increment cumulative index by the number of NON-whitespace
      // chunks (= words) so the next line continues the stagger
      // sequence.
      cumulativeWordIndex += chunks.filter((c) => !/^\s+$/u.test(c)).length;
      return { chunks, startIndex: lineStartIndex };
    });
  }, [text]);

  // Total word count across all lines — needed to detect the FINAL
  // word for the onComplete callback.
  const totalWordCount = useMemo(
    () =>
      lines.reduce(
        (acc, line) =>
          acc + line.chunks.filter((c) => !/^\s+$/u.test(c)).length,
        0,
      ),
    [lines],
  );

  return (
    <View
      style={[styles.container, containerStyle]}
      testID={testID}
      accessible
      accessibilityLabel={text}
      accessibilityRole="text"
    >
      {lines.map((line, lineIdx) => {
        // Render an empty line as a small vertical gap so the
        // breathing space between speaker tag and body is preserved.
        if (line.chunks.length === 0) {
          return <View key={`break-${lineIdx}`} style={styles.lineBreak} />;
        }
        return (
          <View key={`line-${lineIdx}`} style={styles.flow}>
            {line.chunks.map((chunk, i) => {
              if (/^\s+$/u.test(chunk)) {
                // Preserve intra-line whitespace without animating it.
                return (
                  <Animated.Text
                    key={`ws-${lineIdx}-${i}`}
                    style={[styles.word, textStyle]}
                  >
                    {chunk}
                  </Animated.Text>
                );
              }
              const wordIndex =
                line.startIndex +
                line.chunks
                  .slice(0, i)
                  .filter((c) => !/^\s+$/u.test(c)).length;
              return (
                <Word
                  key={`w-${lineIdx}-${i}`}
                  word={chunk}
                  index={wordIndex}
                  delayMs={delay}
                  staggerMs={staggerMs}
                  textStyle={textStyle}
                  reduceMotion={reduceMotion}
                  onComplete={onComplete}
                  isLast={wordIndex === totalWordCount - 1}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** Animated word-by-word verse reveal with reduce-motion support. */
export const VerseRevelation = React.memo(VerseRevelationInner);

const styles = StyleSheet.create({
  // Outer container is a column — each verse line gets its own row.
  // The previous shape used a single flex-row + wrap, which collapsed
  // \n breaks into ordinary whitespace and visually mashed multi-pada
  // verses into one block.
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  // Per-line row — words flow horizontally, wrap if a single line is
  // too long for the container width (rare for Sanskrit verses; but
  // common for long English translations).
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  // Empty-line marker — small vertical breath between speaker tag
  // and verse body when the source has \n\n.
  lineBreak: {
    height: 8,
  },
  word: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 17,
    color: '#D4A017',
  },
});
