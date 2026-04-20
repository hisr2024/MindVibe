/**
 * My Subscription — current plan status + management.
 *
 * Shows the signed-in user's active subscription from the backend
 * (`GET /api/subscriptions/current`) and provides entry points to
 * upgrade, change plan, restore, or manage on the store.
 *
 * Policy notes:
 * - Cancellation MUST happen in the Play Store / App Store account
 *   screen — in-app cancel flows are not permitted for auto-renewing
 *   subscriptions purchased via IAP. We deep-link out via `Linking`.
 * - Restore is provided for users re-installing or switching devices.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  DivineButton,
  DivineScreenWrapper,
  GoldenDivider,
  OmLoader,
  SacredCard,
} from '@kiaanverse/ui';
import {
  apiClient,
  restorePurchases,
  TIER_CONFIGS,
} from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';

// Matches the backend `UserSubscriptionOut` shape — only the fields we use.
interface UserSubscriptionResponse {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: {
    tier: SubscriptionTier;
    name: string;
    billing_period?: 'monthly' | 'yearly';
    price_monthly?: number;
    price_yearly?: number;
    currency?: string;
  } | null;
  effective_tier: SubscriptionTier | null;
}

const ANDROID_PACKAGE = 'com.kiaanverse.app';

function manageSubscriptionUrl(productId?: string): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  if (productId) {
    return `https://play.google.com/store/account/subscriptions?sku=${productId}&package=${ANDROID_PACKAGE}`;
  }
  return 'https://play.google.com/store/account/subscriptions';
}

export default function MySubscriptionScreen(): React.JSX.Element {
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<UserSubscriptionResponse | null>(
          '/api/subscriptions/current',
        );
        if (mounted) setSubscription(res.data);
      } catch (err) {
        console.warn('Failed to load subscription:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tier: SubscriptionTier =
    subscription?.effective_tier ?? subscription?.plan?.tier ?? 'free';
  const isFree = tier === 'free';
  const renewsAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const willCancel = subscription?.cancel_at_period_end ?? false;

  const handleManage = useCallback(() => {
    void Haptics.selectionAsync();
    const url = manageSubscriptionUrl();
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Unable to open store',
        Platform.OS === 'ios'
          ? 'Please open Settings → Apple ID → Subscriptions.'
          : 'Please open the Google Play Store → Menu → Subscriptions.',
      );
    });
  }, []);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchases restored',
          `Your ${TIER_CONFIGS[result.tier].name} subscription is active.`,
        );
      } else {
        Alert.alert(
          'Nothing to restore',
          result.error ?? 'No active subscription was found for this account.',
        );
      }
    } finally {
      setRestoring(false);
    }
  }, []);

  if (loading) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label="Loading your subscription…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
      >
        <Text style={styles.title}>My Subscription</Text>

        <SacredCard style={styles.statusCard}>
          <Text style={styles.tierLabel}>
            {isFree ? 'Free Seeker' : `✦ ${TIER_CONFIGS[tier].name}`}
          </Text>
          <Text style={styles.tierSubtitle}>{TIER_CONFIGS[tier].description}</Text>

          {!isFree && (
            <>
              <GoldenDivider style={{ marginVertical: 14 }} />

              <DetailRow
                label={willCancel ? 'Access until' : 'Next renewal'}
                value={renewsAt ? formatDate(renewsAt) : '—'}
              />
              <DetailRow
                label="Status"
                value={willCancel ? 'Cancels at period end' : 'Active'}
                valueColor={willCancel ? '#EF4444' : '#10B981'}
              />
              {subscription?.plan?.billing_period && (
                <DetailRow
                  label="Billing"
                  value={
                    subscription.plan.billing_period === 'yearly' ? 'Annual' : 'Monthly'
                  }
                />
              )}
            </>
          )}
        </SacredCard>

        <View style={styles.actions}>
          {isFree ? (
            <DivineButton
              title="Upgrade to Bhakta / Sadhak / Siddha"
              onPress={() => router.push('/(app)/subscription/plans')}
              variant="primary"
            />
          ) : (
            <>
              <DivineButton
                title="Change Plan"
                onPress={() => router.push('/(app)/subscription/plans')}
                variant="secondary"
              />
              <DivineButton
                title={
                  Platform.OS === 'ios'
                    ? 'Manage on App Store'
                    : 'Manage on Google Play'
                }
                onPress={handleManage}
                variant="ghost"
              />
            </>
          )}

          <DivineButton
            title={restoring ? 'Restoring…' : 'Restore Purchases'}
            onPress={handleRestore}
            variant="ghost"
            loading={restoring}
            disabled={restoring}
          />
        </View>

        <Text style={styles.footnote}>
          Subscriptions are billed and managed by{' '}
          {Platform.OS === 'ios' ? 'the App Store' : 'Google Play'}. Cancel anytime
          in your store account — access continues until the end of the current
          billing period.
        </Text>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{label}</Text>
      <Text style={[styles.detailVal, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
    marginTop: 60,
    marginBottom: 20,
  },
  statusCard: { padding: 20, marginBottom: 20 },
  tierLabel: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#D4A017',
    textAlign: 'center',
  },
  tierSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.55)',
    textAlign: 'center',
    marginTop: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailKey: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.5)',
  },
  detailVal: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#F0EBE1',
  },
  actions: { gap: 12, marginBottom: 24 },
  footnote: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.3)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
