/**
 * Subscription Paywall Screen — 4-Tier Model (March 2026)
 *
 * Presents Seeker (Free) / Bhakta / Sadhak / Siddha tiers with
 * localized pricing from the store, purchase buttons, billing
 * period toggle, and a restore purchases option.
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
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  isPopular?: boolean;
  badge?: string;
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
  return (
    <View style={[
      styles.tierCard,
      isPopular && styles.tierCardPopular,
      isCurrentTier && styles.tierCardCurrent,
    ]}>
      {badge && (
        <View style={[styles.badge, isPopular ? styles.badgePopular : styles.badgeDefault]}>
          <Text style={[styles.badgeText, isPopular ? styles.badgeTextPopular : styles.badgeTextDefault]}>
            {badge}
          </Text>
        </View>
      )}

      <Text style={styles.tierName}>{name}</Text>
      <Text style={styles.tierPrice}>{price}</Text>
      {monthlyEquivalent && (
        <Text style={styles.monthlyEquivalent}>{monthlyEquivalent}/mo when billed yearly</Text>
      )}
      <Text style={styles.tierDescription}>{description}</Text>

      {/* KIAAN Questions Badge */}
      <View style={styles.quotaBadge}>
        <Text style={styles.quotaLabel}>KIAAN Questions</Text>
        <Text style={styles.quotaValue}>{kiaanQuota}</Text>
      </View>

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {isCurrentTier ? (
        <View style={[styles.selectButton, styles.selectButtonCurrent]}>
          <Text style={styles.selectButtonCurrentText}>Current Plan</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.selectButton, isPopular && styles.selectButtonPopular]}
          onPress={onSelect}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.selectButtonText,
            isPopular && styles.selectButtonPopularText,
          ]}>
            {price === 'Free' ? 'Get Started Free' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
  return (
    <View style={styles.billingToggle}>
      <TouchableOpacity
        style={[styles.billingOption, billingPeriod === 'monthly' && styles.billingOptionActive]}
        onPress={() => onToggle('monthly')}
        activeOpacity={0.7}
      >
        <Text style={[styles.billingOptionText, billingPeriod === 'monthly' && styles.billingOptionActiveText]}>
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.billingOption, billingPeriod === 'yearly' && styles.billingOptionActive]}
        onPress={() => onToggle('yearly')}
        activeOpacity={0.7}
      >
        <Text style={[styles.billingOptionText, billingPeriod === 'yearly' && styles.billingOptionActiveText]}>
          Yearly
        </Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>Save 20%</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Path to Inner Peace</Text>
        <Text style={styles.headerSubtitle}>
          Every plan includes the same quality KIAAN guidance. Choose based on how often you&apos;d like to connect.
        </Text>
      </View>

      {/* Loading overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#d4a44c" />
          <Text style={styles.loadingText}>
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
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
            <ActivityIndicator size="small" color="#d4a44c" />
            <Text style={styles.loadingProductsText}>Loading plans...</Text>
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
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* KIAAN Promise */}
        <View style={styles.promiseCard}>
          <Text style={styles.promiseTitle}>The KIAAN Promise</Text>
          <Text style={styles.promiseText}>
            Every user receives the same quality of guidance from KIAAN—the only difference is how many questions you can ask each month.
          </Text>
        </View>

        {/* Legal text */}
        <Text style={styles.legalText}>
          Subscriptions auto-renew {billingPeriod === 'yearly' ? 'annually' : 'monthly'}. Cancel anytime in{' '}
          {Platform.OS === 'ios' ? 'Settings → Subscriptions' : 'Google Play → Subscriptions'}.
          Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D10',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f5f0e8',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  billingToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(212,164,76,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  billingOptionActive: {
    backgroundColor: '#d4a44c',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(245,240,232,0.7)',
  },
  billingOptionActiveText: {
    color: '#0D0D10',
  },
  saveBadge: {
    backgroundColor: 'rgba(74,222,128,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ADE80',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,13,16,0.9)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(220,53,69,0.15)',
    borderColor: 'rgba(220,53,69,0.3)',
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  retryText: {
    color: '#d4a44c',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingProductsText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  tierCard: {
    backgroundColor: 'rgba(13,13,16,0.85)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,164,76,0.15)',
  },
  tierCardPopular: {
    borderColor: 'rgba(212,164,76,0.5)',
    borderWidth: 2,
    shadowColor: '#d4a44c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  tierCardCurrent: {
    borderColor: 'rgba(100,200,100,0.5)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePopular: {
    backgroundColor: '#d4a44c',
  },
  badgeDefault: {
    backgroundColor: 'rgba(212,164,76,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,76,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextPopular: {
    color: '#0D0D10',
  },
  badgeTextDefault: {
    color: '#d4a44c',
  },
  tierName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f5f0e8',
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f5f0e8',
    marginBottom: 2,
  },
  monthlyEquivalent: {
    fontSize: 12,
    color: 'rgba(245,240,232,0.6)',
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.7)',
    marginBottom: 16,
    lineHeight: 18,
  },
  quotaBadge: {
    backgroundColor: 'rgba(212,164,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,76,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  quotaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f5f0e8',
    marginBottom: 2,
  },
  quotaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d4a44c',
  },
  featureList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureCheck: {
    color: '#4ADE80',
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
    width: 18,
  },
  featureText: {
    color: 'rgba(245,240,232,0.8)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#d4a44c',
  },
  selectButtonCurrent: {
    backgroundColor: 'rgba(100,200,100,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100,200,100,0.3)',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonPopularText: {
    color: '#0D0D10',
  },
  selectButtonCurrentText: {
    color: 'rgba(100,200,100,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  restoreButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  promiseCard: {
    backgroundColor: 'rgba(212,164,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,76,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f0e8',
    marginBottom: 6,
  },
  promiseText: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.7)',
    lineHeight: 18,
  },
  legalText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
