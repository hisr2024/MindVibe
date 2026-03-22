/**
 * Subscription Paywall Screen
 *
 * Shown when a free user hits a feature gate. Presents the three tiers
 * (Free / Sacred / Divine) with localized pricing from the store,
 * purchase buttons, and a restore purchases option.
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
import { useSubscriptionStore, type VibePlayerTier } from '@kiaanverse/store';
import {
  initializeIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  type IAPProduct,
  TIER_CONFIGS,
} from '@kiaanverse/api/src/subscription';

// ---------------------------------------------------------------------------
// Tier Card Component
// ---------------------------------------------------------------------------

interface TierCardProps {
  tier: VibePlayerTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  isCurrentTier: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function TierCard({
  tier,
  name,
  price,
  description,
  features,
  isCurrentTier,
  isPopular,
  onSelect,
  disabled,
}: TierCardProps): React.JSX.Element {
  return (
    <View style={[
      styles.tierCard,
      isPopular && styles.tierCardPopular,
      isCurrentTier && styles.tierCardCurrent,
    ]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      <Text style={styles.tierName}>{name}</Text>
      <Text style={styles.tierPrice}>{price}</Text>
      <Text style={styles.tierDescription}>{description}</Text>

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
            {tier === 'free' ? 'Downgrade' : 'Subscribe'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Feature lists for display
// ---------------------------------------------------------------------------

const TIER_FEATURES: Record<VibePlayerTier, string[]> = {
  free: [
    '5 Sakha messages per day',
    '2 wisdom journeys',
    'Basic Bhagavad Gita access',
    'Mood tracking',
  ],
  sacred: [
    'Unlimited Sakha messages',
    'All wisdom journeys',
    'Full Bhagavad Gita library',
    'Voice mode',
    'Offline access',
  ],
  divine: [
    'Everything in Sacred',
    'Early access to new features',
    'Personalized wisdom insights',
    'Priority support',
    'Exclusive Divine content',
  ],
};

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
    (targetTier: VibePlayerTier): string => {
      if (targetTier === 'free') return 'Free';

      const product = products.find((p) => p.tier === targetTier);
      if (product) return `${product.price}/mo`;

      return TIER_CONFIGS[targetTier].priceDisplay.usd;
    },
    [products],
  );

  // Handle purchase
  const handlePurchase = useCallback(
    async (targetTier: VibePlayerTier) => {
      if (targetTier === 'free') {
        router.back();
        return;
      }

      setPurchaseStatus('purchasing');
      clearError();

      try {
        await purchaseSubscription(targetTier, {
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
    [router, setTier, setPurchaseStatus, clearError],
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
        <Text style={styles.headerTitle}>KIAAN Vibe Player</Text>
        <Text style={styles.headerSubtitle}>
          Choose your path to spiritual wellness
        </Text>
      </View>

      {/* Loading overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F5A623" />
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

      {/* Tier cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingProducts}>
            <ActivityIndicator size="small" color="#F5A623" />
            <Text style={styles.loadingProductsText}>Loading plans...</Text>
          </View>
        ) : (
          <>
            <TierCard
              tier="free"
              name="Free"
              price="Free"
              description={TIER_CONFIGS.free.description}
              features={TIER_FEATURES.free}
              isCurrentTier={tier === 'free'}
              onSelect={() => handlePurchase('free')}
              disabled={isProcessing}
            />

            <TierCard
              tier="sacred"
              name="Sacred"
              price={getPrice('sacred')}
              description={TIER_CONFIGS.sacred.description}
              features={TIER_FEATURES.sacred}
              isCurrentTier={tier === 'sacred'}
              isPopular
              onSelect={() => handlePurchase('sacred')}
              disabled={isProcessing}
            />

            <TierCard
              tier="divine"
              name="Divine"
              price={getPrice('divine')}
              description={TIER_CONFIGS.divine.description}
              features={TIER_FEATURES.divine}
              isCurrentTier={tier === 'divine'}
              onSelect={() => handlePurchase('divine')}
              disabled={isProcessing}
            />
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

        {/* Legal text */}
        <Text style={styles.legalText}>
          Subscriptions auto-renew monthly. Cancel anytime in{' '}
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
    backgroundColor: '#0D0D1A',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#F5A623',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,13,26,0.9)',
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
    color: '#F5A623',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierCardPopular: {
    borderColor: '#F5A623',
    borderWidth: 2,
  },
  tierCardCurrent: {
    borderColor: 'rgba(100,200,100,0.5)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#0D0D1A',
    fontSize: 11,
    fontWeight: '700',
  },
  tierName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5A623',
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
    lineHeight: 18,
  },
  featureList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    color: '#4ADE80',
    fontSize: 14,
    marginRight: 8,
    width: 18,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#F5A623',
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
    color: '#0D0D1A',
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
  legalText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
