/**
 * Subscription Success — post-purchase confirmation.
 *
 * Reached via `router.replace('/(app)/subscription/success?tier=X')` from
 * plans.tsx once the receipt has been verified server-side. Displays a
 * short darshan moment before returning the user to the tabs.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  DivineButton,
  DivineScreenWrapper,
} from '@kiaanverse/ui';
import { TIER_CONFIGS } from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';

const VALID_TIERS: ReadonlySet<SubscriptionTier> = new Set([
  'free',
  'bhakta',
  'sadhak',
  'siddha',
]);

export default function SubscriptionSuccessScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ tier?: string }>();
  const tier: SubscriptionTier =
    params.tier && VALID_TIERS.has(params.tier as SubscriptionTier)
      ? (params.tier as SubscriptionTier)
      : 'sadhak';

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const tierName = TIER_CONFIGS[tier].name;

  return (
    <DivineScreenWrapper>
      <View style={styles.center}>
        <Text style={styles.om}>ॐ</Text>
        <Text style={styles.title}>Your Sankalpa Is Made</Text>
        <Text style={styles.subtitle}>
          The sacred path opens before you.{'\n'}
          Welcome, {tierName}.
        </Text>

        <View style={styles.button}>
          <DivineButton
            title="Begin Your Journey"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
          />
        </View>
      </View>
    </DivineScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  om: {
    fontSize: 72,
    color: '#D4A017',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'CrimsonText-Regular',
    color: 'rgba(240,235,225,0.6)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  button: { alignSelf: 'stretch' },
});
