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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Text,
  Screen,
  GlowCard,
  SacredDivider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useSubscriptionStore, type SubscriptionTier } from '@kiaanverse/store';
import {
  initializeIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  type IAPProduct,
  TIER_CONFIGS,
} from '@kiaanverse/api/src/subscription';

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
  monthlyEquivalent?: string;
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
        <View style={[
          styles.badge,
          isPopular
            ? { backgroundColor: c.accent }
            : { backgroundColor: colors.alpha.goldMedium, borderWidth: 1, borderColor: colors.alpha.goldStrong },
        ]}>
          <Text
            variant="caption"
            style={[styles.badgeText, { color: isPopular ? c.background : c.accent }]}
          >
            {badge}
          </Text>
        </View>
      )}

      <Text variant="h2" color={c.textPrimary}>{name}</Text>
      <Text style={[styles.tierPrice, { color: c.textPrimary }]}>{price}</Text>
      {monthlyEquivalent && (
        <Text variant="caption" color={c.textTertiary}>
          {monthlyEquivalent}/mo when billed yearly
        </Text>
      )}
      <Text variant="bodySmall" color={c.textSecondary} style={styles.tierDescription}>
        {description}
      </Text>

      {/* KIAAN Questions Badge */}
      <View style={[styles.quotaBadge, { backgroundColor: colors.alpha.goldLight, borderColor: colors.alpha.goldMedium }]}>
        <Text variant="caption" color={c.textPrimary} style={styles.quotaLabel}>
          KIAAN Questions
        </Text>
        <Text style={[styles.quotaValue, { color: c.accent }]}>{kiaanQuota}</Text>
      </View>

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: colors.semantic.success }]}>✓</Text>
            <Text variant="bodySmall" color={c.textSecondary} style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {isCurrentTier ? (
        <View style={[styles.selectButton, { backgroundColor: colors.semantic.success + '20', borderWidth: 1, borderColor: colors.semantic.success + '50' }]}>
          <Text variant="label" color={colors.semantic.success}>Current Plan</Text>
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
            {price === 'Free' ? 'Get Started Free' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>
      )}
    </GlowCard>
  );
}

// ---------------------------------------------------------------------------
// Feature lists for display — aligned with web pricing page
// ---------------------------------------------------------------------------

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    '5 KIAAN questions/month',
    'Divine Chat & Friend Mode',
    'Mood tracking',
    'Daily wisdom',
    'Basic breathing exercises',
    '1 Wisdom Journey',
    'Community access',
  ],
  bhakta: [
    '50 KIAAN questions/month',
    'All Seeker features',
    'Encrypted journal',
    '3 Wisdom Journeys',
    '90-day data retention',
  ],
  sadhak: [
    '300 KIAAN questions/month',
    'All Bhakta features',
    'Voice Companion (17 languages)',
    'Soul Reading & Quantum Dive',
    'KIAAN Agent',
    'Ardha, Viyoga & Emotional Reset',
    'Relationship Compass',
    '10 Wisdom Journeys',
    'Advanced mood analytics',
    'Offline access & priority support',
  ],
  siddha: [
    'Unlimited KIAAN questions',
    'All Sadhak features',
    'Unlimited Wisdom Journeys',
    'Dedicated support',
    'Team features',
    'Priority voice processing',
  ],
};

const KIAAN_QUOTA_DISPLAY: Record<SubscriptionTier, string> = {
  free: '5/month',
  bhakta: '50/month',
  sadhak: '300/month',
  siddha: 'Unlimited',
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
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.billingToggle, { backgroundColor: colors.alpha.goldLight }]}>
      <TouchableOpacity
        style={[styles.billingOption, billingPeriod === 'monthly' && { backgroundColor: c.accent }]}
        onPress={() => onToggle('monthly')}
        activeOpacity={0.7}
      >
        <Text
          variant="label"
          color={billingPeriod === 'monthly' ? c.background : c.textSecondary}
        >
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.billingOption, billingPeriod === 'yearly' && { backgroundColor: c.accent }]}
        onPress={() => onToggle('yearly')}
        activeOpacity={0.7}
      >
        <Text
          variant="label"
          color={billingPeriod === 'yearly' ? c.background : c.textSecondary}
        >
          Yearly
        </Text>
        <View style={[styles.saveBadge, { backgroundColor: colors.semantic.success + '30' }]}>
          <Text style={[styles.saveBadgeText, { color: colors.semantic.success }]}>Save 20%</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SubscriptionScreen(): React.JSX.Element {
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
    return () => { mounted = false; };
  }, []);

  // Get localized price from store products, fallback to config
  const getPrice = useCallback(
    (targetTier: SubscriptionTier): string => {
      if (targetTier === 'free') return 'Free';

      const product = products.find(
        (p) => p.tier === targetTier && p.billingPeriod === billingPeriod,
      );
      if (product) return product.price;

      const config = TIER_CONFIGS[targetTier];
      return config.priceDisplay[billingPeriod].usd;
    },
    [products, billingPeriod],
  );

  // Get monthly equivalent for yearly pricing
  const getMonthlyEquivalent = useCallback(
    (targetTier: SubscriptionTier): string | undefined => {
      if (targetTier === 'free' || billingPeriod !== 'yearly') return undefined;

      const config = TIER_CONFIGS[targetTier];
      const yearlyUsd = config.prices.yearly.usd;
      const monthlyEq = (yearlyUsd / 12).toFixed(2);
      return `$${monthlyEq}`;
    },
    [billingPeriod],
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
                'Welcome to ' + TIER_CONFIGS[result.tier].name,
                'Your subscription is now active. Enjoy your spiritual journey!',
                [{ text: 'Continue', onPress: () => router.back() }],
              );
            }
          },
          onError: (errorMsg) => {
            setPurchaseStatus('error', errorMsg);
          },
        });
      } catch {
        // Error already handled by onError callback
      }
    },
    [router, setTier, setPurchaseStatus, clearError, billingPeriod],
  );

  // Handle restore
  const handleRestore = useCallback(async () => {
    setPurchaseStatus('restoring');
    clearError();

    const result = await restorePurchases();

    if (result.success) {
      setTier(result.tier, result.expiresAt);
      Alert.alert(
        'Purchases Restored',
        `Your ${TIER_CONFIGS[result.tier].name} subscription has been restored.`,
        [{ text: 'Continue', onPress: () => router.back() }],
      );
    } else {
      setPurchaseStatus('error', result.error ?? 'No purchases found to restore.');
    }
  }, [router, setTier, setPurchaseStatus, clearError]);

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
    <Screen gradient gradientVariant="sacred" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.alpha.whiteMedium }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text variant="body" color={colors.raw.white}>✕</Text>
        </TouchableOpacity>
        <Text variant="h2" color={c.textPrimary} align="center">
          Choose Your Path to Inner Peace
        </Text>
        <Text variant="bodySmall" color={c.textSecondary} align="center">
          Every plan includes the same quality KIAAN guidance. Choose based on how often you&apos;d like to connect.
        </Text>
      </View>

      {/* Loading overlay */}
      {isProcessing && (
        <View style={[styles.loadingOverlay, { backgroundColor: c.overlay }]}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text variant="body" color={colors.raw.white} style={styles.loadingText}>
            {purchaseStatus === 'restoring'
              ? 'Restoring purchases...'
              : purchaseStatus === 'verifying'
                ? 'Verifying purchase...'
                : 'Processing payment...'}
          </Text>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.semantic.error + '20', borderColor: colors.semantic.error + '50' }]}>
          <Text variant="bodySmall" color={colors.divine.lotus} style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
            <Text variant="label" color={c.accent}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Billing Period Toggle */}
      <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} />

      {/* Tier cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingProducts}>
            <ActivityIndicator size="small" color={c.accent} />
            <Text variant="bodySmall" color={c.textTertiary} style={styles.loadingProductsText}>
              Loading plans...
            </Text>
          </View>
        ) : (
          <>
            {allTiers.map((t) => (
              <TierCard
                key={t}
                tier={t}
                name={TIER_CONFIGS[t].name}
                price={getPrice(t)}
                monthlyEquivalent={getMonthlyEquivalent(t)}
                description={TIER_CONFIGS[t].description}
                kiaanQuota={KIAAN_QUOTA_DISPLAY[t]}
                features={TIER_FEATURES[t]}
                isCurrentTier={tier === t}
                isPopular={t === 'sadhak'}
                badge={t === 'sadhak' ? 'Most Popular' : t === 'siddha' ? 'Unlimited' : undefined}
                onSelect={() => handlePurchase(t)}
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
          <Text variant="bodySmall" color={c.textTertiary} style={styles.restoreButtonText}>
            Restore Purchases
          </Text>
        </TouchableOpacity>

        {/* KIAAN Promise */}
        <GlowCard variant="golden" style={styles.promiseCard}>
          <Text variant="label" color={c.textPrimary}>The KIAAN Promise</Text>
          <Text variant="bodySmall" color={c.textSecondary}>
            Every user receives the same quality of guidance from KIAAN—the only difference is how many questions you can ask each month.
          </Text>
        </GlowCard>

        {/* Legal text */}
        <Text variant="caption" color={c.textTertiary} align="center" style={styles.legalText}>
          Subscriptions auto-renew {billingPeriod === 'yearly' ? 'annually' : 'monthly'}. Cancel anytime in{' '}
          {Platform.OS === 'ios' ? 'Settings → Subscriptions' : 'Google Play → Subscriptions'}.
          Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
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
