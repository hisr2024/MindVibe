/**
 * Subscription Success — post-purchase confirmation.
 *
 * Reached via `router.replace('/(app)/subscription/success?tier=X')` from
 * plans.tsx once the receipt has been verified server-side. Displays a
 * short darshan moment — Om, golden confetti, the Sanskrit name of the
 * tier just entered, then back to the tabs.
 *
 * The Sanskrit label mirrors the plans screen (भक्त / साधक / सिद्ध) so
 * the user recognizes what they chose rather than reading an English
 * descriptor they just tapped past. Free tier is included for
 * completeness but is never reached in practice — a successful purchase
 * always resolves to a paid SubscriptionTier.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ConfettiCannon,
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

/**
 * Sanskrit (Devanagari) label for each paid tier, matching the plans
 * screen. Free is included only so the Record is exhaustive — the
 * success flow never renders it.
 */
const TIER_SANSKRIT: Record<SubscriptionTier, string> = {
  free: '',
  bhakta: 'भक्त',
  sadhak: 'साधक',
  siddha: 'सिद्ध',
};

export default function SubscriptionSuccessScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ tier?: string }>();
  const tier: SubscriptionTier =
    params.tier && VALID_TIERS.has(params.tier as SubscriptionTier)
      ? (params.tier as SubscriptionTier)
      : 'sadhak';

  // Gate the confetti with state so ConfettiCannon's `isActive` transitions
  // false → true after the first render. Passing `true` as the initial
  // value skips the trigger effect the component uses to reset particles.
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebrating(true);
  }, []);

  const tierName = TIER_CONFIGS[tier].name;
  const sanskrit = TIER_SANSKRIT[tier];

  return (
    <DivineScreenWrapper>
      <ConfettiCannon isActive={celebrating} particleCount={60} duration={3500} />
      <View style={styles.center}>
        <Text style={styles.om}>ॐ</Text>
        <Text style={styles.title}>Your Sankalpa Is Made</Text>
        {sanskrit ? <Text style={styles.sanskrit}>{sanskrit}</Text> : null}
        <Text style={styles.subtitle}>
          The sacred path opens before you.{'\n'}
          Welcome, {tierName}.
        </Text>

        <View style={styles.button}>
          <DivineButton
            title="Begin Your Sacred Journey"
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
    marginBottom: 8,
  },
  sanskrit: {
    fontSize: 40,
    fontFamily: 'NotoSansDevanagari-Regular',
    color: '#D4A017',
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
