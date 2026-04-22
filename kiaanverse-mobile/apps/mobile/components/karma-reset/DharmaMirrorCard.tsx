/**
 * DharmaMirrorCard — Sakha's witness statement.
 *
 * A left-accented, category-colored card that reflects back what Sakha
 * sees in the user's karma. The text reveals word-by-word to give the
 * experience a contemplative pace.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/DharmaMirrorCard.tsx`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { KarmaCategory } from './types';
import { CATEGORY_COLORS } from './types';

interface DharmaMirrorCardProps {
  text: string;
  category: KarmaCategory;
  /** Milliseconds between each word reveal (default 65). */
  wordSpeed?: number;
}

export function DharmaMirrorCard({
  text,
  category,
  wordSpeed = 65,
}: DharmaMirrorCardProps): React.JSX.Element {
  const color = CATEGORY_COLORS[category];
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    if (words.length === 0) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i >= words.length) clearInterval(id);
    }, wordSpeed);
    return () => clearInterval(id);
  }, [words, wordSpeed]);

  return (
    <View style={[styles.container, { borderLeftColor: `${color}66` }]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
      <Animated.Text style={styles.text}>
        {words.slice(0, revealedCount).join(' ')}
        {revealedCount < words.length ? ' ' : ''}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 2,
    paddingLeft: 16,
    paddingRight: 4,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: -5,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 2,
  },
  text: {
    color: '#F0EBE1',
    fontSize: 16,
    lineHeight: 30,
    fontStyle: 'italic',
    fontWeight: '300',
  },
});
