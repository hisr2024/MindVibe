/**
 * In-App Purchase Service for Kiaanverse — 4-Tier Model (March 2026)
 *
 * Stub implementation — expo-in-app-purchases was removed because it is
 * deprecated and incompatible with Gradle 8.8+. Replace with
 * react-native-iap or expo-purchase when ready for production IAP.
 *
 * All public functions maintain the same signature so callers
 * (subscription.tsx, store) compile without changes.
 */

import { Platform } from 'react-native';
import { apiClient } from '../client';
import {
  ALL_PRODUCT_IDS,
  IAP_PRODUCT_IDS,
  TIER_CONFIGS,
  type SubscriptionTier,
  type BillingPeriod,
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

// ---------------------------------------------------------------------------
// Stub implementations (expo-in-app-purchases removed)
// ---------------------------------------------------------------------------

let isInitialized = false;

export async function initializeIAP(): Promise<void> {
  isInitialized = true;
  console.warn('IAP: using stub — expo-in-app-purchases removed. Integrate react-native-iap for production.');
}

export async function disconnectIAP(): Promise<void> {
  isInitialized = false;
}

export async function getProducts(): Promise<IAPProduct[]> {
  return getDefaultProducts();
}

export async function purchaseSubscription(
  tier: SubscriptionTier,
  billingPeriod: BillingPeriod = 'monthly',
  callbacks?: {
    onComplete?: (result: PurchaseResult) => void;
    onError?: (error: string) => void;
  },
): Promise<void> {
  callbacks?.onError?.('In-app purchases are not yet available. Please subscribe via the web at kiaanverse.com/pricing');
}

export async function restorePurchases(): Promise<PurchaseResult> {
  return {
    success: false,
    tier: 'free',
    error: 'In-app purchase restore is not yet available. Please contact support.',
  };
}

export async function verifyReceipt(
  receipt: string,
  productId: string,
): Promise<ReceiptVerificationResponse> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  try {
    const response = await apiClient.post<ReceiptVerificationResponse>(
      '/api/subscription/verify',
      { receipt, platform, product_id: productId } satisfies ReceiptVerificationPayload,
    );
    return response.data;
  } catch {
    return { valid: false, tier: 'free', expires_at: null, error: 'Receipt validation failed.' };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export class IAPError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'IAPError';
    this.code = code;
  }
}

function getDefaultProducts(): IAPProduct[] {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return [
    {
      productId: IAP_PRODUCT_IDS.BHAKTA_MONTHLY[platform],
      title: TIER_CONFIGS.bhakta.name,
      description: TIER_CONFIGS.bhakta.description,
      price: '$6.99',
      priceAmountMicros: 6990000,
      priceCurrencyCode: 'USD',
      tier: 'bhakta',
      billingPeriod: 'monthly',
    },
    {
      productId: IAP_PRODUCT_IDS.BHAKTA_YEARLY[platform],
      title: TIER_CONFIGS.bhakta.name,
      description: TIER_CONFIGS.bhakta.description,
      price: '$59.99',
      priceAmountMicros: 59990000,
      priceCurrencyCode: 'USD',
      tier: 'bhakta',
      billingPeriod: 'yearly',
    },
    {
      productId: IAP_PRODUCT_IDS.SADHAK_MONTHLY[platform],
      title: TIER_CONFIGS.sadhak.name,
      description: TIER_CONFIGS.sadhak.description,
      price: '$12.99',
      priceAmountMicros: 12990000,
      priceCurrencyCode: 'USD',
      tier: 'sadhak',
      billingPeriod: 'monthly',
    },
    {
      productId: IAP_PRODUCT_IDS.SADHAK_YEARLY[platform],
      title: TIER_CONFIGS.sadhak.name,
      description: TIER_CONFIGS.sadhak.description,
      price: '$109.99',
      priceAmountMicros: 109990000,
      priceCurrencyCode: 'USD',
      tier: 'sadhak',
      billingPeriod: 'yearly',
    },
    {
      productId: IAP_PRODUCT_IDS.SIDDHA_MONTHLY[platform],
      title: TIER_CONFIGS.siddha.name,
      description: TIER_CONFIGS.siddha.description,
      price: '$22.99',
      priceAmountMicros: 22990000,
      priceCurrencyCode: 'USD',
      tier: 'siddha',
      billingPeriod: 'monthly',
    },
    {
      productId: IAP_PRODUCT_IDS.SIDDHA_YEARLY[platform],
      title: TIER_CONFIGS.siddha.name,
      description: TIER_CONFIGS.siddha.description,
      price: '$199.99',
      priceAmountMicros: 199990000,
      priceCurrencyCode: 'USD',
      tier: 'siddha',
      billingPeriod: 'yearly',
    },
  ];
}
