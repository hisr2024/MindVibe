/**
 * Subscription Plans — Google Play Billing / App Store IAP.
 *
 * Shows the three paid tiers (Bhakta, Sadhak, Siddha) with a monthly /
 * annual toggle. Prices are pulled from the store so they honour the
 * user's locale and currency (USD, EUR, INR — whatever Play/StoreKit
 * returns). Purchase is mediated by `purchaseSubscription()`, which
 * drives the native Billing sheet, verifies the receipt server-side,
 * then acknowledges on success.
 *
 * Policy notes:
 * - Play / App Store require in-app subscriptions go through their
 *   billing SDK — no alternative payment methods shown on this screen.
 * - Prices shown are the store's `localizedPrice` (not hardcoded),
 *   which is required by Play content policy.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DivineScreenWrapper,
  SacredCard,
  GoldenDivider,
  OmLoader,
} from '@kiaanverse/ui';
import {
  getProducts,
  purchaseSubscription,
  restorePurchases,
  TIER_CONFIGS,
  type BillingPeriod,
  type IAPProduct,
} from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';

const PAID_TIERS: readonly SubscriptionTier[] = ['bhakta', 'sadhak', 'siddha'];

const TIER_COPY: Record<
  Exclude<SubscriptionTier, 'free'>,
  {
    sanskrit: string;
    subtitle: string;
    gradient: readonly [string, string];
    recommended?: boolean;
  }
> = {
  bhakta: {
    sanskrit: 'भक्त',
    subtitle: 'The Devotee',
    gradient: ['#1B4FBB', '#0E7490'],
  },
  sadhak: {
    sanskrit: 'साधक',
    subtitle: 'The Sacred Path',
    gradient: ['#6B3FC4', '#1B4FBB'],
    recommended: true,
  },
  siddha: {
    sanskrit: 'सिद्ध',
    subtitle: 'The Realized One',
    gradient: ['#D4A017', '#F0C040'],
  },
};

export default function SubscriptionPlansScreen(): React.JSX.Element {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [selected, setSelected] = useState<Exclude<SubscriptionTier, 'free'>>('sadhak');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fetched = await getProducts();
        if (mounted) setProducts(fetched);
      } catch (err) {
        console.warn('Failed to load IAP products:', err);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const priceFor = useCallback(
    (tier: Exclude<SubscriptionTier, 'free'>, period: BillingPeriod): string => {
      const match = products.find((p) => p.tier === tier && p.billingPeriod === period);
      if (match) return match.price;
      return TIER_CONFIGS[tier].priceDisplay[period].usd;
    },
    [products],
  );

  const handleSubscribe = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    try {
      await purchaseSubscription(selected, billing, {
        onComplete: (result) => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace({
            pathname: '/(app)/subscription/success',
            params: { tier: result.tier },
          });
        },
        onError: (message) => {
          if (message === 'Purchase cancelled.') return;
          Alert.alert('Purchase unsuccessful', message);
        },
      });
    } finally {
      setPurchasing(false);
    }
  }, [selected, billing]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchases restored',
          `Your ${TIER_CONFIGS[result.tier].name} subscription is active.`,
          [{ text: 'Continue', onPress: () => router.back() }],
        );
      } else {
        Alert.alert('Nothing to restore', result.error ?? 'No active subscription found.');
      }
    } finally {
      setRestoring(false);
    }
  }, []);

  const cta = (() => {
    const price = priceFor(selected, billing);
    const period = billing === 'monthly' ? '/month' : '/year';
    return `Begin with ${TIER_CONFIGS[selected].name} · ${price}${period}`;
  })();

  if (loadingProducts) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label="Opening the sacred store…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Begin Your Sacred Journey</Text>
          <Text style={styles.subtitle}>
            Choose the path that calls to your dharma
          </Text>
        </View>

        <View style={styles.toggleRow}>
          {(['monthly', 'yearly'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.toggleBtn, billing === period && styles.toggleBtnActive]}
              onPress={() => {
                setBilling(period);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.toggleText, billing === period && styles.toggleTextActive]}
              >
                {period === 'monthly' ? 'Monthly' : 'Annual  ·  Save ~40%'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {PAID_TIERS.map((tier) => {
          const copy = TIER_COPY[tier as Exclude<SubscriptionTier, 'free'>];
          const config = TIER_CONFIGS[tier];
          const isSelected = selected === tier;
          const price = priceFor(tier as Exclude<SubscriptionTier, 'free'>, billing);
          const features = featureListFor(tier);

          return (
            <TouchableOpacity
              key={tier}
              onPress={() => {
                setSelected(tier as Exclude<SubscriptionTier, 'free'>);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.85}
              style={styles.planWrapper}
            >
              <SacredCard
                style={StyleSheet.flatten([
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ])}
              >
                {copy.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Most Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{config.name}</Text>
                    <Text style={styles.planSanskrit}>{copy.sanskrit}</Text>
                    <Text style={styles.planSubtitle}>{copy.subtitle}</Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={styles.price}>{price}</Text>
                    <Text style={styles.pricePer}>
                      {billing === 'monthly' ? '/month' : '/year'}
                    </Text>
                  </View>
                </View>

                <GoldenDivider style={{ marginVertical: 12 }} />

                {features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={styles.featureDot}>✦</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheck}>✓ Selected</Text>
                  </View>
                )}
              </SacredCard>
            </TouchableOpacity>
          );
        })}

        <View style={styles.legalBlock}>
          <Text style={styles.legalText}>
            Billed via Google Play / App Store. Subscriptions auto-renew unless
            cancelled at least 24 hours before the end of the current period.
            Manage or cancel anytime in your store account.
          </Text>
          <TouchableOpacity onPress={handleRestore} disabled={restoring}>
            <Text style={styles.restoreText}>
              {restoring ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.stickyBottom}>
        {purchasing ? (
          <View style={styles.loadingBtn}>
            <ActivityIndicator color="#D4A017" />
            <Text style={styles.loadingText}>Opening sacred payment…</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.85}>
            <LinearGradient
              colors={TIER_COPY[selected].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeBtn}
            >
              <Text style={styles.subscribeBtnText}>{cta}</Text>
              <Text style={styles.subscribeBtnSub}>
                Cancel anytime in your store settings
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </DivineScreenWrapper>
  );
}

function featureListFor(tier: SubscriptionTier): string[] {
  const f = TIER_CONFIGS[tier].features;
  const lines: string[] = [];
  if (f.kiaanDivineChat) lines.push('KIAAN Divine Chat');
  if (f.kiaanVoiceCompanion) lines.push('Divine Voice Companion');
  if (f.kiaanSoulReading) lines.push('Soul Reading insights');
  if (f.kiaanQuantumDive) lines.push('Quantum Dive journeys');
  if (f.encryptedJournal) lines.push('Encrypted Sacred Journal');
  if (f.advancedAnalytics) lines.push('KarmaLytix insights');
  if (f.offlineAccess) lines.push('Offline access');
  if (f.dedicatedSupport) lines.push('Dedicated support');
  else if (f.prioritySupport) lines.push('Priority support');
  return lines.slice(0, 6);
}

const GOLD = '#D4A017';
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.5)',
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: 'rgba(240,235,225,0.5)',
  },
  toggleTextActive: { color: GOLD },
  planWrapper: { marginHorizontal: 16, marginBottom: 12 },
  planCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.1)',
  },
  planCardSelected: {
    borderColor: 'rgba(212,160,23,0.5)',
    borderWidth: 1.5,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: '#050714',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
  },
  planSanskrit: {
    fontSize: 14,
    fontFamily: 'NotoSansDevanagari-Regular',
    color: GOLD,
    marginTop: 1,
  },
  planSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.4)',
    marginTop: 3,
  },
  priceBlock: { alignItems: 'flex-end' },
  price: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: GOLD,
  },
  pricePer: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.4)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  featureDot: { fontSize: 10, color: GOLD },
  featureText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.8)',
  },
  selectedIndicator: { marginTop: 12, alignItems: 'center' },
  selectedCheck: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: GOLD,
  },
  legalBlock: {
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    gap: 10,
  },
  legalText: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.35)',
    textAlign: 'center',
    lineHeight: 16,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: GOLD,
    marginTop: 4,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: 'rgba(5,7,20,0.97)',
  },
  subscribeBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
  },
  subscribeBtnSub: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  loadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.6)',
  },
});
