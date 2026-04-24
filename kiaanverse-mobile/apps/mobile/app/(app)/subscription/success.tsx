/**
 * Subscription Success — the darshan moment after a sankalpa.
 *
 * Layered sequence (all firing on mount):
 *   1. Haptics.notification(Success).
 *   2. ConfettiCannon — 60 particles, 3.5 s burst.
 *   3. CompletionCelebration — golden radial particles + XP/karma chip.
 *      We repurpose its copy slot to announce the new tier so the
 *      component stays consistent with the rest of the app's
 *      milestones (karma, journey completions).
 *   4. Large ॐ glyph + "Your Sankalpa Is Made" in
 *      CormorantGaramond-BoldItalic 28 px, with the new tier's
 *      Sanskrit name printed large in NotoSansDevanagari.
 *   5. DivineButton primary "Begin Your Sacred Journey" → /(tabs).
 *
 * Tier defaults to "sadhak" if the route parameter is missing or
 * invalid — in practice the plans screen always passes the real tier.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  CompletionCelebration,
  ConfettiCannon,
  DivineButton,
  DivineScreenWrapper,
} from '@kiaanverse/ui';
import { TIER_CONFIGS } from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';
const GOLD = '#D4A017';

const VALID_TIERS: ReadonlySet<SubscriptionTier> = new Set([
  'free',
  'bhakta',
  'sadhak',
  'siddha',
]);

/** Sanskrit (Devanagari) label for each tier. */
const TIER_SANSKRIT: Record<SubscriptionTier, string> = {
  free: '',
  bhakta: 'भक्त',
  sadhak: 'साधक',
  siddha: 'सिद्ध',
};

/**
 * XP / karma badges on the CompletionCelebration are symbolic here —
 * a subscription is not a literal karmic reward. The numbers below
 * were chosen to read as meaningful without implying a specific
 * in-app economy effect. They can be wired to the backend later if
 * the subscription → karma bonus ever becomes a real mechanic.
 */
const CELEBRATION_REWARDS: Record<
  SubscriptionTier,
  { xp: number; karma: number; message: string }
> = {
  free: { xp: 0, karma: 0, message: 'Your journey begins anew.' },
  bhakta: {
    xp: 108,
    karma: 21,
    message: 'The devotee’s path opens before you.',
  },
  sadhak: {
    xp: 216,
    karma: 54,
    message: 'The sacred discipline is yours.',
  },
  siddha: {
    xp: 432,
    karma: 108,
    message: 'All sacred gates are open.',
  },
};

export default function SubscriptionSuccessScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ tier?: string }>();
  const tier: SubscriptionTier =
    params.tier && VALID_TIERS.has(params.tier as SubscriptionTier)
      ? (params.tier as SubscriptionTier)
      : 'sadhak';

  // Both the confetti and CompletionCelebration components gate their
  // particle emitters on `isActive` / `visible` so we flip these from
  // `false → true` on mount to trigger the one-shot burst cleanly.
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Next frame so the effects see the transition cleanly.
    const id = setTimeout(() => setCelebrating(true), 60);
    return () => clearTimeout(id);
  }, []);

  const tierName = TIER_CONFIGS[tier].name;
  const sanskrit = TIER_SANSKRIT[tier];
  // Both records are exhaustive over `SubscriptionTier`, so indexing
  // them is safe; the non-null assertion calms `noUncheckedIndexedAccess`
  // without sacrificing the runtime invariant.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rewards = CELEBRATION_REWARDS[tier]!;

  return (
    <DivineScreenWrapper>
      {/* Golden confetti */}
      <ConfettiCannon
        isActive={celebrating}
        particleCount={60}
        duration={3500}
      />

      {/* Radial particle completion celebration (dismissable overlay that
          we let auto-dismiss after its default duration). */}
      <CompletionCelebration
        visible={celebrating}
        xp={rewards.xp}
        karmaPoints={rewards.karma}
        message={rewards.message}
        duration={4200}
      />

      <View style={styles.center}>
        <Text style={styles.om} accessibilityLabel="Om">
          ॐ
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          Your Sankalpa Is Made
        </Text>
        {sanskrit ? <Text style={styles.sanskrit}>{sanskrit}</Text> : null}
        <Text style={styles.subtitle}>
          The sacred path opens before you.{'\n'}
          Welcome, {tierName}.
        </Text>

        <View style={styles.cta}>
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
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 72,
    lineHeight: 80,
    color: GOLD,
    marginBottom: 24,
    textShadowColor: 'rgba(212,160,23,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 28,
    color: SACRED_WHITE,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 40,
    lineHeight: 54,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 14,
    textShadowColor: 'rgba(212,160,23,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
