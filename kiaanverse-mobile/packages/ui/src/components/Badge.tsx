/**
 * Small notification/status badge.
 *
 * Two rendering modes:
 * - Numeric dot (default): pass `count` to show an absolutely-positioned
 *   unread indicator over an icon.
 * - Inline label pill: pass `label` to render a self-positioned pill
 *   (e.g. "Active", "Completed"). In this mode the badge is static-flow,
 *   not absolute.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

interface BadgeProps {
  /** Numeric count for dot-style badge (absolutely positioned). */
  count?: number;
  /** Text label for pill-style badge (inline layout). */
  label?: string;
  /** Show/hide. @default true */
  visible?: boolean;
  /** Pill/dot background colour. */
  color?: string;
  /** Extra style override (applied to the outer view). */
  style?: ViewStyle;
}

export function Badge({
  count,
  label,
  visible = true,
  color,
  style,
}: BadgeProps): React.JSX.Element | null {
  if (!visible) return null;

  // Pill-style (label) takes precedence over numeric dot.
  if (label !== undefined) {
    const bg = color ?? colors.alpha.goldLight;
    return (
      <View style={[styles.pill, { backgroundColor: bg }, style]}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
    );
  }

  const dotColor = color ?? colors.semantic.error;
  const showCount = count !== undefined && count > 0;
  const displayText = count !== undefined && count > 99 ? '99+' : String(count ?? '');

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: dotColor },
        showCount ? styles.withCount : styles.dot,
        style,
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
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillText: {
    color: colors.divine.aura,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
