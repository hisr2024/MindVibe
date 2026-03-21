/**
 * Small notification/status badge.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';

interface BadgeProps {
  count?: number;
  visible?: boolean;
  color?: string;
}

export function Badge({
  count,
  visible = true,
  color = colors.semantic.error,
}: BadgeProps): React.JSX.Element | null {
  if (!visible) return null;

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
