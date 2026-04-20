/**
 * In-App Purchase Service for Kiaanverse — 4-Tier Model (March 2026)
 *
 * Play Billing / StoreKit implementation on top of react-native-iap 12.x.
 *
 * Design:
 * - Module-scoped connection + listeners attached once at first init. The
 *   Play / StoreKit stores fire purchase events asynchronously (even after
 *   app restart), so listeners MUST outlive any single screen.
 * - Purchases are never finished (acknowledged) until the backend has
 *   verified the receipt. This is required by Play: an unacknowledged
 *   purchase auto-refunds after 72h, which is a feature (server failure
 *   → user not charged), not a bug.
 * - Pending promise resolvers are keyed by productId so `purchaseSubscription`
 *   can await the event-loop outcome instead of the SDK's immediate return.
 * - Android subscriptions require an `offerToken` from the fetched
 *   SubscriptionAndroid — we cache the store payload so `requestSubscription`
 *   can look it up.
 *
 * Public API is unchanged from the prior stub so existing callers
 * (subscription.tsx, store) compile without edits.
 */

import { Platform, type EmitterSubscription } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  getAvailablePurchases,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  type Subscription,
  type SubscriptionAndroid,
  type SubscriptionIOS,
  type SubscriptionPurchase,
  type ProductPurchase,
  type PurchaseError,
} from 'react-native-iap';

import { apiClient } from '../client';
import {
  IAP_PRODUCT_IDS,
  TIER_CONFIGS,
  type SubscriptionTier,
  type BillingPeriod,
} from './constants';

// ---------------------------------------------------------------------------
// Types (unchanged — callers depend on these)
// ---------------------------------------------------------------------------

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
}

export interface PurchaseResult {
  success: boolean;
  tier: SubscriptionTier;
  expiresAt?: string;
  error?: string;
}

export interface ReceiptVerificationPayload {
  receipt: string;
  platform: 'ios' | 'android';
  product_id: string;
}

export interface ReceiptVerificationResponse {
  valid: boolean;
  tier: string;
  expires_at: string | null;
  error?: string;
}

export class IAPError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'IAPError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let connectionPromise: Promise<boolean> | null = null;
let purchaseSub: EmitterSubscription | null = null;
let errorSub: EmitterSubscription | null = null;

/** Cached store payload — needed on Android to resolve the offerToken. */
let cachedSubscriptions: Subscription[] = [];

/** Pending resolvers keyed by productId so purchaseSubscription can await. */
type Resolver = (result: PurchaseResult) => void;
const pendingResolvers: Map<string, Resolver> = new Map();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function productIdToTier(productId: string): SubscriptionTier {
  if (productId.includes('bhakta')) return 'bhakta';
  if (productId.includes('sadhak')) return 'sadhak';
  if (productId.includes('siddha')) return 'siddha';
  return 'free';
}

function productIdToBilling(productId: string): BillingPeriod {
  return productId.includes('yearly') ? 'yearly' : 'monthly';
}

function resolvePending(productId: string, result: PurchaseResult): void {
  const resolver = pendingResolvers.get(productId);
  if (resolver) {
    pendingResolvers.delete(productId);
    resolver(result);
  }
}

/**
 * Extract the platform-appropriate receipt token.
 * - Android: `purchaseToken` (required for server-side verification via
 *   Google Play Developer API).
 * - iOS: `transactionReceipt` (StoreKit base64-encoded receipt).
 */
function extractReceipt(purchase: ProductPurchase | SubscriptionPurchase): string {
  if (Platform.OS === 'android') {
    return purchase.purchaseToken ?? purchase.transactionReceipt ?? '';
  }
  return purchase.transactionReceipt ?? '';
}

/**
 * Handle a purchase event: verify with backend → finish transaction →
 * resolve the pending promise. We intentionally do NOT finish the
 * transaction before verification — if verification fails (or the device
 * dies), Play auto-refunds after 72h, which is the correct outcome.
 */
async function handlePurchaseEvent(
  purchase: ProductPurchase | SubscriptionPurchase,
): Promise<void> {
  const productId = purchase.productId;
  const receipt = extractReceipt(purchase);

  if (!receipt) {
    resolvePending(productId, {
      success: false,
      tier: 'free',
      error: 'Purchase receipt is missing — please contact support.',
    });
    return;
  }

  try {
    const verification = await verifyReceipt(receipt, productId);

    if (!verification.valid) {
      resolvePending(productId, {
        success: false,
        tier: 'free',
        error: verification.error ?? 'Receipt verification failed.',
      });
      return;
    }

    // Subscriptions on Android must be acknowledged within 3 days or Play
    // auto-refunds. `finishTransaction` with isConsumable=false sends the
    // acknowledge call. On iOS this finishes the StoreKit transaction.
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (finishErr) {
      // Verification already succeeded — server-side truth is the subscription
      // is active. Log and move on; Play will retry acknowledge on next
      // foreground via flushFailedPurchasesCachedAsPendingAndroid().
      console.warn('IAP: finishTransaction failed post-verify:', finishErr);
    }

    const success: PurchaseResult = {
      success: true,
      tier: verification.tier as SubscriptionTier,
    };
    if (verification.expires_at) success.expiresAt = verification.expires_at;
    resolvePending(productId, success);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Receipt verification error';
    resolvePending(productId, { success: false, tier: 'free', error: message });
  }
}

function handlePurchaseError(error: PurchaseError): void {
  // User cancellation is not a failure — Play reports code E_USER_CANCELLED,
  // iOS reports paymentCancelled. Surface distinct copy so the UI can suppress
  // an error toast in that case.
  const isCancelled =
    error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_ERROR';

  // We don't know which productId this error belongs to (react-native-iap
  // doesn't expose it on the error object reliably), so reject all pending.
  const message = isCancelled
    ? 'Purchase cancelled.'
    : error.message ?? 'Purchase failed. Please try again.';

  for (const [productId, resolver] of pendingResolvers) {
    pendingResolvers.delete(productId);
    resolver({ success: false, tier: 'free', error: message });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function initializeIAP(): Promise<void> {
  if (!connectionPromise) {
    connectionPromise = initConnection();
  }

  const connected = await connectionPromise;
  if (!connected) {
    connectionPromise = null;
    throw new IAPError('Store connection failed', 'E_CONNECTION_FAILED');
  }

  // Android: replay any pending purchases cached by Play (e.g. user paid
  // but app crashed before acknowledge). Required per Play Billing docs.
  if (Platform.OS === 'android') {
    try {
      await flushFailedPurchasesCachedAsPendingAndroid();
    } catch {
      // non-fatal — the purchase listener will still pick up new events
    }
  }

  // Attach listeners exactly once. Screens mount and unmount but purchases
  // can arrive at any time (e.g. asynchronous Play grace period).
  if (!purchaseSub) {
    purchaseSub = purchaseUpdatedListener((event) => {
      void handlePurchaseEvent(event);
    });
  }
  if (!errorSub) {
    errorSub = purchaseErrorListener(handlePurchaseError);
  }
}

export async function disconnectIAP(): Promise<void> {
  purchaseSub?.remove();
  errorSub?.remove();
  purchaseSub = null;
  errorSub = null;
  connectionPromise = null;
  cachedSubscriptions = [];
  pendingResolvers.clear();
  try {
    await endConnection();
  } catch {
    // safe to swallow — endConnection is idempotent
  }
}

export async function getProducts(): Promise<IAPProduct[]> {
  await initializeIAP();

  try {
    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const skus = Object.values(IAP_PRODUCT_IDS).map((entry) => entry[platform]);
    cachedSubscriptions = await getSubscriptions({ skus });

    return cachedSubscriptions.map(mapSubscriptionToIAPProduct);
  } catch (err) {
    console.warn('IAP: getSubscriptions failed, returning fallback config:', err);
    return getFallbackProducts();
  }
}

export async function purchaseSubscription(
  tier: SubscriptionTier,
  billingPeriod: BillingPeriod = 'monthly',
  callbacks?: {
    onComplete?: (result: PurchaseResult) => void;
    onError?: (error: string) => void;
  },
): Promise<void> {
  if (tier === 'free') {
    callbacks?.onError?.('Cannot purchase the free tier.');
    return;
  }

  try {
    await initializeIAP();

    // Make sure we have the store payload so we can find the offerToken on
    // Android. Harmless on iOS.
    if (cachedSubscriptions.length === 0) {
      await getProducts();
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const tierKey = `${tier.toUpperCase()}_${billingPeriod.toUpperCase()}` as
      | 'BHAKTA_MONTHLY'
      | 'BHAKTA_YEARLY'
      | 'SADHAK_MONTHLY'
      | 'SADHAK_YEARLY'
      | 'SIDDHA_MONTHLY'
      | 'SIDDHA_YEARLY';
    const sku = IAP_PRODUCT_IDS[tierKey][platform];

    // Register a resolver so we can convert the async listener event back
    // into the callback-based API our callers expect.
    const result = await new Promise<PurchaseResult>((resolve) => {
      pendingResolvers.set(sku, resolve);

      if (Platform.OS === 'android') {
        const androidSub = cachedSubscriptions.find(
          (s): s is SubscriptionAndroid =>
            'subscriptionOfferDetails' in s && s.productId === sku,
        );
        const offerToken = androidSub?.subscriptionOfferDetails?.[0]?.offerToken;

        if (!offerToken) {
          pendingResolvers.delete(sku);
          resolve({
            success: false,
            tier: 'free',
            error:
              'This plan is not yet available on the Play Store. Please try again later.',
          });
          return;
        }

        void requestSubscription({
          sku,
          subscriptionOffers: [{ sku, offerToken }],
        }).catch((err: unknown) => {
          pendingResolvers.delete(sku);
          const message = err instanceof Error ? err.message : 'Purchase failed.';
          resolve({ success: false, tier: 'free', error: message });
        });
      } else {
        void requestSubscription({ sku }).catch((err: unknown) => {
          pendingResolvers.delete(sku);
          const message = err instanceof Error ? err.message : 'Purchase failed.';
          resolve({ success: false, tier: 'free', error: message });
        });
      }
    });

    if (result.success) {
      callbacks?.onComplete?.(result);
    } else {
      callbacks?.onError?.(result.error ?? 'Purchase did not complete.');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected purchase error';
    callbacks?.onError?.(message);
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    await initializeIAP();

    const purchases = await getAvailablePurchases();
    if (purchases.length === 0) {
      return {
        success: false,
        tier: 'free',
        error: 'No active subscriptions found on this account.',
      };
    }

    // Verify the most recent purchase with our backend. The server is the
    // source of truth for tier/expiry.
    const latest = purchases.reduce((a, b) =>
      (a.transactionDate ?? 0) > (b.transactionDate ?? 0) ? a : b,
    );
    const receipt = extractReceipt(latest);
    if (!receipt) {
      return { success: false, tier: 'free', error: 'Restore receipt missing.' };
    }

    const verification = await verifyReceipt(receipt, latest.productId);
    if (!verification.valid) {
      return {
        success: false,
        tier: 'free',
        error: verification.error ?? 'Subscription is no longer active.',
      };
    }

    // Acknowledge restored purchases if they weren't previously acknowledged.
    try {
      await finishTransaction({ purchase: latest, isConsumable: false });
    } catch {
      // non-fatal
    }

    const restored: PurchaseResult = {
      success: true,
      tier: verification.tier as SubscriptionTier,
    };
    if (verification.expires_at) restored.expiresAt = verification.expires_at;
    return restored;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Restore failed';
    return { success: false, tier: 'free', error: message };
  }
}

export async function verifyReceipt(
  receipt: string,
  productId: string,
): Promise<ReceiptVerificationResponse> {
  const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
  try {
    const response = await apiClient.post<ReceiptVerificationResponse>(
      '/api/subscription/verify',
      { receipt, platform, product_id: productId } satisfies ReceiptVerificationPayload,
    );
    return response.data;
  } catch {
    return {
      valid: false,
      tier: 'free',
      expires_at: null,
      error: 'Receipt validation failed.',
    };
  }
}

// ---------------------------------------------------------------------------
// Mappers / fallbacks
// ---------------------------------------------------------------------------

function mapSubscriptionToIAPProduct(sub: Subscription): IAPProduct {
  const productId = sub.productId;
  const tier = productIdToTier(productId);
  const billingPeriod = productIdToBilling(productId);

  // Android v5 subscription payload
  if ('subscriptionOfferDetails' in sub) {
    const android = sub as SubscriptionAndroid;
    const phase =
      android.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0];
    return {
      productId,
      title: android.title || TIER_CONFIGS[tier].name,
      description: android.description || TIER_CONFIGS[tier].description,
      price: phase?.formattedPrice ?? TIER_CONFIGS[tier].priceDisplay[billingPeriod].usd,
      priceAmountMicros: Number(phase?.priceAmountMicros ?? 0),
      priceCurrencyCode: phase?.priceCurrencyCode ?? 'USD',
      tier,
      billingPeriod,
    };
  }

  // iOS StoreKit payload
  const ios = sub as SubscriptionIOS;
  return {
    productId,
    title: ios.title || TIER_CONFIGS[tier].name,
    description: ios.description || TIER_CONFIGS[tier].description,
    price: ios.localizedPrice ?? TIER_CONFIGS[tier].priceDisplay[billingPeriod].usd,
    priceAmountMicros: Math.round(Number(ios.price ?? 0) * 1_000_000),
    priceCurrencyCode: ios.currency ?? 'USD',
    tier,
    billingPeriod,
  };
}

/** Used when the store is unavailable (dev environment, airplane mode). */
function getFallbackProducts(): IAPProduct[] {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const tiers: SubscriptionTier[] = ['bhakta', 'sadhak', 'siddha'];
  const periods: BillingPeriod[] = ['monthly', 'yearly'];

  return tiers.flatMap((tier) =>
    periods.map((period) => {
      const tierKey = `${tier.toUpperCase()}_${period.toUpperCase()}` as
        | 'BHAKTA_MONTHLY'
        | 'BHAKTA_YEARLY'
        | 'SADHAK_MONTHLY'
        | 'SADHAK_YEARLY'
        | 'SIDDHA_MONTHLY'
        | 'SIDDHA_YEARLY';
      const config = TIER_CONFIGS[tier];
      return {
        productId: IAP_PRODUCT_IDS[tierKey][platform],
        title: config.name,
        description: config.description,
        price: config.priceDisplay[period].usd,
        priceAmountMicros: Math.round(config.prices[period].usd * 1_000_000),
        priceCurrencyCode: 'USD',
        tier,
        billingPeriod: period,
      };
    }),
  );
}
