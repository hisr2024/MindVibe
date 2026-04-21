/**
 * Subscription Plans — four tier cards + billing toggle + Play Billing.
 *
 * Layout:
 *   1. Title + subtitle.
 *   2. BillingToggle: Monthly | Annual · save 40 %.
 *   3. SubscriptionPlanCard x 4 — Free Seeker, Bhakta, Sadhak, Siddha.
 *      Each card carries its tier-specific motion (shimmer / breath /
 *      static) and a consistent visual identity from tierIdentity.ts.
 *   4. Sticky footer CTA — opens the native Play Billing / App Store
 *      sheet via `purchaseSubscription()`. While the sheet opens and
 *      the purchase is being verified, we render the sacred OmLoader
 *      instead of ActivityIndicator so the loading state itself feels
 *      like part of the ceremony.
 *   5. Legal fine print + "Restore purchases" link.
 *
 * Routing: on successful purchase the user is replaced into
 * `/(app)/subscription/success?tier=…`, which runs the
 * CompletionCelebration + ConfettiCannon darshan moment.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DivineScreenWrapper,
  OmLoader,
} from '@kiaanverse/ui';
import {
  apiClient,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  TIER_CONFIGS,
  TIER_RANK,
  type BillingPeriod,
  type IAPProduct,
} from '@kiaanverse/api';
import type { SubscriptionTier } from '@kiaanverse/store';

import {
  BillingToggle,
  SubscriptionPlanCard,
  tierIdentity,
} from '../../../components/subscription';

// React Native / Expo global — always defined at runtime.
declare const __DEV__: boolean;

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';
const GOLD = '#D4A017';

const ALL_TIERS: readonly SubscriptionTier[] = [
  'free',
  'bhakta',
  'sadhak',
  'siddha',
];

/** The pay-able tiers — used by the CTA path. */
type PaidTier = Exclude<SubscriptionTier, 'free'>;

interface CurrentSubscriptionMini {
  readonly tier: SubscriptionTier;
  readonly billing: BillingPeriod | null;
}

export default function SubscriptionPlansScreen(): React.JSX.Element {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [selected, setSelected] = useState<SubscriptionTier>('sadhak');
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [current, setCurrent] = useState<CurrentSubscriptionMini>({
    tier: 'free',
    billing: null,
  });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [fetched, currentRes] = await Promise.all([
          getProducts(),
          apiClient
            .get<{
              effective_tier: SubscriptionTier | null;
              plan: {
                tier: SubscriptionTier;
                billing_period?: BillingPeriod;
              } | null;
              store_product_id: string | null;
            }>('/api/subscriptions/current')
            .catch(() => null),
        ]);

        if (!alive) return;
        setProducts(fetched);

        const data = currentRes?.data;
        const tier = data?.effective_tier ?? data?.plan?.tier ?? 'free';
        const billingFromSku = deriveBillingFromSku(
          data?.store_product_id ?? null,
        );
        const resolvedBilling: BillingPeriod | null =
          billingFromSku ?? data?.plan?.billing_period ?? null;
        setCurrent({ tier, billing: resolvedBilling });
      } catch (err) {
        if (__DEV__) console.warn('Failed to load IAP products:', err);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const priceFor = useCallback(
    (tier: PaidTier, period: BillingPeriod): string => {
      const match = products.find(
        (p) => p.tier === tier && p.billingPeriod === period,
      );
      if (match) return match.price;
      return TIER_CONFIGS[tier].priceDisplay[period].usd;
    },
    [products],
  );

  const handleSelect = useCallback((tier: SubscriptionTier) => {
    setSelected(tier);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (selected === 'free') return;
    const tier = selected as PaidTier;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    try {
      await purchaseSubscription(tier, billing, {
        onComplete: (result) => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
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
        Alert.alert(
          'Nothing to restore',
          result.error ?? 'No active subscription found.',
        );
      }
    } finally {
      setRestoring(false);
    }
  }, []);

  const ctaMeta = useMemo(() => {
    if (selected === 'free') {
      return {
        label: 'Continue with Free Seeker',
        sub: 'Sign in anytime to upgrade to a sacred tier',
        disabled: true,
      } as const;
    }
    const price = priceFor(selected as PaidTier, billing);
    const period = billing === 'monthly' ? '/month' : '/year';
    const identity = tierIdentity(selected);
    const action = resolveCtaAction(current, selected as PaidTier, billing);
    if (action === 'current') {
      return {
        label: `You are on ${identity.name} · ${price}${period}`,
        sub: 'Manage or cancel in your store settings',
        disabled: true,
      } as const;
    }
    if (action === 'upgrade') {
      return {
        label: `Upgrade to ${identity.name} · ${price}${period}`,
        sub: 'Prorated instantly · Billed via your store account',
        disabled: false,
      } as const;
    }
    if (action === 'downgrade') {
      return {
        label: `Switch to ${identity.name} · ${price}${period}`,
        sub: 'Takes effect at the end of your current period',
        disabled: false,
      } as const;
    }
    return {
      label: `Begin with ${identity.name} · ${price}${period}`,
      sub: 'Cancel anytime in your store settings',
      disabled: false,
    } as const;
  }, [billing, current, priceFor, selected]);

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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Begin Your Sacred Journey</Text>
          <Text style={styles.subtitle}>
            Choose the path that calls to your dharma
          </Text>
        </View>

        <View style={styles.togglePad}>
          <BillingToggle value={billing} onChange={setBilling} />
        </View>

        <View style={styles.planStack}>
          {ALL_TIERS.map((tier) => {
            const isFree = tier === 'free';
            const price = isFree
              ? 'Free'
              : priceFor(tier as PaidTier, billing);
            const pricePeriod = isFree
              ? 'forever'
              : billing === 'monthly'
                ? '/month'
                : '/year';
            const features = featureListFor(tier);

            // For annual plans on paid tiers, surface a per-month
            // equivalent label so users feel the saving viscerally.
            let perMonthEquivalent: string | undefined;
            let originalPrice: string | undefined;
            if (!isFree && billing === 'yearly') {
              const yearly = TIER_CONFIGS[tier].prices.yearly.usd;
              const monthly = TIER_CONFIGS[tier].prices.monthly.usd;
              if (yearly > 0 && monthly > 0) {
                const perMonth = yearly / 12;
                perMonthEquivalent = `≈ $${perMonth.toFixed(2)}/mo`;
                const annualIfMonthly = monthly * 12;
                if (annualIfMonthly > yearly) {
                  originalPrice = `$${annualIfMonthly.toFixed(0)}`;
                }
              }
            }

            return (
              <SubscriptionPlanCard
                key={tier}
                tier={tier}
                price={price}
                pricePeriod={pricePeriod}
                {...(perMonthEquivalent !== undefined
                  ? { perMonthEquivalent }
                  : {})}
                {...(originalPrice !== undefined ? { originalPrice } : {})}
                features={features}
                selected={selected === tier}
                onPress={() => handleSelect(tier)}
              />
            );
          })}
        </View>

        <View style={styles.legal}>
          <Text style={styles.legalText}>
            Billed via Google Play / App Store. Subscriptions auto-renew
            unless cancelled at least 24 hours before the end of the
            current period. Manage or cancel anytime in your store
            account.
          </Text>
          <View style={styles.legalLinks}>
            <Pressable
              onPress={() => {
                void Linking.openURL('https://kiaanverse.com/terms');
              }}
            >
              <Text style={styles.legalLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => {
                void Linking.openURL('https://kiaanverse.com/privacy');
              }}
            >
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
          </View>
          <Pressable onPress={handleRestore} disabled={restoring}>
            <Text style={styles.restoreText}>
              {restoring ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA — opens native Play Billing / StoreKit sheet. */}
      <View style={styles.stickyBottom}>
        {purchasing ? (
          <View style={styles.ctaLoading}>
            <OmLoader size={36} label="Opening sacred payment…" />
          </View>
        ) : (
          <Pressable
            onPress={handleSubscribe}
            disabled={ctaMeta.disabled}
            accessibilityRole="button"
            accessibilityLabel={ctaMeta.label}
            accessibilityState={{ disabled: ctaMeta.disabled }}
          >
            <LinearGradient
              colors={
                selected === 'free'
                  ? (['rgba(240,235,225,0.15)', 'rgba(240,235,225,0.08)'] as unknown as string[])
                  : (tierIdentity(selected).gradient as unknown as string[])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.ctaBtn,
                ctaMeta.disabled && styles.ctaBtnDisabled,
              ]}
            >
              <Text style={styles.ctaLabel}>{ctaMeta.label}</Text>
              <Text style={styles.ctaSub}>{ctaMeta.sub}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </DivineScreenWrapper>
  );
}

// ---------------------------------------------------------------------------
// Helpers — preserved from the previous implementation so the CTA intent
// logic doesn't drift between plan-screen revisions.
// ---------------------------------------------------------------------------

type CtaAction = 'subscribe' | 'upgrade' | 'downgrade' | 'current';

function resolveCtaAction(
  current: CurrentSubscriptionMini,
  selected: PaidTier,
  billing: BillingPeriod,
): CtaAction {
  if (current.tier === 'free') return 'subscribe';
  if (current.tier === selected && current.billing === billing) return 'current';

  const currentRank = TIER_RANK[current.tier];
  const selectedRank = TIER_RANK[selected];
  if (selectedRank > currentRank) return 'upgrade';
  if (
    selectedRank === currentRank &&
    current.billing === 'monthly' &&
    billing === 'yearly'
  ) {
    return 'upgrade';
  }
  return 'downgrade';
}

function deriveBillingFromSku(sku: string | null): BillingPeriod | null {
  if (!sku) return null;
  if (sku.endsWith('.yearly')) return 'yearly';
  if (sku.endsWith('.monthly')) return 'monthly';
  return null;
}

function featureListFor(tier: SubscriptionTier): string[] {
  const f = TIER_CONFIGS[tier].features;
  const lines: string[] = [];
  if (tier === 'free') {
    lines.push('Daily wisdom & mood tracking');
    if (f.kiaanDivineChat) lines.push('5 KIAAN questions / month');
    lines.push('One active wisdom journey');
    return lines;
  }
  if (f.kiaanDivineChat) {
    lines.push(
      tier === 'bhakta'
        ? '50 KIAAN questions / month'
        : tier === 'sadhak'
          ? '300 KIAAN questions / month'
          : 'Unlimited KIAAN questions',
    );
  }
  if (f.kiaanVoiceCompanion) lines.push('Divine Voice Companion');
  if (f.kiaanSoulReading) lines.push('Soul Reading insights');
  if (f.kiaanQuantumDive) lines.push('Quantum Dive journeys');
  if (f.encryptedJournal) lines.push('Encrypted Sacred Journal');
  if (f.advancedAnalytics) lines.push('KarmaLytix insights');
  if (f.offlineAccess) lines.push('Offline access');
  if (f.arthaReframing) lines.push('Ardha reframing tool');
  if (f.viyogaDetachment) lines.push('Viyoga detachment practice');
  if (f.relationshipCompass) lines.push('Relationship Compass');
  if (f.dedicatedSupport) lines.push('Dedicated support');
  else if (f.prioritySupport) lines.push('Priority support');
  // 8 max to match the spec's "8 listed" Sadhak ask.
  return lines.slice(0, tier === 'siddha' ? 8 : tier === 'sadhak' ? 8 : 5);
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 6,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 26,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
  },
  togglePad: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  planStack: {
    paddingHorizontal: 16,
    gap: 14,
  },
  legal: {
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  legalText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(240,235,225,0.4)',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(240,235,225,0.6)',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(240,235,225,0.4)',
  },
  restoreText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: GOLD,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: 'rgba(5,7,20,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,160,23,0.18)',
  },
  ctaBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    opacity: 0.55,
  },
  ctaLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  ctaSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    textAlign: 'center',
  },
  ctaLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
