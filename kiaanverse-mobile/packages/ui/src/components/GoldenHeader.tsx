/**
 * GoldenHeader — Page header with Cinzel font title and optional back button.
 *
 * Animated entrance via Reanimated FadeInDown layout animation.
 * Matches the Kiaanverse cinematic aesthetic — no standard header chrome.
 */

import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { textPresets } from '../tokens/typography';
import { duration, accessibility } from '../tokens/motion';

/** Props for the GoldenHeader component. */
export interface GoldenHeaderProps {
  /** Header title text — rendered in Cinzel display font. */
  readonly title: string;
  /** If provided, shows a back chevron and calls this on press. */
  readonly onBack?: () => void;
  /** Optional ReactNode rendered on the right side (e.g. IconButton). */
  readonly rightAction?: React.ReactNode;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

function GoldenHeaderInner({
  title,
  onBack,
  rightAction,
  style,
  testID,
}: GoldenHeaderProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Animated.View
      entering={FadeInDown.duration(duration.slow).springify()}
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="header"
    >
      {/* Left: Back button or spacer */}
      {onBack !== undefined ? (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={c.accent} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      {/* Center: Title */}
      <Animated.Text
        style={[styles.title, { color: c.textPrimary }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Animated.Text>

      {/* Right: Optional action or spacer */}
      {rightAction !== undefined ? (
        <View style={styles.rightSlot}>{rightAction}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </Animated.View>
  );
}

/** Cinematic page header with Cinzel title, animated entrance, and optional navigation. */
export const GoldenHeader = React.memo(GoldenHeaderInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: spacing.headerHeight,
  },
  backButton: {
    width: accessibility.minTouchTarget,
    height: accessibility.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: accessibility.minTouchTarget,
  },
  title: {
    ...textPresets.h1,
    flex: 1,
    textAlign: 'center',
  },
  rightSlot: {
    width: accessibility.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
