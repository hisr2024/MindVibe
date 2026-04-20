/**
 * Small notification/status badge.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';

interface BadgeProps {
  count?: number;
  visible?: boolean;
  color?: string;
  /** Text label rendered instead of a count (used by tag-style badges). */
  label?: string;
}

export function Badge({
  count,
  visible = true,
  color = colors.semantic.error,
  label,
}: BadgeProps): React.JSX.Element | null {
  if (!visible) return null;

  if (label !== undefined) {
    return (
      <View style={[styles.badge, styles.withCount, { backgroundColor: color, position: 'relative', top: 0, right: 0 }]}>
        <Text style={styles.text}>{label}</Text>
      </View>
    );
  }

  const showCount = count !== undefined && count > 0;
  const displayText = count !== undefined && count > 99 ? '99+' : String(count ?? '');

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color },
        showCount ? styles.withCount : styles.dot,
      ]}
    >
      {showCount ? (
        <Text style={styles.text}>{displayText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  withCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
