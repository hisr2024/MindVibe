/**
 * Screen wrapper with SafeAreaView and themed background.
 *
 * Supports an optional `gradient` prop that replaces the flat solid
 * background with a divine cosmic gradient (DivineBackground).
 * Backward-compatible — existing screens remain unchanged.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { DivineBackground, type DivineBackgroundVariant } from './DivineBackground';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  /** Enable cosmic gradient background. @default false */
  gradient?: boolean;
  /** Gradient variant when `gradient` is true. @default 'cosmic' */
  gradientVariant?: DivineBackgroundVariant;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  gradient = false,
  gradientVariant = 'cosmic',
}: ScreenProps): React.JSX.Element {
  const { theme } = useTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>
      {children}
    </View>
  );

  if (gradient) {
    return (
      <DivineBackground variant={gradientVariant} style={[styles.container, style]}>
        <SafeAreaView edges={edges} style={styles.container}>
          {content}
        </SafeAreaView>
      </DivineBackground>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
