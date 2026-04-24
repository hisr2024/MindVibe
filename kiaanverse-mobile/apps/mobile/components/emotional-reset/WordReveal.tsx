/**
 * WordReveal — Reveal a paragraph word-by-word.
 *
 * RN analogue of `<MobileWordReveal>` used in the web flow. A local copy
 * (vs. importing from the karma-reset folder) avoids cross-feature coupling.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

interface WordRevealProps {
  text: string;
  speed?: number;
  style?: StyleProp<TextStyle>;
  /** Delay before the first word appears (ms). */
  startDelay?: number;
  /** Fired when the final word has rendered. */
  onComplete?: () => void;
}

export function WordReveal({
  text,
  speed = 70,
  style,
  startDelay = 0,
  onComplete,
}: WordRevealProps): React.JSX.Element {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (words.length === 0) {
      onComplete?.();
      return;
    }
    const start = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= words.length) {
          clearInterval(id);
          onComplete?.();
        }
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
    // onComplete intentionally omitted — effects here must only re-run when text
    // changes, not when the parent re-renders and hands us a fresh callback ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, speed, startDelay]);

  return (
    <Text style={[styles.text, style]}>{words.slice(0, count).join(' ')}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#EDE8DC',
    fontSize: 17,
    lineHeight: 28,
  },
});
