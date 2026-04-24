/**
 * VerseRevelation — ceremonial word-by-word Sanskrit entrance.
 *
 * Splits the Sanskrit line on whitespace and fades each word in with a
 * subtle upward rise, staggered 110 ms apart after an initial delay.
 * Matches the web <VerseRevelation> on the Daily Verse card.
 */

import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
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

const CEREMONY_DELAY_MS = 300;
const WORD_STAGGER_MS = 110;
const WORD_DURATION_MS = 520;

export interface VerseRevelationProps {
  readonly sanskrit: string;
  /** Extra delay before the first word starts. @default 300 */
  readonly delay?: number | undefined;
  readonly textStyle?: TextStyle | undefined;
  readonly style?: ViewStyle | undefined;
}

function Word({
  text,
  delay,
}: {
  text: string;
  delay: number;
}): React.JSX.Element {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: WORD_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: WORD_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.Text style={animatedStyle}>{text}</Animated.Text>;
}

export function VerseRevelation({
  sanskrit,
  delay = CEREMONY_DELAY_MS,
  textStyle,
  style,
}: VerseRevelationProps): React.JSX.Element {
  const words = useMemo(() => sanskrit.split(/(\s+)/), [sanskrit]);

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.base, textStyle]}>
        {words.map((word, i) =>
          /^\s+$/.test(word) ? (
            <Text key={`w-${i}`}>{word}</Text>
          ) : (
            <Word
              key={`w-${i}`}
              text={word}
              delay={delay + i * WORD_STAGGER_MS}
            />
          )
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  base: {
    fontFamily: 'NotoSansDevanagari-Bold',
    color: '#D4A017',
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '700',
  },
});
