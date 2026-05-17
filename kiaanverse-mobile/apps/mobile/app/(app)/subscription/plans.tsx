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
import { DivineScreenWrapper, OmLoader } from '@kiaanverse/ui';
import {
  apiClient,
  getProducts,
  getTierPriceDisplay,
  getTierPriceAmount,
  isSubscriptionUnavailableError,
  purchaseSubscription,
  resolveCurrencyFromLocale,
  restorePurchases,
  TIER_CONFIGS,
  TIER_RANK,
  type BillingPeriod,
  type CurrencyCode,
  type IAPProduct,
} from '@kiaanverse/api';
import * as Localization from 'expo-localization';
import type { SubscriptionTier } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

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
  const { t } = useTranslation();
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

  // Device currency for the FALLBACK pricing path — used when the IAP
  // catalog hasn't yet returned localized prices from Play Console. Once
  // ``products`` arrives from getProducts(), each product's ``price`` is
  // already a Play-localized string (e.g. "₹599.00") and the resolver is
  // bypassed. Memoised so render-time price strings are stable.
  const deviceCurrency = useMemo<CurrencyCode>(() => {
    try {
      const locales = Localization.getLocales();
      const primary = locales[0];
      return resolveCurrencyFromLocale(primary?.regionCode, primary?.languageTag);
    } catch {
      return 'usd';
    }
  }, []);
  const currencySymbol = useMemo<string>(() => {
    return deviceCurrency === 'inr' ? '₹' : deviceCurrency === 'eur' ? '€' : '$';
  }, [deviceCurrency]);

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
          data?.store_product_id ?? null
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
      // Play Store / App Store localized price wins when the IAP catalog
      // has loaded — that is the price the user will actually be charged.
      const match = products.find(
        (p) => p.tier === tier && p.billingPeriod === period
      );
      if (match) return match.price;
      // Skeleton state: render in the device currency so an Indian user
      // sees ₹ instead of $ during the brief moment before getProducts()
      // resolves. The static catalog must match Play Console regional pricing.
      return getTierPriceDisplay(tier, period, deviceCurrency);
    },
    [products, deviceCurrency]
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
            Haptics.NotificationFeedbackType.Success
          );
          router.replace({
            pathname: '/(app)/subscription/success',
            params: { tier: result.tier },
          });
        },
        onError: (message) => {
          if (message === 'Purchase cancelled.') return;
          // Distinguish "Play Store hasn't activated the product yet" from
          // real purchase failures so users see a reassuring "Coming soon"
          // rather than a scary "Purchase unsuccessful" on tiers that are
          // still being configured server-side.
          if (isSubscriptionUnavailableError(message)) {
            Alert.alert(
              t('subscription.alertComingSoonTitle'),
              t('subscription.alertComingSoonBody'),
              [{ text: t('common.ok') }],
            );
            return;
          }
          Alert.alert(t('subscription.alertPurchaseFailedTitle'), message);
        },
      });
    } finally {
      setPurchasing(false);
    }
  }, [selected, billing, t]);

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
          [{ text: t('subscription.continueButton'), onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          t('subscription.alertNothingTitle'),
          result.error ?? t('subscription.alertNothingFoundBody'),
        );
      }
    } finally {
      setRestoring(false);
    }
  }, [t]);

  const ctaMeta = useMemo(() => {
    if (selected === 'free') {
      return {
        label: t('subscription.ctaFreeLabel'),
        sub: t('subscription.ctaFreeSub'),
        disabled: true,
      } as const;
    }
    const price = priceFor(selected as PaidTier, billing);
    const period =
      billing === 'monthly'
        ? t('subscription.periodPerMonth')
        : t('subscription.periodPerYear');
    const identity = tierIdentity(selected);
    const action = resolveCtaAction(current, selected as PaidTier, billing);
    const params = { tierName: identity.name, price, period };
    if (action === 'current') {
      return {
        label: t('subscription.ctaCurrentLabel', params),
        sub: t('subscription.ctaCurrentSub'),
        disabled: true,
      } as const;
    }
    if (action === 'upgrade') {
      return {
        label: t('subscription.ctaUpgradeLabel', params),
        sub: t('subscription.ctaUpgradeSub'),
        disabled: false,
      } as const;
    }
    if (action === 'downgrade') {
      return {
        label: t('subscription.ctaSwitchLabel', params),
        sub: t('subscription.ctaSwitchSub'),
        disabled: false,
      } as const;
    }
    return {
      label: t('subscription.ctaBeginLabel', params),
      sub: t('subscription.ctaBeginSub'),
      disabled: false,
    } as const;
  }, [billing, current, priceFor, selected, t]);

  if (loadingProducts) {
    return (
      <DivineScreenWrapper>
        <View style={styles.center}>
          <OmLoader size={48} label={t('subscription.loadingProducts')} />
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
          <Text style={styles.title}>{t('subscription.plansTitle')}</Text>
          <Text style={styles.subtitle}>{t('subscription.plansSubtitle')}</Text>
        </View>

        <View style={styles.togglePad}>
          <BillingToggle value={billing} onChange={setBilling} />
        </View>

        <View style={styles.planStack}>
          {ALL_TIERS.map((tier) => {
            const isFree = tier === 'free';
            const price = isFree
              ? t('subscription.priceFree')
              : priceFor(tier as PaidTier, billing);
            const pricePeriod = isFree
              ? t('subscription.periodForever')
              : billing === 'monthly'
                ? t('subscription.periodPerMonth')
                : t('subscription.periodPerYear');
            const features = featureListFor(tier, t);

            // For annual plans on paid tiers, surface a per-month
            // equivalent label so users feel the saving viscerally.
            // Rendered in the device currency (₹ in India, € in EU, else $)
            // so the saving badge matches the tier-card price next to it.
            let perMonthEquivalent: string | undefined;
            let originalPrice: string | undefined;
            if (!isFree && billing === 'yearly') {
              const yearly = getTierPriceAmount(tier, 'yearly', deviceCurrency);
              const monthly = getTierPriceAmount(tier, 'monthly', deviceCurrency);
              if (yearly > 0 && monthly > 0) {
                const perMonth = yearly / 12;
                // INR is whole-rupee; USD/EUR keep two decimals.
                const formatPerMonth =
                  deviceCurrency === 'inr'
                    ? `${currencySymbol}${Math.round(perMonth).toLocaleString('en-IN')}`
                    : `${currencySymbol}${perMonth.toFixed(2)}`;
                perMonthEquivalent = t('subscription.perMonthEquivalent', {
                  price: formatPerMonth,
                });
                const annualIfMonthly = monthly * 12;
                if (annualIfMonthly > yearly) {
                  originalPrice =
                    deviceCurrency === 'inr'
                      ? `${currencySymbol}${Math.round(annualIfMonthly).toLocaleString('en-IN')}`
                      : `${currencySymbol}${annualIfMonthly.toFixed(0)}`;
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
          <Text style={styles.legalText}>{t('subscription.legalText')}</Text>
          <View style={styles.legalLinks}>
            <Pressable
              onPress={() => {
                // Route into the in-app legal screens (the matching
                // kiaanverse.com pages no longer exist as a standalone
                // marketing site; the legal text lives in the bundle so
                // it is reachable offline and on Play Store policy
                // review).
                router.push('/terms');
              }}
            >
              <Text style={styles.legalLink}>{t('subscription.linkTerms')}</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => {
                router.push('/privacy');
              }}
            >
              <Text style={styles.legalLink}>{t('subscription.linkPrivacy')}</Text>
            </Pressable>
          </View>
          <Pressable onPress={handleRestore} disabled={restoring}>
            <Text style={styles.restoreText}>
              {restoring
                ? t('subscription.linkRestoring')
                : t('subscription.linkRestore')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA — opens native Play Billing / StoreKit sheet. */}
      <View style={styles.stickyBottom}>
        {purchasing ? (
          <View style={styles.ctaLoading}>
            <OmLoader size={36} label={t('subscription.loadingPurchase')} />
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
                  ? ([
                      'rgba(240,235,225,0.15)',
                      'rgba(240,235,225,0.08)',
                    ] as unknown as string[])
                  : (tierIdentity(selected).gradient as unknown as string[])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaBtn, ctaMeta.disabled && styles.ctaBtnDisabled]}
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
  billing: BillingPeriod
): CtaAction {
  if (current.tier === 'free') return 'subscribe';
  if (current.tier === selected && current.billing === billing)
    return 'current';

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

/**
 * Build the per-tier feature list, threading the i18n `t` function through
 * so each line localizes against the active UI language.
 */
function featureListFor(
  tier: SubscriptionTier,
  t: (key: string, params?: Record<string, string>) => string,
): string[] {
  const f = TIER_CONFIGS[tier].features;
  const lines: string[] = [];
  if (tier === 'free') {
    lines.push(t('subscription.featureDailyWisdom'));
    if (f.kiaanDivineChat) lines.push(t('subscription.featureKiaanFreeQuota'));
    lines.push(t('subscription.featureOneJourney'));
    return lines;
  }
  if (f.kiaanDivineChat) {
    lines.push(
      tier === 'bhakta'
        ? t('subscription.featureKiaanBhaktaQuota')
        : tier === 'sadhak'
          ? t('subscription.featureKiaanSadhakQuota')
          : t('subscription.featureKiaanUnlimited'),
    );
  }
  if (f.kiaanVoiceCompanion) lines.push(t('subscription.featureDivineVoice'));
  if (f.kiaanSoulReading) lines.push(t('subscription.featureSoulReading'));
  if (f.kiaanQuantumDive) lines.push(t('subscription.featureQuantumDive'));
  if (f.encryptedJournal) lines.push(t('subscription.featureEncryptedJournal'));
  if (f.advancedAnalytics) lines.push(t('subscription.featureKarmalytix'));
  if (f.offlineAccess) lines.push(t('subscription.featureOffline'));
  if (f.arthaReframing) lines.push(t('subscription.featureArdha'));
  if (f.viyogaDetachment) lines.push(t('subscription.featureViyoga'));
  if (f.relationshipCompass) lines.push(t('subscription.featureRelationship'));
  if (f.dedicatedSupport) lines.push(t('subscription.featureDedicatedSupport'));
  else if (f.prioritySupport) lines.push(t('subscription.featurePrioritySupport'));
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
