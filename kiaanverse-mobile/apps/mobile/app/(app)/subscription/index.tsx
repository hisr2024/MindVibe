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
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  openManageSubscription,
  restorePurchases,
  TIER_CONFIGS,
} from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

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
    product_id?: string;
  } | null;
  effective_tier: SubscriptionTier | null;
}

export default function MySubscriptionScreen(): React.JSX.Element {
  const { t, locale } = useTranslation();
  const [subscription, setSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<UserSubscriptionResponse | null>(
          '/api/subscriptions/current'
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
    const sku = subscription?.plan?.product_id;
    openManageSubscription(sku).catch(() => {
      Alert.alert(
        t('subscription.alertUnableToOpenTitle'),
        Platform.OS === 'ios'
          ? t('subscription.alertUnableToOpenIos')
          : t('subscription.alertUnableToOpenAndroid'),
      );
    });
  }, [subscription?.plan?.product_id, t]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Alert.alert(
          t('subscription.alertRestoredTitle'),
          t('subscription.alertRestoredBody', {
            tierName: TIER_CONFIGS[result.tier].name,
          }),
        );
      } else {
        Alert.alert(
          t('subscription.alertNothingTitle'),
          result.error ?? t('subscription.alertNothingBody'),
        );
      }
    } finally {
      setRestoring(false);
    }
  }, [t]);

  if (loading) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label={t('subscription.loadingMine')} />
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
        <Text style={styles.title}>{t('subscription.myTitle')}</Text>

        <SacredCard style={styles.statusCard}>
          <Text style={styles.tierLabel}>
            {isFree
              ? t('subscription.freeSeekerLabel')
              : `${t('subscription.tierLabelPrefix')} ${TIER_CONFIGS[tier].name}`}
          </Text>
          <Text style={styles.tierSubtitle}>
            {TIER_CONFIGS[tier].description}
          </Text>

          {!isFree && (
            <>
              <GoldenDivider style={{ marginVertical: 14 }} />

              <DetailRow
                label={
                  willCancel
                    ? t('subscription.detailAccessUntil')
                    : t('subscription.detailNextRenewal')
                }
                value={
                  renewsAt
                    ? formatDate(renewsAt, locale)
                    : t('subscription.detailEmptyValue')
                }
              />
              <DetailRow
                label={t('subscription.detailStatus')}
                value={
                  willCancel
                    ? t('subscription.statusCancels')
                    : t('subscription.statusActive')
                }
                valueColor={willCancel ? '#EF4444' : '#10B981'}
              />
              {subscription?.plan?.billing_period && (
                <DetailRow
                  label={t('subscription.detailBilling')}
                  value={
                    subscription.plan.billing_period === 'yearly'
                      ? t('subscription.billingAnnual')
                      : t('subscription.billingMonthly')
                  }
                />
              )}
            </>
          )}
        </SacredCard>

        <View style={styles.actions}>
          {isFree ? (
            <DivineButton
              title={t('subscription.ctaUpgrade')}
              onPress={() => router.push('/(app)/subscription/plans')}
              variant="primary"
            />
          ) : (
            <>
              <DivineButton
                title={t('subscription.ctaChangePlan')}
                onPress={() => router.push('/(app)/subscription/plans')}
                variant="secondary"
              />
              <DivineButton
                title={
                  Platform.OS === 'ios'
                    ? t('subscription.ctaManageAppStore')
                    : t('subscription.ctaManageGooglePlay')
                }
                onPress={handleManage}
                variant="ghost"
              />
            </>
          )}

          <DivineButton
            title={
              restoring
                ? t('subscription.ctaRestoring')
                : t('subscription.ctaRestorePurchases')
            }
            onPress={handleRestore}
            variant="ghost"
            loading={restoring}
            disabled={restoring}
          />
        </View>

        <Text style={styles.footnote}>
          {Platform.OS === 'ios'
            ? t('subscription.footnoteAppStore')
            : t('subscription.footnoteGooglePlay')}
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
      <Text
        style={[styles.detailVal, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Format a date for the renewal/access row using the active i18n locale.
 * Falls back to en-US when the active code isn't a valid Intl tag (e.g.
 * 'sa' has no full Intl support on most engines).
 */
function formatDate(d: Date, locale: string): string {
  let intlLocale = 'en-US';
  try {
    const supported = Intl.DateTimeFormat.supportedLocalesOf([locale]);
    if (supported.length > 0) intlLocale = supported[0]!;
  } catch {
    // keep en-US
  }
  return d.toLocaleDateString(intlLocale, {
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
