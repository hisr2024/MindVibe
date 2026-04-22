/**
 * WordReveal — Reveal a sentence word by word with a configurable speed.
 *
 * Used across phases for Sakha's dialogue (the web version imports
 * `<MobileWordReveal>` — this is its RN analogue). Setting `speed` to a
 * lower number makes words appear faster; the default (70ms) matches
 * the web feel.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

interface WordRevealProps {
  text: string;
  speed?: number;
  style?: StyleProp<TextStyle>;
  /** Extra delay (ms) before the first word appears. */
  startDelay?: number;
}

export function WordReveal({
  text,
  speed = 70,
  style,
  startDelay = 0,
}: WordRevealProps): React.JSX.Element {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (words.length === 0) return;
    const start = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= words.length) clearInterval(id);
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
  }, [words, speed, startDelay]);

  return (
    <Text style={[styles.text, style]}>
      {words.slice(0, count).join(' ')}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#F0EBE1',
    fontSize: 17,
    lineHeight: 28,
  },
});
