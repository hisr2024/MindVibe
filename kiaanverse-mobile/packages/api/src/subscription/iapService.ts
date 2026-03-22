/**
 * In-App Purchase Service for Kiaanverse
 *
 * Wraps expo-in-app-purchases to provide a clean interface for
 * purchasing Sacred and Divine subscription tiers via App Store
 * and Google Play billing.
 *
 * Handles:
 * - IAP initialization and product fetching
 * - Purchase flow with receipt capture
 * - Restore purchases
 * - Error handling with user-friendly messages
 * - Platform-specific receipt extraction
 */

import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { apiClient } from '../client';
import {
  ALL_PRODUCT_IDS,
  IAP_PRODUCT_IDS,
  TIER_CONFIGS,
  type VibePlayerTier,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  tier: VibePlayerTier;
}

export interface PurchaseResult {
  success: boolean;
  tier: VibePlayerTier;
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isInitialized = false;
let purchaseListener: InAppPurchases.IAPItemDetails[] | null = null;

// Callback for when a purchase completes (set by the store)
let onPurchaseComplete: ((result: PurchaseResult) => void) | null = null;
let onPurchaseError: ((error: string) => void) | null = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the IAP connection and fetch products.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initializeIAP(): Promise<void> {
  if (isInitialized) return;

  try {
    await InAppPurchases.connectAsync();
    isInitialized = true;

    // Set up the purchase listener for processing completed purchases
    InAppPurchases.setPurchaseListener(handlePurchaseUpdate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown IAP init error';
    console.warn(`IAP initialization failed: ${message}`);
    throw new IAPError('Unable to connect to the store. Please try again later.', 'INIT_FAILED');
  }
}

/**
 * Disconnect from the IAP service. Call on app unmount.
 */
export async function disconnectIAP(): Promise<void> {
  if (!isInitialized) return;

  try {
    await InAppPurchases.disconnectAsync();
    isInitialized = false;
  } catch {
    // Best effort — ignore disconnect errors
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * Fetch available subscription products from the store.
 * Returns localized prices from App Store / Play Store.
 */
export async function getProducts(): Promise<IAPProduct[]> {
  await ensureInitialized();

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const productIds = [
    IAP_PRODUCT_IDS.SACRED_MONTHLY[platform],
    IAP_PRODUCT_IDS.DIVINE_MONTHLY[platform],
  ];

  try {
    const { results } = await InAppPurchases.getProductsAsync(productIds);

    if (!results || results.length === 0) {
      return getDefaultProducts();
    }

    return results.map((product) => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.price,
      priceAmountMicros: product.priceAmountMicros ?? 0,
      priceCurrencyCode: product.priceCurrencyCode ?? 'USD',
      tier: productIdToTier(product.productId),
    }));
  } catch (error) {
    console.warn('Failed to fetch IAP products, using defaults:', error);
    return getDefaultProducts();
  }
}

// ---------------------------------------------------------------------------
// Purchase Flow
// ---------------------------------------------------------------------------

/**
 * Initiate a subscription purchase for the given tier.
 *
 * The purchase flow is asynchronous:
 * 1. This function opens the store payment sheet
 * 2. The purchase listener handles the result
 * 3. On success, the receipt is sent to the backend for validation
 * 4. The subscription store is updated with the new tier
 */
export async function purchaseSubscription(
  tier: VibePlayerTier,
  callbacks?: {
    onComplete?: (result: PurchaseResult) => void;
    onError?: (error: string) => void;
  },
): Promise<void> {
  if (tier === 'free') {
    throw new IAPError('Cannot purchase the free tier.', 'INVALID_TIER');
  }

  await ensureInitialized();

  // Register callbacks
  onPurchaseComplete = callbacks?.onComplete ?? null;
  onPurchaseError = callbacks?.onError ?? null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const productId = TIER_CONFIGS[tier].productIds[platform];

  if (!productId) {
    throw new IAPError('Product not available for this platform.', 'PRODUCT_NOT_FOUND');
  }

  try {
    await InAppPurchases.purchaseItemAsync(productId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase failed';

    // User cancelled — not an error
    if (message.includes('cancel') || message.includes('Cancel')) {
      onPurchaseError?.('Purchase was cancelled.');
      return;
    }

    onPurchaseError?.(message);
    throw new IAPError(
      'Unable to complete purchase. Please try again.',
      'PURCHASE_FAILED',
    );
  }
}

// ---------------------------------------------------------------------------
// Restore Purchases
// ---------------------------------------------------------------------------

/**
 * Restore previous purchases from the store.
 * Users should use this when switching devices or reinstalling.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  await ensureInitialized();

  try {
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();

    if (!results || results.length === 0) {
      return {
        success: false,
        tier: 'free',
        error: 'No previous purchases found.',
      };
    }

    // Find the most recent valid subscription
    const sortedPurchases = [...results].sort(
      (a, b) => (b.purchaseTime ?? 0) - (a.purchaseTime ?? 0),
    );

    for (const purchase of sortedPurchases) {
      const receipt = extractReceipt(purchase);
      if (!receipt) continue;

      const verificationResult = await verifyReceipt(
        receipt,
        purchase.productId,
      );

      if (verificationResult.valid) {
        return {
          success: true,
          tier: verificationResult.tier as VibePlayerTier,
          expiresAt: verificationResult.expires_at ?? undefined,
        };
      }
    }

    return {
      success: false,
      tier: 'free',
      error: 'No active subscriptions found.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Restore failed';
    return {
      success: false,
      tier: 'free',
      error: `Failed to restore purchases: ${message}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Receipt Verification
// ---------------------------------------------------------------------------

/**
 * Send receipt to backend for server-side validation.
 *
 * POST /api/subscription/verify
 * Body: { receipt, platform, product_id }
 *
 * The backend validates the receipt with Apple/Google servers,
 * updates the user's subscription record, and returns the effective tier.
 */
export async function verifyReceipt(
  receipt: string,
  productId: string,
): Promise<ReceiptVerificationResponse> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    const response = await apiClient.post<ReceiptVerificationResponse>(
      '/api/subscription/verify',
      {
        receipt,
        platform,
        product_id: productId,
      } satisfies ReceiptVerificationPayload,
    );

    return response.data;
  } catch (error) {
    console.warn('Receipt verification failed:', error);
    // On verification failure, assume free tier (safe default)
    return {
      valid: false,
      tier: 'free',
      expires_at: null,
      error: 'Receipt validation failed. Please try again.',
    };
  }
}

// ---------------------------------------------------------------------------
// Purchase Listener
// ---------------------------------------------------------------------------

/**
 * Handles purchase updates from the store.
 * Called automatically by expo-in-app-purchases when a purchase completes.
 */
async function handlePurchaseUpdate(
  result: InAppPurchases.IAPQueryResponse<InAppPurchases.InAppPurchase>,
): Promise<void> {
  if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
    const purchase = result.results?.[0];
    if (!purchase) {
      onPurchaseError?.('Purchase completed but no receipt was returned.');
      return;
    }

    const receipt = extractReceipt(purchase);
    if (!receipt) {
      onPurchaseError?.('Unable to extract purchase receipt.');
      return;
    }

    // Verify receipt with backend
    const verification = await verifyReceipt(receipt, purchase.productId);

    if (verification.valid) {
      // Acknowledge the purchase to prevent refund
      if (Platform.OS === 'android') {
        try {
          await InAppPurchases.finishTransactionAsync(purchase, true);
        } catch (error) {
          console.warn('Failed to acknowledge Android purchase:', error);
        }
      }

      onPurchaseComplete?.({
        success: true,
        tier: verification.tier as VibePlayerTier,
        expiresAt: verification.expires_at ?? undefined,
      });
    } else {
      onPurchaseError?.(
        verification.error ?? 'Purchase verification failed. Please contact support.',
      );
    }
  } else if (result.responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
    onPurchaseError?.('Purchase was cancelled.');
  } else if (result.responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
    // iOS: Purchase requires parental approval (Ask to Buy)
    onPurchaseError?.('Purchase is pending approval. You will be notified when it completes.');
  } else {
    onPurchaseError?.('Purchase failed. Please try again.');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await initializeIAP();
  }
}

function extractReceipt(purchase: InAppPurchases.InAppPurchase): string | null {
  if (Platform.OS === 'ios') {
    // iOS: receipt is the App Store receipt
    return purchase.transactionReceipt ?? null;
  }

  // Android: receipt is the purchase token
  return purchase.purchaseToken ?? purchase.transactionReceipt ?? null;
}

function productIdToTier(productId: string): VibePlayerTier {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  if (productId === IAP_PRODUCT_IDS.SACRED_MONTHLY[platform]) {
    return 'sacred';
  }
  if (productId === IAP_PRODUCT_IDS.DIVINE_MONTHLY[platform]) {
    return 'divine';
  }
  return 'free';
}

/**
 * Return default products when store products can't be fetched.
 * Uses hardcoded pricing as a fallback.
 */
function getDefaultProducts(): IAPProduct[] {
  return [
    {
      productId: IAP_PRODUCT_IDS.SACRED_MONTHLY[Platform.OS === 'ios' ? 'ios' : 'android'],
      title: TIER_CONFIGS.sacred.name,
      description: TIER_CONFIGS.sacred.description,
      price: '$4.99',
      priceAmountMicros: 4990000,
      priceCurrencyCode: 'USD',
      tier: 'sacred',
    },
    {
      productId: IAP_PRODUCT_IDS.DIVINE_MONTHLY[Platform.OS === 'ios' ? 'ios' : 'android'],
      title: TIER_CONFIGS.divine.name,
      description: TIER_CONFIGS.divine.description,
      price: '$14.99',
      priceAmountMicros: 14990000,
      priceCurrencyCode: 'USD',
      tier: 'divine',
    },
  ];
}

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class IAPError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'IAPError';
    this.code = code;
  }
}
