/**
 * Journey Detail Screen
 *
 * Deep link target: kiaanverse://journey/:id
 * Shows details for a specific spiritual journey.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  Text,
  GoldenHeader,
  LoadingMandala,
  Card,
  colors,
  spacing,
} from '@kiaanverse/ui';

export default function JourneyDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Journey detail API hook would go here when ready.
  // For now, display the journey ID with a placeholder layout.

  return (
    <Screen scroll>
      <GoldenHeader
        title="Journey"
        onBack={() => router.back()}
        testID="journey-detail-header"
      />

      <View style={styles.content}>
        <Card>
          <Text variant="h3" color={colors.primary[300]}>
            Journey Details
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} style={styles.idText}>
            ID: {id}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            Journey content and step progression will appear here when the
            journey detail API endpoint is connected.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  idText: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});
