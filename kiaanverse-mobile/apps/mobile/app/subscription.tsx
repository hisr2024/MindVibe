/**
 * Subscription Paywall Screen — 4-Tier Model (March 2026)
 *
 * Presents Seeker (Free) / Bhakta / Sadhak / Siddha tiers with
 * localized pricing from the store, purchase buttons, billing
 * period toggle, and a restore purchases option.
 *
 * Now fully theme-compliant — all colors from design tokens,
 * gradient backgrounds, and GlowCard for the popular tier.
 *
 * Edge cases handled:
 * - Failed purchases → retry prompt
 * - Restore purchases button
 * - Purchase in progress → loading state
 * - Receipt verification failure → assume free, show error
 * - Offline → show cached prices with warning
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Screen,
  GlowCard,
  colors,
  spacing,
  radii,
  useTheme,
} from '@kiaanverse/ui';
import { useSubscriptionStore, type SubscriptionTier } from '@kiaanverse/store';
import {
  initializeIAP,
  getProducts,
  getTierPriceAmount,
  getTierPriceDisplay,
  isSubscriptionUnavailableError,
  purchaseSubscription,
  resolveCurrencyFromLocale,
  restorePurchases,
  type CurrencyCode,
  type IAPProduct,
  TIER_CONFIGS,
} from '@kiaanverse/api';
import * as Localization from 'expo-localization';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingPeriod = 'monthly' | 'yearly';

// ---------------------------------------------------------------------------
// Tier Card Component
// ---------------------------------------------------------------------------

interface TierCardProps {
  tier: SubscriptionTier;
  name: string;
  price: string;
  monthlyEquivalent?: string | undefined;
  description: string;
  kiaanQuota: string;
  features: string[];
  isCurrentTier: boolean;
  isPopular?: boolean | undefined;
  badge?: string | undefined;
  onSelect: () => void;
  disabled: boolean;
}

function TierCard({
  tier,
  name,
  price,
  monthlyEquivalent,
  description,
  kiaanQuota,
  features,
  isCurrentTier,
  isPopular,
  badge,
  onSelect,
  disabled,
}: TierCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <GlowCard
      variant={isPopular ? 'divine' : 'default'}
      style={[
        styles.tierCard,
        isCurrentTier && { borderColor: colors.semantic.success + '80' },
      ]}
    >
      {badge && (
        <View
          style={[
            styles.badge,
            isPopular
              ? { backgroundColor: c.accent }
              : {
                  backgroundColor: colors.alpha.goldMedium,
                  borderWidth: 1,
                  borderColor: colors.alpha.goldStrong,
                },
          ]}
        >
          <Text
            variant="caption"
            style={[
              styles.badgeText,
              { color: isPopular ? c.background : c.accent },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}

      <Text variant="h2" color={c.textPrimary}>
        {name}
      </Text>
      <Text style={[styles.tierPrice, { color: c.textPrimary }]}>{price}</Text>
      {monthlyEquivalent && (
        <Text variant="caption" color={c.textTertiary}>
          {t('subscription.paywallMonthlyEquivalent', {
            price: monthlyEquivalent,
          })}
        </Text>
      )}
      <Text
        variant="bodySmall"
        color={c.textSecondary}
        style={styles.tierDescription}
      >
        {description}
      </Text>

      {/* KIAAN Questions Badge */}
      <View
        style={[
          styles.quotaBadge,
          {
            backgroundColor: colors.alpha.goldLight,
            borderColor: colors.alpha.goldMedium,
          },
        ]}
      >
        <Text variant="caption" color={c.textPrimary} style={styles.quotaLabel}>
          {t('subscription.paywallKiaanQuotaLabel')}
        </Text>
        <Text style={[styles.quotaValue, { color: c.accent }]}>
          {kiaanQuota}
        </Text>
      </View>

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text
              style={[styles.featureCheck, { color: colors.semantic.success }]}
            >
              ✓
            </Text>
            <Text
              variant="bodySmall"
              color={c.textSecondary}
              style={styles.featureText}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {isCurrentTier ? (
        <View
          style={[
            styles.selectButton,
            {
              backgroundColor: colors.semantic.success + '20',
              borderWidth: 1,
              borderColor: colors.semantic.success + '50',
            },
          ]}
        >
          <Text variant="label" color={colors.semantic.success}>
            {t('subscription.paywallCurrentPlan')}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.selectButton,
            isPopular
              ? { backgroundColor: c.accent }
              : { backgroundColor: colors.alpha.whiteMedium },
          ]}
          onPress={onSelect}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            color={isPopular ? c.background : colors.raw.white}
          >
            {tier === 'free'
              ? t('subscription.paywallCtaFree')
              : t('subscription.paywallCtaSubscribe')}
          </Text>
        </TouchableOpacity>
      )}
    </GlowCard>
  );
}

// ---------------------------------------------------------------------------
// Feature lists for display — aligned with web pricing page
// ---------------------------------------------------------------------------

/**
 * Per-tier feature i18n keys. Each tier's feature list resolves at
 * render time via t() so the bullets localize against the active UI
 * locale. Tier order + count is preserved from the original literal
 * tables so the visual layout doesn't shift.
 */
const TIER_FEATURE_KEYS: Record<SubscriptionTier, readonly string[]> = {
  free: [
    'subscription.paywallFeatFree1',
    'subscription.paywallFeatFree2',
    'subscription.paywallFeatFree3',
    'subscription.paywallFeatFree4',
    'subscription.paywallFeatFree5',
    'subscription.paywallFeatFree6',
    'subscription.paywallFeatFree7',
  ],
  bhakta: [
    'subscription.paywallFeatBhakta1',
    'subscription.paywallFeatBhakta2',
    'subscription.paywallFeatBhakta3',
    'subscription.paywallFeatBhakta4',
    'subscription.paywallFeatBhakta5',
  ],
  sadhak: [
    'subscription.paywallFeatSadhak1',
    'subscription.paywallFeatSadhak2',
    'subscription.paywallFeatSadhak3',
    'subscription.paywallFeatSadhak4',
    'subscription.paywallFeatSadhak5',
    'subscription.paywallFeatSadhak6',
    'subscription.paywallFeatSadhak7',
    'subscription.paywallFeatSadhak8',
    'subscription.paywallFeatSadhak9',
    'subscription.paywallFeatSadhak10',
  ],
  siddha: [
    'subscription.paywallFeatSiddha1',
    'subscription.paywallFeatSiddha2',
    'subscription.paywallFeatSiddha3',
    'subscription.paywallFeatSiddha4',
    'subscription.paywallFeatSiddha5',
    'subscription.paywallFeatSiddha6',
  ],
};

/** Per-tier KIAAN quota display key. */
const KIAAN_QUOTA_KEY: Record<SubscriptionTier, string> = {
  free: 'subscription.paywallQuotaFree',
  bhakta: 'subscription.paywallQuotaBhakta',
  sadhak: 'subscription.paywallQuotaSadhak',
  siddha: 'subscription.paywallQuotaSiddha',
};

// ---------------------------------------------------------------------------
// Billing Toggle Component
// ---------------------------------------------------------------------------

function BillingToggle({
  billingPeriod,
  onToggle,
}: {
  billingPeriod: BillingPeriod;
  onToggle: (period: BillingPeriod) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.billingToggle,
        { backgroundColor: colors.alpha.goldLight },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingPeriod === 'monthly' && { backgroundColor: c.accent },
        ]}
        onPress={() => onToggle('monthly')}
        activeOpacity={0.7}
      >
        <Text
          variant="label"
          color={billingPeriod === 'monthly' ? c.background : c.textSecondary}
        >
          {t('subscription.billingMonthly')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingPeriod === 'yearly' && { backgroundColor: c.accent },
        ]}
        onPress={() => onToggle('yearly')}
        activeOpacity={0.7}
      >
        <Text
          variant="label"
          color={billingPeriod === 'yearly' ? c.background : c.textSecondary}
        >
          {t('subscription.billingAnnual')}
        </Text>
        <View
          style={[
            styles.saveBadge,
            { backgroundColor: colors.semantic.success + '30' },
          ]}
        >
          <Text
            style={[styles.saveBadgeText, { color: colors.semantic.success }]}
          >
            {t('subscription.paywallSaveBadge')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const tier = useSubscriptionStore((s) => s.tier);
  const purchaseStatus = useSubscriptionStore((s) => s.purchaseStatus);
  const error = useSubscriptionStore((s) => s.error);
  const setTier = useSubscriptionStore((s) => s.setTier);
  const setPurchaseStatus = useSubscriptionStore((s) => s.setPurchaseStatus);
  const clearError = useSubscriptionStore((s) => s.clearError);

  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  // Device currency drives the FALLBACK pricing when IAP catalog hasn't
  // loaded yet (skeleton state). Once products[] is hydrated by getProducts(),
  // each product's `price` is already Play-localized (e.g. "₹599.00") and
  // takes precedence over this fallback.
  const deviceCurrency = React.useMemo<CurrencyCode>(() => {
    try {
      const locales = Localization.getLocales();
      const primary = locales[0];
      return resolveCurrencyFromLocale(primary?.regionCode, primary?.languageTag);
    } catch {
      return 'usd';
    }
  }, []);
  const currencySymbol = deviceCurrency === 'inr' ? '₹' : deviceCurrency === 'eur' ? '€' : '$';

  // Load IAP products on mount
  useEffect(() => {
    let mounted = true;

    async function loadProducts(): Promise<void> {
      try {
        await initializeIAP();
        const fetchedProducts = await getProducts();
        if (mounted) {
          setProducts(fetchedProducts);
        }
      } catch (err) {
        console.warn('Failed to load IAP products:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Get localized price from store products, fallback to device-currency config
  const getPrice = useCallback(
    (targetTier: SubscriptionTier): string => {
      if (targetTier === 'free') return t('subscription.priceFree');

      // Play Store / App Store localized price wins — this is what the
      // user will actually be charged at the OS payment sheet.
      const product = products.find(
        (p) => p.tier === targetTier && p.billingPeriod === billingPeriod
      );
      if (product) return product.price;

      // Skeleton fallback in device currency. Must match Play Console
      // regional pricing so the catalog-loading state doesn't flash USD
      // to a user who will eventually see ₹ / €.
      return getTierPriceDisplay(targetTier, billingPeriod, deviceCurrency);
    },
    [products, billingPeriod, t, deviceCurrency]
  );

  // Get monthly equivalent for yearly pricing — rendered in device currency
  const getMonthlyEquivalent = useCallback(
    (targetTier: SubscriptionTier): string | undefined => {
      if (targetTier === 'free' || billingPeriod !== 'yearly') return undefined;

      const yearlyAmount = getTierPriceAmount(targetTier, 'yearly', deviceCurrency);
      const perMonth = yearlyAmount / 12;
      // INR is whole-rupee per Play Console pricing; USD/EUR keep two decimals.
      if (deviceCurrency === 'inr') {
        return `${currencySymbol}${Math.round(perMonth).toLocaleString('en-IN')}`;
      }
      return `${currencySymbol}${perMonth.toFixed(2)}`;
    },
    [billingPeriod, deviceCurrency, currencySymbol]
  );

  // Handle purchase
  const handlePurchase = useCallback(
    async (targetTier: SubscriptionTier) => {
      if (targetTier === 'free') {
        router.back();
        return;
      }

      setPurchaseStatus('purchasing');
      clearError();

      try {
        await purchaseSubscription(targetTier, billingPeriod, {
          onComplete: (result) => {
            if (result.success) {
              setTier(result.tier, result.expiresAt);
              Alert.alert(
                t('subscription.paywallWelcomeTitle', {
                  tierName: TIER_CONFIGS[result.tier].name,
                }),
                t('subscription.paywallWelcomeBody'),
                [
                  {
                    text: t('subscription.continueButton'),
                    onPress: () => router.back(),
                  },
                ],
              );
            }
          },
          onError: (errorMsg) => {
            // "Play Store hasn't activated the product yet" is not a
            // purchase failure — it's a store configuration gap. Show a
            // friendlier "coming soon" alert and clear the error status
            // so the CTA returns to its idle state rather than staying
            // stuck on a red error banner.
            if (isSubscriptionUnavailableError(errorMsg)) {
              setPurchaseStatus('idle');
              Alert.alert(
                t('subscription.alertComingSoonTitle'),
                t('subscription.alertComingSoonBody'),
                [{ text: t('common.ok') }],
              );
              return;
            }
            setPurchaseStatus('error', errorMsg);
          },
        });
      } catch {
        // Error already handled by onError callback
      }
    },
    [router, setTier, setPurchaseStatus, clearError, billingPeriod, t]
  );

  // Handle restore
  const handleRestore = useCallback(async () => {
    setPurchaseStatus('restoring');
    clearError();

    const result = await restorePurchases();

    if (result.success) {
      setTier(result.tier, result.expiresAt);
      Alert.alert(
        t('subscription.paywallRestoredTitle'),
        t('subscription.paywallRestoredBody', {
          tierName: TIER_CONFIGS[result.tier].name,
        }),
        [
          {
            text: t('subscription.continueButton'),
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      setPurchaseStatus(
        'error',
        result.error ?? t('subscription.paywallNoRestoreError'),
      );
    }
  }, [router, setTier, setPurchaseStatus, clearError, t]);

  // Handle retry after failure
  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const isProcessing =
    purchaseStatus === 'purchasing' ||
    purchaseStatus === 'restoring' ||
    purchaseStatus === 'verifying';

  const allTiers: SubscriptionTier[] = ['free', 'bhakta', 'sadhak', 'siddha'];

  return (
    <Screen
      gradient
      gradientVariant="sacred"
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.closeButton,
            { backgroundColor: colors.alpha.whiteMedium },
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('subscription.paywallCloseA11y')}
          activeOpacity={0.7}
        >
          <Text variant="body" color={colors.raw.white}>
            ✕
          </Text>
        </TouchableOpacity>
        <Text variant="h2" color={c.textPrimary} align="center">
          {t('subscription.paywallHeaderTitle')}
        </Text>
        <Text variant="bodySmall" color={c.textSecondary} align="center">
          {t('subscription.paywallHeaderSubtitle')}
        </Text>
      </View>

      {/* Loading overlay */}
      {isProcessing && (
        <View style={[styles.loadingOverlay, { backgroundColor: c.overlay }]}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text
            variant="body"
            color={colors.raw.white}
            style={styles.loadingText}
          >
            {purchaseStatus === 'restoring'
              ? t('subscription.paywallLoadingRestoring')
              : purchaseStatus === 'verifying'
                ? t('subscription.paywallLoadingVerifying')
                : t('subscription.paywallLoadingPayment')}
          </Text>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.semantic.error + '20',
              borderColor: colors.semantic.error + '50',
            },
          ]}
        >
          <Text
            variant="bodySmall"
            color={colors.divine.lotus}
            style={styles.errorText}
          >
            {error}
          </Text>
          <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
            <Text variant="label" color={c.accent}>
              {t('subscription.paywallErrorRetry')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Billing Period Toggle */}
      <BillingToggle
        billingPeriod={billingPeriod}
        onToggle={setBillingPeriod}
      />

      {/* Tier cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingProducts}>
            <ActivityIndicator size="small" color={c.accent} />
            <Text
              variant="bodySmall"
              color={c.textTertiary}
              style={styles.loadingProductsText}
            >
              {t('subscription.paywallLoadingProducts')}
            </Text>
          </View>
        ) : (
          <>
            {allTiers.map((tierKey) => (
              <TierCard
                key={tierKey}
                tier={tierKey}
                name={TIER_CONFIGS[tierKey].name}
                price={getPrice(tierKey)}
                monthlyEquivalent={getMonthlyEquivalent(tierKey)}
                description={TIER_CONFIGS[tierKey].description}
                kiaanQuota={t(KIAAN_QUOTA_KEY[tierKey])}
                features={TIER_FEATURE_KEYS[tierKey].map((k) => t(k))}
                isCurrentTier={tier === tierKey}
                isPopular={tierKey === 'sadhak'}
                badge={
                  tierKey === 'sadhak'
                    ? t('subscription.paywallBadgeMostPopular')
                    : tierKey === 'siddha'
                      ? t('subscription.paywallBadgeUnlimited')
                      : undefined
                }
                onSelect={() => handlePurchase(tierKey)}
                disabled={isProcessing}
              />
            ))}
          </>
        )}

        {/* Restore purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text
            variant="bodySmall"
            color={c.textTertiary}
            style={styles.restoreButtonText}
          >
            {t('subscription.ctaRestorePurchases')}
          </Text>
        </TouchableOpacity>

        {/* KIAAN Promise */}
        <GlowCard variant="golden" style={styles.promiseCard}>
          <Text variant="label" color={c.textPrimary}>
            {t('subscription.paywallPromiseTitle')}
          </Text>
          <Text variant="bodySmall" color={c.textSecondary}>
            {t('subscription.paywallPromiseBody')}
          </Text>
        </GlowCard>

        {/* Legal text — composed from atomic localized fragments so each
            locale can phrase auto-renew / cancellation / charge naturally.
            Platform conditional swaps the cancel + charge sentences. */}
        <Text
          variant="caption"
          color={c.textTertiary}
          align="center"
          style={styles.legalText}
        >
          {t('subscription.paywallLegalAutoRenew', {
            period:
              billingPeriod === 'yearly'
                ? t('subscription.paywallLegalPeriodAnnually')
                : t('subscription.paywallLegalPeriodMonthly'),
          })}
          {' '}
          {Platform.OS === 'ios'
            ? t('subscription.paywallLegalCancelIos')
            : t('subscription.paywallLegalCancelAndroid')}
          {' '}
          {Platform.OS === 'ios'
            ? t('subscription.paywallLegalChargeIos')
            : t('subscription.paywallLegalChargeAndroid')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles — All colors from theme tokens, all spacing from scale
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.xxs,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xxs,
  },
  saveBadge: {
    paddingHorizontal: spacing.xxs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  errorText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loadingProducts: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingProductsText: {
    marginTop: spacing.xs,
  },
  tierCard: {
    gap: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '800',
  },
  tierDescription: {
    lineHeight: 18,
  },
  quotaBadge: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  quotaLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  quotaValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  featureList: {
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureCheck: {
    fontSize: 14,
    marginRight: spacing.xs,
    marginTop: 1,
    width: 18,
  },
  featureText: {
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  restoreButtonText: {
    textDecorationLine: 'underline',
  },
  promiseCard: {
    gap: spacing.xs,
  },
  legalText: {
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
});
