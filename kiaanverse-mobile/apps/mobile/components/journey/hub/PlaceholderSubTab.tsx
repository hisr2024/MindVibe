/**
 * PlaceholderSubTab — Lightweight stub used by Battleground / Wisdom while
 * those screens are being ported in their own iteration. Uses the same
 * page chrome as the live sub-tabs so the orchestrator's animation layer
 * has consistent layout.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

export function PlaceholderSubTab({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text variant="h2" color={colors.divine.aura} align="center">
          {title}
        </Text>
        <Text variant="body" color={colors.text.secondary} align="center">
          {description}
        </Text>
        <Text variant="caption" color={colors.text.muted} align="center">
          Coming next — alignment with kiaanverse.com mobile is in progress.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
});
