/**
 * Subscription module — IAP service, constants, and types for Kiaanverse.
 * 4-tier model: Seeker (Free) / Bhakta / Sadhak / Siddha (March 2026)
 */

export {
  type SubscriptionTier,
  type BillingPeriod,
  type TierConfig,
  TIER_CONFIGS,
  TIER_RANK,
  IAP_PRODUCT_IDS,
  ALL_PRODUCT_IDS,
  KIAAN_MONTHLY_QUOTA,
  WISDOM_JOURNEY_LIMITS,
} from './constants';

export {
  initializeIAP,
  disconnectIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  verifyReceipt,
  IAPError,
  type IAPProduct,
  type PurchaseResult,
  type ReceiptVerificationPayload,
  type ReceiptVerificationResponse,
} from './iapService';
